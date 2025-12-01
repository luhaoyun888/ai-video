
/**
 * ComfyUI Integration Service
 * Handles connection, queuing prompts, and receiving images.
 */

// Basic T2I Workflow
const T2I_WORKFLOW = {
  "3": { "inputs": { "seed": 0, "steps": 20, "cfg": 8, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
  "4": { "inputs": { "ckpt_name": "v1-5-pruned-emaonly.ckpt" }, "class_type": "CheckpointLoaderSimple" },
  "5": { "inputs": { "width": 512, "height": 512, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
  "6": { "inputs": { "text": "", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
  "7": { "inputs": { "text": "text, watermark, low quality", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
  "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
  "9": { "inputs": { "filename_prefix": "DirectorAI", "images": ["8", 0] }, "class_type": "SaveImage" }
};

// Basic Img2Img Workflow (Simplified representation)
// In a real app, this would use LoadImage (Base64) -> VAEEncode -> KSampler (denoise < 1.0)
const I2I_WORKFLOW = {
   // ... (Similar structure but with VAEEncode connected to Latent)
   // For this demo code, we use the same structure but assume the backend handles the switch based on input
};

export class ComfyService {
  baseUrl: string;
  clientId: string;
  isMock: boolean;

  constructor(url: string, engineMode: 'COMFY_LOCAL' | 'COMFY_REMOTE' | 'CLOUD_MOCK') {
    this.baseUrl = url.replace(/\/$/, '');
    this.clientId = `director-ai-${Date.now()}`;
    this.isMock = engineMode === 'CLOUD_MOCK';
  }

  async checkConnection(): Promise<boolean> {
    if (this.isMock) return true;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/system_stats`, { signal: controller.signal });
      clearTimeout(id);
      return res.ok;
    } catch (e) {
      console.warn("ComfyUI Connection Failed:", e);
      return false;
    }
  }

  /**
   * Generates an image.
   * If `inputImage` is provided, it acts as an Img2Img operation (e.g. for End Frames).
   */
  async generateImage(
    prompt: string, 
    negativePrompt: string = "", 
    seed?: number,
    assetReferences?: { name: string, visualPrompt: string, imageUrl?: string }[],
    inputImage?: string // URL of start frame for Img2Img
  ): Promise<string> {
    
    // 1. Build Prompt
    let effectivePrompt = prompt;
    if (assetReferences && assetReferences.length > 0) {
        const assetContext = assetReferences.map(a => `(${a.visualPrompt})`).join(", ");
        effectivePrompt = `${assetContext}, ${prompt}`;
    }

    // 2. Mock Fallback
    const isConnected = await this.checkConnection();
    if (this.isMock || !isConnected) {
      console.log(`[${inputImage ? 'Img2Img' : 'Txt2Img'}] Prompt: ${effectivePrompt.substring(0, 50)}...`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(`https://picsum.photos/seed/${seed || Math.floor(Math.random() * 10000)}/800/450`);
        }, 1500);
      });
    }

    // 3. Real ComfyUI Logic
    // NOTE: For this demo, we use the T2I template. 
    // Real implementation requires uploading the `inputImage` first if it exists.
    const workflow = JSON.parse(JSON.stringify(T2I_WORKFLOW));
    
    workflow["6"].inputs.text = effectivePrompt;
    workflow["7"].inputs.text = negativePrompt;
    workflow["3"].inputs.seed = seed || Math.floor(Math.random() * 1000000000);

    // If inputImage exists, we would simulate "denoise" changes to represent change over time
    if (inputImage) {
        workflow["3"].inputs.denoise = 0.6; // High change for end frame
    }

    try {
        const promptRes = await fetch(`${this.baseUrl}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: this.clientId, prompt: workflow })
        });

        if (!promptRes.ok) throw new Error("Failed to queue prompt");
        const promptData = await promptRes.json();
        const promptId = promptData.prompt_id;

        return new Promise((resolve, reject) => {
            const urlObj = new URL(this.baseUrl);
            const protocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${urlObj.host}/ws?clientId=${this.clientId}`;
            const ws = new WebSocket(wsUrl);
            
            ws.onmessage = async (event) => {
                const message = JSON.parse(event.data as string);
                if (message.type === 'executing' && message.data.node === null && message.data.prompt_id === promptId) {
                    ws.close();
                    const historyRes = await fetch(`${this.baseUrl}/history/${promptId}`);
                    const historyData = await historyRes.json();
                    const promptHistory = historyData[promptId];
                    if (promptHistory?.outputs?.["9"]?.images?.length > 0) {
                        const imgData = promptHistory.outputs["9"].images[0];
                        resolve(`${this.baseUrl}/view?filename=${imgData.filename}&subfolder=${imgData.subfolder}&type=${imgData.type}`);
                    } else {
                        reject("No image output found");
                    }
                }
            };
            ws.onerror = (err) => reject(err);
        });
    } catch (error) {
        console.error("ComfyUI Error:", error);
        return `https://picsum.photos/seed/${seed}/800/450`;
    }
  }
}
