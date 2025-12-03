package main

import (
	"log"
	"os"
	"video-backend/handlers" // 确保这里 module 名和你 go.mod 中的一致

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 1. 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, relying on system env vars")
	}

	// 2. 初始化 Gin 引擎
	r := gin.Default()

	// 3. 配置 CORS (允许前端 localhost:3000 访问)
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // 你的 Next.js 地址
	config.AllowMethods = []string{"POST", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// 4. 定义路由
	api := r.Group("/api")
	{
		api.POST("/generate", handlers.GenerateVideo)
	}

	// 5. 启动服务 (8080端口)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Backend running on http://localhost:%s", port)
	r.Run(":" + port)
}
