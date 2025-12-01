
import React, { useState } from 'react';
import { ProjectSettings } from '../types';
import { Settings as SettingsIcon, Save, HardDrive, RefreshCw, FolderOpen, Activity, Globe, Server, Cloud } from 'lucide-react';
import { ComfyService } from '../services/comfyService';

interface SettingsProps {
  settings: ProjectSettings;
  onSave: (s: ProjectSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(settings);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');

  const handleChange = (key: keyof ProjectSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    localStorage.setItem('directorai_settings', JSON.stringify(localSettings));
    setSaveStatus('配置已保存');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleTestConnection = async () => {
    setConnectionStatus('checking');
    const service = new ComfyService(localSettings.comfyUiUrl, localSettings.generationEngine);
    const result = await service.checkConnection();
    setConnectionStatus(result ? 'success' : 'failed');
  };

  const handleSelectFolder = async () => {
    const mockPath = "D:\\AI_Workstation\\Projects";
    handleChange('localDataPath', mockPath);
  };

  return (
    <div className="p-8 bg-slate-900 text-slate-100 h-full max-w-4xl mx-auto overflow-y-auto">
      <div className="mb-8 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
          系统设置 (System Configuration)
        </h2>
      </div>

      <div className="space-y-8">
        
        {/* Storage Settings */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              存储路径配置 (Local Storage)
          </h3>
          
          <div className="space-y-4">
             <div>
                 <label className="block text-sm text-slate-400 mb-1">项目根目录</label>
                 <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={localSettings.localDataPath || ''}
                        readOnly
                        className="flex-1 bg-slate-950 border border-slate-600 rounded p-2 text-slate-300 font-mono text-sm"
                        placeholder="请选择本地存储路径..."
                    />
                    <button 
                        onClick={handleSelectFolder}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <FolderOpen className="w-4 h-4" />
                        选择文件夹
                    </button>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">
                    系统将在此目录下为每个新脚本创建独立文件夹（如：<code>{localSettings.localDataPath || 'Root'}\Project_Name_01\</code>）。
                    <br/>
                    所有分镜信息、生成的图片及资产数据将结构化存储于此。
                 </p>
             </div>

             <div className="flex items-center justify-between py-4 border-t border-slate-700/50 mt-4">
                 <div>
                     <span className="block text-sm font-medium">自动保存</span>
                     <span className="text-xs text-slate-500">每当分镜或资产变更时，同步写入 JSON 文件</span>
                 </div>
                 <button 
                    onClick={() => handleChange('autoSave', !localSettings.autoSave)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.autoSave ? 'bg-green-600' : 'bg-slate-600'}`}
                 >
                     <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${localSettings.autoSave ? 'translate-x-6' : ''}`} />
                 </button>
             </div>
          </div>
        </section>

        {/* Connection Settings */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              生成引擎连接 (Generative Engine)
          </h3>
          
          <div className="grid gap-6">
            
            {/* Engine Type Selector */}
            <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => handleChange('generationEngine', 'COMFY_LOCAL')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${localSettings.generationEngine === 'COMFY_LOCAL' ? 'bg-blue-900/40 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                    <Server className="w-6 h-6" />
                    <span className="text-sm font-bold">本地 ComfyUI</span>
                    <span className="text-[10px] opacity-70">127.0.0.1</span>
                </button>
                <button 
                    onClick={() => handleChange('generationEngine', 'COMFY_REMOTE')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${localSettings.generationEngine === 'COMFY_REMOTE' ? 'bg-blue-900/40 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                    <Globe className="w-6 h-6" />
                    <span className="text-sm font-bold">远程/在线 ComfyUI</span>
                    <span className="text-[10px] opacity-70">Ngrok/Cloud Server</span>
                </button>
                <button 
                    onClick={() => handleChange('generationEngine', 'CLOUD_MOCK')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${localSettings.generationEngine === 'CLOUD_MOCK' ? 'bg-blue-900/40 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                    <Cloud className="w-6 h-6" />
                    <span className="text-sm font-bold">云端模拟器 (Mock)</span>
                    <span className="text-[10px] opacity-70">无需GPU (演示用)</span>
                </button>
            </div>

            {/* URL Config */}
            {localSettings.generationEngine !== 'CLOUD_MOCK' && (
                <div>
                <label className="block text-sm text-slate-400 mb-1">
                    {localSettings.generationEngine === 'COMFY_LOCAL' ? '本地服务器地址' : '远程/API 服务器地址'}
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={localSettings.comfyUiUrl}
                        onChange={(e) => handleChange('comfyUiUrl', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 focus:border-blue-500 outline-none font-mono"
                        placeholder={localSettings.generationEngine === 'COMFY_LOCAL' ? "http://127.0.0.1:8188" : "https://your-server.ngrok-free.app"}
                    />
                    <button 
                        onClick={handleTestConnection}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Activity className="w-4 h-4" />
                        测试连接
                    </button>
                </div>
                
                <div className="mt-2 flex items-center gap-2 text-sm">
                    <span>状态:</span>
                    {connectionStatus === 'idle' && <span className="text-slate-500">未检测</span>}
                    {connectionStatus === 'checking' && <span className="text-blue-400 animate-pulse">正在连接...</span>}
                    {connectionStatus === 'success' && <span className="text-green-500 font-bold flex items-center gap-1">● 在线 (已连接)</span>}
                    {connectionStatus === 'failed' && <span className="text-red-500 font-bold flex items-center gap-1">● 连接失败 (请检查地址或跨域设置)</span>}
                </div>
                
                <p className="text-xs text-slate-500 mt-2">
                    {localSettings.generationEngine === 'COMFY_LOCAL' ? (
                        <>注意：Web 端访问本地 127.0.0.1 可能需要开启 CORS。<br/>启动参数: <code>python main.py --enable-cors-header *</code></>
                    ) : (
                        <>请确保远程服务器支持 WebSocket 连接并且允许跨域访问。</>
                    )}
                </p>
                </div>
            )}

            {localSettings.generationEngine === 'CLOUD_MOCK' && (
                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/50">
                    <p className="text-sm text-blue-200">
                        当前模式下，系统将模拟图像生成过程。适合在没有 GPU 资源的笔记本上演示工作流。
                        生成的图片将来自随机图库。
                    </p>
                </div>
            )}

          </div>
        </section>

        <div className="pt-6 flex items-center gap-4">
           <button 
             onClick={handleSave}
             className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2"
           >
               <Save className="w-5 h-5" />
               保存设置
           </button>
           {saveStatus && <span className="text-green-400 animate-fade-in font-bold">{saveStatus}</span>}
        </div>

      </div>
    </div>
  );
};
