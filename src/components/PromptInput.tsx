
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          placeholder="描述你想要的视频画面... (例如: 赛博朋克风格的侦探在雨夜行走)"
          className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 pr-32 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none h-32 shadow-xl"
        />
        
        <div className="absolute bottom-4 right-4">
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all
              ${isLoading || !prompt.trim()
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/20'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                开始生成
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
