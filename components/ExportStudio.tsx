
import React, { useState, useRef } from 'react';
import { Shot, Asset } from '../types';
import { Play, Download, Video, Loader2, Mic, ArrowLeftRight, Music, ArrowUp, ArrowDown, Upload } from 'lucide-react';

interface ExportStudioProps {
  shots: Shot[];
  assets: Asset[]; // Need assets to populate dropdowns
}

export const ExportStudio: React.FC<ExportStudioProps> = ({ shots, assets }) => {
  const [generatingVideo, setGeneratingVideo] = useState<string | null>(null);
  const [activeShotId, setActiveShotId] = useState<string>(shots[0]?.id || '');
  const [studioShots, setStudioShots] = useState<Shot[]>(shots);
  const uploadVideoRef = useRef<HTMLInputElement>(null);

  // Filter Assets
  const musicAssets = assets.filter(a => a.type === 'MUSIC');
  const voiceAssets = assets.filter(a => a.type === 'VOICE');

  const activeShot = studioShots.find(s => s.id === activeShotId);

  const handleGenerateVideo = (shotId: string) => {
    setGeneratingVideo(shotId);
    // Mock Generation Process
    setTimeout(() => {
      setStudioShots(prev => prev.map(s => s.id === shotId ? { ...s, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' } : s));
      setGeneratingVideo(null);
    }, 3000);
  };

  const handleMoveShot = (index: number, direction: 'up' | 'down') => {
      const newShots = [...studioShots];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newShots.length) {
          [newShots[index], newShots[targetIndex]] = [newShots[targetIndex], newShots[index]];
          setStudioShots(newShots);
      }
  };

  const handleDownloadVideo = (shot: Shot) => {
      if (shot.videoUrl) {
          const a = document.createElement('a');
          a.href = shot.videoUrl;
          a.download = `shot_${shot.sequence}_video.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeShot) {
          const url = URL.createObjectURL(file);
          setStudioShots(prev => prev.map(s => s.id === activeShot.id ? { ...s, videoUrl: url } : s));
      }
      if (e.target) e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100">
      <input type="file" ref={uploadVideoRef} className="hidden" accept="video/*" onChange={handleUploadVideo} />

      {/* Top Toolbar */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
        <h2 className="font-bold text-xl flex items-center gap-2">
          <Video className="w-5 h-5 text-red-500" /> 合成输出
        </h2>
        <div className="flex gap-4">
             {/* Global BGM Selector */}
             <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <Music className="w-3 h-3 text-blue-400" />
                <select className="bg-transparent outline-none text-slate-300">
                    <option value="">无背景音乐</option>
                    {musicAssets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
             </div>
            <button onClick={() => alert("Rendering Full Project Sequence...")} className="bg-slate-100 text-slate-900 px-4 py-2 rounded font-bold text-sm flex items-center gap-2">
                <Download className="w-4 h-4" /> 导出工程 (.mp4)
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline */}
        <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col overflow-y-auto">
           {studioShots.map((shot, index) => (
               <div key={shot.id} className="relative group/shot">
                   {/* Shot Item */}
                   <div 
                     onClick={() => setActiveShotId(shot.id)}
                     className={`p-3 border-b border-slate-800 cursor-pointer flex gap-3 hover:bg-slate-800/50 ${activeShotId === shot.id ? 'bg-slate-800 border-l-4 border-l-blue-500' : ''}`}
                   >
                       <div className="w-20 h-12 bg-black rounded flex-shrink-0 overflow-hidden">
                           <img src={shot.imageUrl} className="w-full h-full object-cover opacity-80" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                               <span>SEQ {shot.sequence}</span>
                               <span>{shot.shotType}</span>
                           </div>
                           <p className="text-xs truncate text-slate-300">{shot.scriptContent}</p>
                       </div>
                       
                       {/* Reorder Buttons */}
                       <div className="flex flex-col justify-center gap-1 opacity-0 group-hover/shot:opacity-100">
                           <button onClick={(e) => {e.stopPropagation(); handleMoveShot(index, 'up')}} disabled={index === 0} className="hover:text-white text-slate-500 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                           <button onClick={(e) => {e.stopPropagation(); handleMoveShot(index, 'down')}} disabled={index === studioShots.length - 1} className="hover:text-white text-slate-500 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                       </div>
                   </div>
                   {/* Transition Node */}
                   {index < studioShots.length - 1 && (
                       <div className="absolute bottom-[-10px] left-10 z-10">
                           <div className="bg-slate-700 rounded-full p-0.5 border border-slate-900 text-slate-400 hover:text-white cursor-pointer" title="转场">
                               <ArrowLeftRight className="w-2 h-2" />
                           </div>
                       </div>
                   )}
               </div>
           ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-black relative">
            {activeShot ? (
                <>
                {/* Preview */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    <div className="relative aspect-video h-full max-w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 group/video">
                        {activeShot.videoUrl ? (
                            <video src={activeShot.videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full relative">
                                <img src={activeShot.imageUrl} className="w-full h-full object-contain opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button onClick={() => handleGenerateVideo(activeShot.id)} className="bg-red-600 hover:bg-red-500 text-white rounded-full p-4 transition-transform hover:scale-110">
                                        {generatingVideo === activeShot.id ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 ml-1" />}
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-0 w-full text-center text-slate-400 text-sm">点击生成动态预览 (视频模型)</div>
                            </div>
                        )}
                        
                        {/* Video Actions Overlay */}
                        {activeShot.videoUrl && (
                             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity">
                                 <button onClick={() => handleDownloadVideo(activeShot)} className="bg-black/70 hover:bg-blue-600 text-white p-2 rounded-full" title="下载当前视频">
                                     <Download className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => uploadVideoRef.current?.click()} className="bg-black/70 hover:bg-blue-600 text-white p-2 rounded-full" title="上传替换视频">
                                     <Upload className="w-4 h-4" />
                                 </button>
                             </div>
                        )}
                    </div>
                </div>

                {/* Shot Properties Panel */}
                <div className="h-48 bg-slate-900 border-t border-slate-800 p-6 flex gap-8">
                    {/* Audio Config */}
                    <div className="w-1/3 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Mic className="w-3 h-3"/> 配音设置</h4>
                        <div className="p-2 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700 min-h-[40px]">
                            {activeShot.scriptContent}
                        </div>
                        <div className="flex gap-2">
                             <select className="flex-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 p-1.5 outline-none">
                                 <option value="">选择音色...</option>
                                 {voiceAssets.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                             </select>
                             <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-500">生成</button>
                        </div>
                    </div>
                </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600">选择左侧镜头开始编辑</div>
            )}
        </div>
      </div>
    </div>
  );
};
