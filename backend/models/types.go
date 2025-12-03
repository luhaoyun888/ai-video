package models

// GenerateRequest 接收前端发送的 JSON
type GenerateRequest struct {
	Prompt string `json:"prompt" binding:"required"`
	// 可扩展其他字段，如 Style string `json:"style"`
}

// GenerateResponse 返回给前端的 JSON
type GenerateResponse struct {
	Success  bool   `json:"success"`
	VideoURL string `json:"videoUrl"`          // 对应前端的 videoUrl
	Error    string `json:"error,omitempty"`   // 错误信息，为空时不返回
}
