
import React from 'react';
import { Film, Download, AlertCircle } from 'lucide-react';

interface VideoResultProps {
  videoUrl: string | null;
  error?: string | null;
}

export const VideoResult: React.FC<VideoResultProps> = ({ videoUrl, error }) => {
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-bottom-4">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 h-64 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600">
        <Film className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm">等待生成结果...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        <div className="relative aspect-video">
          <video 
            src={videoUrl} 
            controls 
            autoPlay 
            loop 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 bg-slate-800 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            <span className="text-green-400 font-bold mr-2">● 完成</span>
            生成成功
          </div>
          <a 
            href={videoUrl} 
            download="generated_video.mp4"
            className="flex items-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            下载视频
          </a>
        </div>
      </div>
    </div>
  );
};
