
import React, { useState, useRef } from 'react';
import { Asset, ProjectSettings, AssetType } from '../types';
import { User, Image as ImageIcon, RefreshCw, Database, Search, Save, Music, Mic, Box, Trash2, Plus, Upload, Unlock, FileCode, Clock } from 'lucide-react';
import { ComfyService } from '../services/comfyService';

interface AssetHubProps {
  projectAssets: Asset[]; 
  globalAssets: Asset[]; 
  onUpdateProjectAssets: (assets: Asset[]) => void;
  onAddToGlobal: (asset: Asset) => void;
  onDeleteGlobalAsset?: (id: string) => void; // Added for deleting global assets
  settings: ProjectSettings;
}

export const AssetHub: React.FC<AssetHubProps> = ({ 
    projectAssets, 
    globalAssets, 
    onUpdateProjectAssets, 
    onAddToGlobal,
    onDeleteGlobalAsset,
    settings 
}) => {
  const [activeTab, setActiveTab] = useState<'PROJECT' | 'GLOBAL'>('PROJECT');
  const [filterType, setFilterType] = useState<AssetType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const comfyService = new ComfyService(settings.comfyUiUrl, settings.generationEngine);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'MEDIA' | 'COVER'>('MEDIA'); 

  // --- CRUD Operations ---

  const handleAddAsset = (type: AssetType) => {
      let baseName = `新建${type === 'CHARACTER' ? '角色' : type === 'SCENE' ? '场景' : type === 'MUSIC' ? '音乐' : type === 'MODEL' ? '模型' : '资产'}`;
      let newName = baseName;
      let counter = 1;
      while (projectAssets.some(a => a.name === newName)) {
          newName = `${baseName}_${counter}`;
          counter++;
      }

      const newAsset: Asset = {
          id: `user_${Date.now()}`,
          name: newName,
          type: type,
          description: '',
          visualPrompt: '',
          tags: ['Manual'],
          scope: 'PROJECT',
          status: 'PENDING'
      };
      onUpdateProjectAssets([...projectAssets, newAsset]);
  };

  const handleDeleteAsset = (id: string) => {
      if(confirm("确定要删除此资产吗？引用记录也将丢失。")) {
        if (activeTab === 'PROJECT') {
            onUpdateProjectAssets(projectAssets.filter(a => a.id !== id));
        } else if (activeTab === 'GLOBAL' && onDeleteGlobalAsset) {
            onDeleteGlobalAsset(id);
        }
      }
  };

  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => {
      if (activeTab === 'PROJECT') {
        onUpdateProjectAssets(projectAssets.map(a => a.id === id ? { ...a, ...updates } : a));
      }
  };

  // --- Generation & File Handling ---

  const handleGenerate = async (asset: Asset) => {
    if (['MUSIC', 'VOICE'].includes(asset.type)) {
        setUploadTargetId(asset.id);
        setUploadType('MEDIA');
        fileInputRef.current?.click();
        return;
    }

    if (asset.type === 'MODEL') return; 

    handleUpdateAsset(asset.id, { status: 'GENERATING' });

    try {
        const seeds = [Math.floor(Math.random() * 100000), Math.floor(Math.random() * 100000) + 1, Math.floor(Math.random() * 100000) + 2, Math.floor(Math.random() * 100000) + 3];
        const promises = seeds.map(seed => comfyService.generateImage(asset.visualPrompt, "ugly, blurry, low quality", seed));
        const urls = await Promise.all(promises);
        handleUpdateAsset(asset.id, { status: 'PENDING', candidates: urls });
    } catch (error) {
        console.error(error);
        handleUpdateAsset(asset.id, { status: 'ERROR' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && uploadTargetId) {
          const url = URL.createObjectURL(file);
          const asset = projectAssets.find(a => a.id === uploadTargetId);
          if (asset) {
             const updates: Partial<Asset> = { };
             if (uploadType === 'COVER') {
                 updates.referenceImage = url;
                 if (asset.type !== 'MODEL') updates.status = 'LOCKED';
             } else {
                 if (asset.type === 'MUSIC' || asset.type === 'VOICE') {
                     updates.audioUrl = url;
                     updates.status = 'LOCKED';
                 } else if (asset.type === 'MODEL') {
                     updates.modelUrl = url;
                     updates.localPath = file.name; 
                 }
             }
             handleUpdateAsset(uploadTargetId, updates);
          }
      }
      setUploadTargetId(null);
      if(e.target) e.target.value = '';
  };

  // --- Filtering ---
  const getFilteredAssets = (assets: Asset[]) => {
      if (assets.length === 0) return [];
      return assets.filter(a => {
          const typeMatch = filterType === 'ALL' || a.type === filterType;
          const searchMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
          return typeMatch && searchMatch;
      });
  };

  const categories: {id: AssetType | 'ALL', label: string, icon: any}[] = [
      { id: 'ALL', label: '全部', icon: Database },
      { id: 'CHARACTER', label: '角色', icon: User },
      { id: 'SCENE', label: '场景', icon: ImageIcon },
      { id: 'MODEL', label: '模型', icon: Box },
      { id: 'MUSIC', label: '音乐', icon: Music },
      { id: 'VOICE', label: '音色', icon: Mic },
  ];

  const safeAddAsset = (type: AssetType) => {
      if (activeTab === 'GLOBAL') {
          alert("请切换到项目视图来新建资产");
          return;
      }
      if (filterType !== 'ALL' && filterType !== type) setFilterType(type);
      handleAddAsset(type);
  };

  return (
    <div className="h-full flex bg-slate-900 text-slate-100">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      <div className="w-48 bg-slate-900 border-r border-slate-800 flex flex-col pt-4 shrink-0">
          <div className="px-4 mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">资产类型</h3>
              <div className="space-y-1">
                  {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setFilterType(cat.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${filterType === cat.id ? 'bg-purple-900/30 text-purple-300' : 'text-slate-400 hover:bg-slate-800'}`}
                      >
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="px-4 mt-auto mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">新建资产</h3>
              <button onClick={() => safeAddAsset('CHARACTER')} className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 mb-1">
                  <Plus className="w-3 h-3" /> 新建角色
              </button>
              <button onClick={() => safeAddAsset('SCENE')} className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 mb-1">
                  <Plus className="w-3 h-3" /> 新建场景
              </button>
              <button onClick={() => safeAddAsset('MODEL')} className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300 mb-1">
                  <Plus className="w-3 h-3" /> 导入 LoRA
              </button>
          </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 px-6 border-b border-slate-700 flex justify-between items-center bg-slate-900 shrink-0">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                 <button onClick={() => setActiveTab('PROJECT')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${activeTab === 'PROJECT' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                     项目资产 ({getFilteredAssets(projectAssets).length})
                 </button>
                 <button onClick={() => setActiveTab('GLOBAL')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${activeTab === 'GLOBAL' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                     全局库 ({getFilteredAssets(globalAssets).length})
                 </button>
             </div>
             
             <div className="relative">
                 <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                 <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索资产..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-purple-500 outline-none w-64"
                 />
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {activeTab === 'PROJECT' ? (
                    getFilteredAssets(projectAssets).map(asset => (
                        <AssetCard 
                            key={asset.id}
                            asset={asset}
                            onUpdate={(updates) => handleUpdateAsset(asset.id, updates)}
                            onDelete={() => handleDeleteAsset(asset.id)}
                            onGenerate={() => handleGenerate(asset)}
                            onUploadTrigger={(type) => { 
                                setUploadTargetId(asset.id); 
                                setUploadType(type);
                                fileInputRef.current?.click(); 
                            }}
                            onAddToGlobal={() => onAddToGlobal(asset)}
                        />
                    ))
                ) : (
                    getFilteredAssets(globalAssets).map(asset => (
                        <div key={asset.id} className="bg-slate-800 rounded-lg p-2 border border-slate-700 relative group">
                            {/* Simplified Global Asset Card */}
                             <div className="aspect-square bg-slate-900 mb-2 overflow-hidden rounded relative group">
                                {asset.referenceImage ? <img src={asset.referenceImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><Database className="w-6 h-6"/></div>}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-2">
                                    <button onClick={() => onUpdateProjectAssets([...projectAssets, { ...asset, id: `imp_${Date.now()}`, scope: 'PROJECT' }])} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                                        引入项目
                                    </button>
                                </div>
                             </div>
                             <div className="font-bold text-sm text-slate-300 truncate">{asset.name}</div>
                             <button 
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="从全局库删除"
                             >
                                 <Trash2 className="w-3 h-3"/>
                             </button>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const AssetCard: React.FC<{
    asset: Asset;
    onUpdate: (updates: Partial<Asset>) => void;
    onDelete: () => void;
    onGenerate: () => void;
    onUploadTrigger: (type: 'MEDIA' | 'COVER') => void;
    onAddToGlobal: () => void;
}> = ({ asset, onUpdate, onDelete, onGenerate, onUploadTrigger, onAddToGlobal }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(asset.name);
    const isVisual = ['CHARACTER', 'SCENE', 'PROP'].includes(asset.type);
    const isModel = asset.type === 'MODEL';
    const isAudio = ['MUSIC', 'VOICE'].includes(asset.type);

    return (
        <div className={`flex flex-col rounded-xl border-2 transition-all bg-slate-800 overflow-hidden relative group shadow-lg ${asset.status === 'LOCKED' ? 'border-green-500/50' : 'border-slate-700'}`}>
            <div className="p-3 border-b border-slate-700/50 flex justify-between items-start bg-slate-800/80">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-600 bg-slate-700 text-slate-300">{asset.type}</span>
                        {isEditing ? (
                            <input value={tempName} onChange={e => setTempName(e.target.value)} onBlur={() => { onUpdate({name: tempName}); setIsEditing(false); }} className="bg-black/50 border border-blue-500 text-xs px-1 rounded w-full outline-none" autoFocus />
                        ) : (
                            <span onClick={() => setIsEditing(true)} className="font-bold text-sm truncate cursor-pointer hover:text-blue-400">{asset.name}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onDelete} className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                </div>
            </div>

            <div className="px-3 pt-2 space-y-2">
                {isVisual && asset.status !== 'LOCKED' && (
                    <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-[10px] text-slate-300 resize-none h-16" value={asset.visualPrompt} onChange={e => onUpdate({visualPrompt: e.target.value})} placeholder="输入中文或英文提示词..." />
                )}
                 {/* Usage Logs Hint */}
                {asset.usageLog && asset.usageLog.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>用于: {asset.usageLog[0].segmentName} 等{asset.usageLog.length}处</span>
                    </div>
                )}
            </div>

            <div className={`flex-1 min-h-[160px] relative flex flex-col items-center justify-center p-2 ${!isVisual && 'mt-2'}`}>
                {asset.status === 'GENERATING' && (
                     <div className="animate-pulse flex flex-col items-center text-purple-400"><RefreshCw className="w-6 h-6 animate-spin mb-2" /><span className="text-xs">AI 正在绘图...</span></div>
                )}

                {asset.status === 'LOCKED' && (
                    <div className="w-full h-full relative group/preview">
                        {isAudio ? (
                             <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded border border-slate-700 p-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-indigo-900/50 text-indigo-400"><Music className="w-6 h-6" /></div>
                                <audio key={asset.audioUrl} controls src={asset.audioUrl} className="w-full h-8 z-10 relative" />
                                <button onClick={onAddToGlobal} className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-full text-xs opacity-0 group-hover/preview:opacity-100"><Save className="w-3 h-3" /></button>
                             </div>
                        ) : (
                            <>
                                {asset.referenceImage ? <img src={asset.referenceImage} className="w-full h-full object-cover rounded bg-black" /> : <div className="text-xs text-slate-500">无预览</div>}
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm rounded z-20">
                                    {!isModel && <button onClick={() => { if(confirm("解锁重做?")) onUpdate({status: 'PENDING', referenceImage: undefined}); }} className="bg-slate-200 text-slate-900 px-3 py-1 rounded text-xs flex items-center gap-1 font-bold"><RefreshCw className="w-3 h-3" /> 解锁重选</button>}
                                    <button onClick={onAddToGlobal} className="bg-slate-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1 border border-slate-500"><Save className="w-3 h-3" /> 存入全局库</button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {asset.status === 'PENDING' && asset.candidates && (
                    <div className="grid grid-cols-2 gap-1 w-full flex-1">
                        {asset.candidates.map((url, i) => <img key={i} src={url} onClick={() => onUpdate({status: 'LOCKED', referenceImage: url})} className="w-full h-full object-cover cursor-pointer hover:border-green-500 border-2 border-transparent" />)}
                        <button onClick={onGenerate} className="col-span-2 py-1 bg-slate-700 text-[10px] text-slate-200 rounded">不满意？重绘</button>
                    </div>
                )}

                {asset.status === 'PENDING' && !asset.candidates && (
                    <div className="flex gap-2">
                        {isVisual && <button onClick={onGenerate} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded text-xs">AI 生成</button>}
                        <button onClick={() => onUploadTrigger(isVisual || isModel ? 'COVER' : 'MEDIA')} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded text-xs flex items-center gap-1"><Upload className="w-3 h-3" /> 上传</button>
                    </div>
                )}
            </div>
        </div>
    );
};
