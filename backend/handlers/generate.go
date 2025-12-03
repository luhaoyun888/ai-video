package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"video-backend/models"

	"github.com/gin-gonic/gin"
)

// GenerateVideo 处理视频生成请求
func GenerateVideo(c *gin.Context) {
	var req models.GenerateRequest

	// 1. 解析前端传入的 JSON 参数
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.GenerateResponse{
			Success: false,
			Error:   "Invalid request: prompt is required",
		})
		return
	}

	// 2. 获取 API Key (从环境变量，严禁硬编码)
	apiKey := os.Getenv("AI_API_KEY")
	apiURL := os.Getenv("AI_API_URL")

	if apiKey == "" || apiURL == "" {
		c.JSON(http.StatusInternalServerError, models.GenerateResponse{
			Success: false,
			Error:   "Server configuration error: API Key or URL missing",
		})
		return
	}

	// 3. 构建第三方 AI 服务的请求 Payload
	// TODO: 【重要】请根据你原本前端代码中的 body 结构修改这里
	// 假设第三方 AI 接收的格式是 { "text_prompts": [{ "text": "..." }] } 或者简单的 { "prompt": "..." }
	upstreamPayload := map[string]interface{}{
		"prompt": req.Prompt, 
		// "model": "video-generation-v1", // 如果有其他必要参数，在这里添加
	}

	jsonData, err := json.Marshal(upstreamPayload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.GenerateResponse{Success: false, Error: "Failed to process request data"})
		return
	}

	// 4. 发起 HTTP 请求调用第三方 AI
	client := &http.Client{}
	request, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.GenerateResponse{Success: false, Error: "Failed to create request"})
		return
	}

	// 设置请求头
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+apiKey) // 大多数 API 使用 Bearer Token
	// request.Header.Set("X-API-KEY", apiKey) // 如果是其他 Key 格式，请修改此处

	// 发送请求
	resp, err := client.Do(request)
	if err != nil {
		c.JSON(http.StatusBadGateway, models.GenerateResponse{Success: false, Error: "Failed to contact AI provider"})
		return
	}
	defer resp.Body.Close()

	// 5. 处理第三方返回的结果
	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		// 记录错误日志以便调试
		fmt.Printf("Upstream Error: %s\n", string(bodyBytes))
		c.JSON(http.StatusBadGateway, models.GenerateResponse{
			Success: false, 
			Error: fmt.Sprintf("AI Provider returned error: %d", resp.StatusCode),
		})
		return
	}

	// 解析第三方返回的 JSON，提取视频 URL
	// 假设第三方返回结构为: { "output": { "url": "..." } } 或 { "video_url": "..." }
	var upstreamResp map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &upstreamResp); err != nil {
		c.JSON(http.StatusInternalServerError, models.GenerateResponse{Success: false, Error: "Failed to parse AI response"})
		return
	}

	// TODO: 【重要】根据实际返回结构提取 URL
	// 这是一个示例逻辑，请根据你之前的 console.log 调整
	var finalVideoURL string
	
	// 示例：如果返回是 { "url": "http://..." }
	if url, ok := upstreamResp["url"].(string); ok {
		finalVideoURL = url
	} else if output, ok := upstreamResp["output"].(string); ok {
		// 某些 API 把 URL 放在 output 字段
		finalVideoURL = output
	} else {
		// 如果没找到 URL，返回模拟数据或报错
		// finalVideoURL = "https://www.w3schools.com/html/mov_bbb.mp4" // 仅用于测试
		c.JSON(http.StatusInternalServerError, models.GenerateResponse{Success: false, Error: "Video URL not found in response"})
		return
	}

	// 6. 返回最终结果给前端
	c.JSON(http.StatusOK, models.GenerateResponse{
		Success:  true,
		VideoURL: finalVideoURL,
	})
}
