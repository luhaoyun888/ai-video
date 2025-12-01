
// 定义前后端交互的标准化数据契约

export interface GenerateRequest {
  prompt: string;
  style?: string; // 例如: "Cyberpunk", "Anime"
  duration?: number; // 视频时长，默认 5s
}

export interface GenerateResponse {
  success: boolean;
  videoUrl?: string;
  message?: string; // 用于成功消息或错误描述
  error?: string;   // 具体的错误代码
}
