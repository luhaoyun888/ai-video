
import React, { useState } from 'react';
import { PromptInput } from '../components/PromptInput';
import { VideoResult } from '../components/VideoResult';
import { GenerateRequest, GenerateResponse } from '../types';
import { Clapperboard } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 核心逻辑重构：调用 Go 后端，而不是直接调第三方 API
  const handleGenerate = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      // 构建请求体 (符合 Data Contract)
      const requestData: GenerateRequest = {
        prompt,
        style: "Cinematic", // 可以从 UI 扩展此选项
        duration: 5
      };

      // 发起请求到本地 Go 后端
      const response = await fetch('http://localhost:8080/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GenerateResponse = await response.json();

      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else {
        setError(data.error || 'Unknown error occurred');
      }

    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "无法连接到后端服务，请确认 Go 服务已启动 (localhost:8080)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="py-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DirectorAI Cloud
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Next.js + Golang Architecture
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col gap-10">
        
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight">
            从文本到大片，<br/>
            <span className="text-blue-500">仅需一秒。</span>
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            输入你的创意灵感，我们的 Go 高性能后端将自动调度 AI 算力，为你生成工业级视频素材。
          </p>
        </div>

        {/* Component: Prompt Input */}
        <PromptInput onSubmit={handleGenerate} isLoading={isLoading} />

        {/* Component: Video Result */}
        <VideoResult videoUrl={videoUrl} error={error} />
        
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-sm border-t border-slate-900 mt-auto">
        <p>© 2024 DirectorAI Workstation. Powered by Next.js & Gin.</p>
      </footer>
    </div>
  );
}
