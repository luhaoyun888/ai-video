
import React, { useRef } from 'react';
import { Shot, Asset, ProjectSettings, ArtStyle } from '../types';
import { Film, Image as ImageIcon, Edit2, Wand2, Upload, Plus, Download, Save } from 'lucide-react';
import { ComfyService } from '../services/comfyService';

interface VisualStoryboardProps {
  shots: Shot[];
  assets: Asset[];
  artStyle: ArtStyle;
  onUpdateShot: (shot: Shot) => void;
  onAddAssetFromShot: (url: string) => void;
  onNext: () => void;
  settings: ProjectSettings;
}

export const VisualStoryboard: React.FC<VisualStoryboardProps> = ({ 
    shots, 
    assets, 
    artStyle,
    onUpdateShot, 
    onAddAssetFromShot,
    onNext, 
    settings 
}) => {
  const comfyService = new ComfyService(settings.comfyUiUrl, settings.generationEngine);
  const midFrameInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const activeShotRef = useRef<string | null>(null);

  const generateShotImage = async (shot: Shot, type: 'start' | 'end') => {
    onUpdateShot({ ...shot, status: 'GENERATING' });
    
    // 1. Asset Gathering
    let relevantAssets = assets.filter(a => shot.assignedAssetIds.includes(a.id));
    if (relevantAssets.length === 0) relevantAssets = assets.filter(a => shot.scriptContent.includes(a.name));

    const assetRefs = relevantAssets
        .filter(a => ['CHARACTER', 'SCENE'].includes(a.type) && a.status === 'LOCKED' && a.referenceImage)
        .map(a => ({ name: a.name, visualPrompt: a.visualPrompt, imageUrl: a.referenceImage }));

    // 2. LoRA Construction
    const modelAssets = relevantAssets.filter(a => a.type === 'MODEL' && a.localPath);
    let loraTags = '';
    modelAssets.forEach(m => {
        if (m.localPath) {
            const filename = m.localPath.replace('.safetensors', '').replace('.ckpt', '');
            loraTags += `<lora:${filename}:1.0> ${m.triggerWords || ''}, `;
        }
    });
    
    // Style LoRA if defined in project style
    if (artStyle.loraModel) {
        loraTags += `<lora:${artStyle.loraModel}:${artStyle.loraWeight || 0.8}>, `;
    }

    try {
        // 3. Prompt Engineering with Art Style
        const stylePrefix = `(${artStyle.positivePrompt}), `;
        const fullPrompt = `${stylePrefix} ${loraTags} ${shot.visualPrompt}`;
        const negPrompt = `${artStyle.negativePrompt}, blurry, ugly, low quality`;

        const inputImage = type === 'end' ? shot.imageUrl : undefined;
        if (type === 'end' && !inputImage) {
            alert("请先生成首帧");
            onUpdateShot({ ...shot, status: 'PENDING' });
            return;
        }

        const seed = Math.floor(Math.random() * 999999);
        const url = await comfyService.generateImage(fullPrompt, negPrompt, seed, assetRefs, inputImage);

        const updates: Partial<Shot> = { status: 'DONE' };
        if (type === 'start') updates.imageUrl = url;
        else updates.endFrameUrl = url;
        
        onUpdateShot({ ...shot, ...updates });

    } catch (e) {
        onUpdateShot({ ...shot, status: 'PENDING' });
    }
  };

  const triggerUpload = (shotId: string, type: 'mid' | 'end') => {
      activeShotRef.current = shotId;
      if (type === 'mid') midFrameInputRef.current?.click();
      else endFrameInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'mid' | 'end') => {
      const files = e.target.files;
      if (files && files.length > 0 && activeShotRef.current) {
          const shot = shots.find(s => s.id === activeShotRef.current);
          if (shot) {
              const urls = Array.from(files).map(f => URL.createObjectURL(f as Blob));
              if (type === 'mid') {
                  const currentMids = shot.middleFrameUrls || [];
                  onUpdateShot({ ...shot, middleFrameUrls: [...currentMids, ...urls] });
              } else {
                  onUpdateShot({ ...shot, endFrameUrl: urls[0] });
              }
          }
      }
      activeShotRef.current = null;
      if(e.target) e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <input type="file" multiple ref={midFrameInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'mid')} />
      <input type="file" ref={endFrameInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'end')} />

      <div className="p-6 border-b border-slate-700 bg-slate-900 sticky top-0 z-20 flex justify-between items-center shadow-md">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Film className="w-6 h-6 text-indigo-400" />
            可视化分镜台
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded border border-purple-700">
                 当前画风: {artStyle.label}
             </span>
             <p className="text-slate-400 text-sm">自动注入风格提示词与资产一致性控制。</p>
          </div>
        </div>
        <button onClick={onNext} className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white flex items-center gap-2">
          <Wand2 className="w-4 h-4" /> 下一步
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        <div className="space-y-8 max-w-7xl mx-auto">
          {shots.map((shot) => (
            <div key={shot.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col gap-4">
              {/* Info Bar */}
              <div className="flex gap-4 border-b border-slate-800 pb-4">
                  <div className="w-16 h-16 bg-slate-800 rounded flex flex-col items-center justify-center font-mono font-bold text-xl border border-slate-700">
                      <span>{shot.sequence}</span>
                      <span className="text-[10px] text-slate-500 font-normal">SHOT</span>
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">{shot.shotType}</span>
                          <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">{shot.cameraMovement}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">"{shot.scriptContent}"</p>
                      <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-indigo-300 font-mono"
                        value={shot.visualPrompt}
                        onChange={(e) => onUpdateShot({ ...shot, visualPrompt: e.target.value })}
                        placeholder="Stable Diffusion Prompt..."
                      />
                  </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                  <div className="flex-shrink-0 w-64">
                      <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">首帧 (Start)</div>
                      <div className="aspect-video bg-black rounded border border-slate-700 relative overflow-hidden group">
                          {shot.imageUrl ? (
                              <>
                                <img src={shot.imageUrl} className="w-full h-full object-contain" />
                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => generateShotImage(shot, 'start')} className="bg-black/60 p-1.5 rounded text-white" title="重绘"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => { if(confirm("将此图存为新资产?")) onAddAssetFromShot(shot.imageUrl!) }} className="bg-blue-600/80 p-1.5 rounded text-white" title="存为资产"><Save className="w-4 h-4" /></button>
                                </div>
                              </>
                          ) : (
                              <button onClick={() => generateShotImage(shot, 'start')} className="w-full h-full flex flex-col items-center justify-center text-slate-600 hover:text-indigo-400">
                                  {shot.status === 'GENERATING' ? <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"/> : <ImageIcon className="w-8 h-8" />}
                                  <span className="text-xs mt-2">生成首帧</span>
                              </button>
                          )}
                      </div>
                  </div>

                  <div className="flex-1 min-w-[100px] flex items-center justify-center relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full h-0.5 bg-slate-800"></div></div>
                      <div className="relative z-10 flex gap-2 overflow-x-auto max-w-full px-2">
                          {shot.middleFrameUrls?.map((url, i) => (
                              <div key={i} className="w-20 h-20 bg-slate-800 rounded border border-slate-600 flex-shrink-0 overflow-hidden relative group">
                                  <img src={url} className="w-full h-full object-cover" />
                                  <button onClick={() => onUpdateShot({...shot, middleFrameUrls: shot.middleFrameUrls?.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-600 text-white p-0.5 opacity-0 group-hover:opacity-100"><span className="text-[10px]">✕</span></button>
                              </div>
                          ))}
                          <button onClick={() => triggerUpload(shot.id, 'mid')} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white"><Plus className="w-4 h-4" /></button>
                      </div>
                  </div>

                  <div className="flex-shrink-0 w-64">
                      <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">尾帧 (End)</div>
                      <div className="aspect-video bg-black rounded border border-slate-700 relative overflow-hidden group border-dashed">
                          {shot.endFrameUrl ? (
                              <img src={shot.endFrameUrl} className="w-full h-full object-contain" />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                  <button onClick={() => generateShotImage(shot, 'end')} className="text-xs bg-slate-800 px-3 py-1.5 rounded hover:bg-indigo-900 text-indigo-300">基于首帧生成</button>
                                  <button onClick={() => triggerUpload(shot.id, 'end')} className="text-xs text-slate-500 hover:text-white flex items-center gap-1"><Upload className="w-3 h-3" /> 上传</button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
