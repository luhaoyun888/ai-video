
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Chinese Name (e.g. 李雷)" },
          description: { type: Type.STRING, description: "Character role and basic info in Chinese" },
          visualPrompt: { type: Type.STRING, description: "Detailed visual description in English tags for Stable Diffusion (e.g., '1girl, detective, trench coat, cyberpunk city background, neon lights, highly detailed face')" },
        },
        required: ["name", "description", "visualPrompt"],
      },
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Chinese Scene Name (e.g. 废弃工厂)" },
          description: { type: Type.STRING, description: "Atmosphere and location info in Chinese" },
          visualPrompt: { type: Type.STRING, description: "Detailed environment description in English tags (e.g., 'futuristic city street, rain, neon signs, wet ground, cinematic lighting, 8k')" },
        },
        required: ["name", "description", "visualPrompt"],
      },
    },
    shots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          sequence: { type: Type.INTEGER },
          scriptContent: { type: Type.STRING },
          visualPrompt: { type: Type.STRING, description: "A highly descriptive stable diffusion prompt for this specific shot" },
          shotType: { type: Type.STRING, description: "e.g., Wide Shot, Close Up" },
          cameraMovement: { type: Type.STRING, description: "e.g., Pan, Tilt, Dolly" },
          involved_character_names: { type: Type.ARRAY, items: { type: Type.STRING } },
          involved_scene_name: { type: Type.STRING },
        },
        required: ["id", "sequence", "scriptContent", "visualPrompt", "shotType", "cameraMovement"],
      },
    },
  },
  required: ["characters", "scenes", "shots"],
};

export const DEFAULT_SYSTEM_INSTRUCTION = `You are an expert Film Director and Storyboard Artist AI (AI导演与分镜师). 
Your task is to analyze a raw script (Chinese or English) and break it down into a structured production plan.

1. **Assets Extraction**: Extract all key Characters (角色) and Scenes (场景). 
   - **CRITICAL**: The 'name' field MUST be in **Simplified Chinese** (e.g., "张三", "赛博街道").
   - **CRITICAL**: The 'visualPrompt' MUST be in **English** tags for Stable Diffusion.
2. **Shot Breakdown**: Break the script into individual Shots (分镜).
3. **Visual Translation**: Translate abstract emotions into concrete visual descriptions.

Output valid JSON matching the schema.`;

export const parseScriptWithGemini = async (scriptText: string, customInstruction?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: scriptText,
      config: {
        systemInstruction: customInstruction || DEFAULT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw error;
  }
};
