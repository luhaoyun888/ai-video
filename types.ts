
export enum WorkflowStep {
  SCRIPT = 'SCRIPT',
  ASSETS = 'ASSETS',
  STORYBOARD = 'STORYBOARD',
  EXPORT = 'EXPORT',
  SETTINGS = 'SETTINGS',
}

// Updated Asset Types
export type AssetType = 'CHARACTER' | 'SCENE' | 'PROP' | 'MUSIC' | 'VOICE' | 'MODEL';
export type AssetScope = 'PROJECT' | 'GLOBAL';

// --- Parsing Rule Definition ---
export interface ParsingRule {
  id: string;
  name: string;
  systemInstruction: string;
  isDefault?: boolean;
}

// --- Art Style Definition ---
export interface ArtStyle {
  id: string;
  label: string;
  positivePrompt: string; // e.g. "cyberpunk style, neon lights, high contrast"
  negativePrompt: string; // e.g. "natural light, sunshine"
  loraModel?: string;     // Optional style LoRA
  loraWeight?: number;
}

// --- Segmentation Structure ---
export interface ScriptSegment {
  id: string;
  name: string; // e.g. "Chapter 1", "Scene A"
  scriptRaw: string;
  shots: Shot[];
  lastModified: number;
}

export interface ProjectSettings {
  generationEngine: 'COMFY_LOCAL' | 'COMFY_REMOTE' | 'CLOUD_MOCK';
  comfyUiUrl: string;
  autoSave: boolean;
  defaultResolution: string;
  localDataPath: string;
}

export interface AssetUsageLog {
  segmentId: string;
  segmentName: string;
  timestamp: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  visualPrompt: string; 
  tags: string[];
  scope: AssetScope;
  projectId?: string;
  status: 'PENDING' | 'GENERATING' | 'LOCKED' | 'ERROR';
  referenceImage?: string; 
  audioUrl?: string;       
  modelUrl?: string;       
  localPath?: string;      
  triggerWords?: string;   
  candidates?: string[];
  seed?: number;
  usageLog?: AssetUsageLog[]; // Track where this asset is used
}

export interface Shot {
  id: string;
  sequence: number;
  scriptContent: string;
  visualPrompt: string;
  shotType: string;
  cameraMovement: string;
  assignedAssetIds: string[];
  status: 'PENDING' | 'GENERATING' | 'DONE';
  imageUrl?: string;        
  middleFrameUrls?: string[]; 
  endFrameUrl?: string;     
  videoUrl?: string;
  audioUrl?: string;        
  voiceAssetId?: string;    
  transitionType?: string;
}

export interface ProjectMetadata {
  id: string;
  title: string;
  lastModified: number;
  shotCount: number;
  coverImage?: string;
  artStyleLabel?: string;
}

export interface Project {
  id: string;
  title: string;
  directoryPath: string;
  createdAt: number;
  lastModified: number;
  
  // Configuration
  artStyleConfig: ArtStyle;

  // Global Project Assets
  assets: Asset[];
  bgmAssetId?: string;

  // Content Segments
  segments: ScriptSegment[]; 
}
