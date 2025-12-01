
import React, { useState, useEffect } from 'react';
import { Bot, Layers, Layout, Clapperboard, Settings as SettingsIcon, ArrowLeft, Plus, Folder, FileText, ChevronDown } from 'lucide-react';
import { ScriptParser } from './components/ScriptParser';
import { AssetHub } from './components/AssetHub';
import { VisualStoryboard } from './components/VisualStoryboard';
import { ExportStudio } from './components/ExportStudio';
import { Settings } from './components/Settings';
import { ProjectDashboard } from './components/ProjectDashboard';
import { Asset, Shot, WorkflowStep, ProjectSettings, Project, ScriptSegment } from './types';
import { backend } from './services/mockBackend';

const App: React.FC = () => {
  const [view, setView] = useState<'DASHBOARD' | 'WORKSTATION'>('DASHBOARD');
  const [step, setStep] = useState<WorkflowStep>(WorkflowStep.SCRIPT);
  
  const [settings, setSettings] = useState<ProjectSettings>({
    generationEngine: 'CLOUD_MOCK',
    comfyUiUrl: "http://127.0.0.1:8188",
    autoSave: true,
    defaultResolution: "1080p",
    localDataPath: "D:\\DirectorAI_Projects"
  });

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  
  // Mock Global Assets (Shared across all projects in a real app, but here just local state for demo)
  const [globalAssets, setGlobalAssets] = useState<Asset[]>([
      { id: 'g1', name: '预设：赛博侦探', type: 'CHARACTER', description: 'Sample', visualPrompt: '1boy, detective, cyberpunk', tags: ['Demo'], scope: 'GLOBAL', status: 'LOCKED', referenceImage: 'https://picsum.photos/seed/det/400/400' },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('directorai_settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (currentProject && settings.autoSave) {
       backend.updateProject(currentProject);
    }
  }, [currentProject, settings.autoSave]);

  // --- Dashboard Logic ---

  const handleSelectProject = async (id: string) => {
      const proj = await backend.getProject(id);
      if (proj) {
          setCurrentProject(proj);
          setActiveSegmentId(proj.segments[0]?.id || null);
          setView('WORKSTATION');
          setStep(WorkflowStep.ASSETS); // Start at Asset Hub to see everything
      }
  };

  const handleCreateNewProject = async (newProject: Project) => {
      await backend.createProject(newProject);
      setCurrentProject(newProject);
      setActiveSegmentId(newProject.segments[0].id);
      setView('WORKSTATION');
      setStep(WorkflowStep.SCRIPT);
  };

  const handleBackToDashboard = () => {
      setView('DASHBOARD');
      setCurrentProject(null);
  };

  // --- Segment Logic ---

  const activeSegment = currentProject?.segments.find(s => s.id === activeSegmentId);

  const handleAddSegment = () => {
      if (!currentProject) return;
      const newSeg: ScriptSegment = {
          id: `seg_${Date.now()}`,
          name: `第 ${currentProject.segments.length + 1} 章 (New Chapter)`,
          scriptRaw: '',
          shots: [],
          lastModified: Date.now()
      };
      const updatedProject = { ...currentProject, segments: [...currentProject.segments, newSeg] };
      setCurrentProject(updatedProject);
      setActiveSegmentId(newSeg.id);
  };

  const handleSegmentUpdate = (updates: Partial<ScriptSegment>) => {
      if (!currentProject || !activeSegmentId) return;
      const updatedSegments = currentProject.segments.map(s => 
          s.id === activeSegmentId ? { ...s, ...updates, lastModified: Date.now() } : s
      );
      setCurrentProject({ ...currentProject, segments: updatedSegments });
  };

  // --- Asset Logic ---

  const handleExtractAssets = (newAssets: Asset[]) => {
      if (!currentProject) return;
      // Simple merge: add if name doesn't exist
      const existingNames = new Set(currentProject.assets.map(a => a.name));
      const filteredNew = newAssets.filter(a => !existingNames.has(a.name));
      setCurrentProject({ 
          ...currentProject, 
          assets: [...currentProject.assets, ...filteredNew] 
      });
  };

  const handleProjectAssetsUpdate = (updatedAssets: Asset[]) => {
      if (!currentProject) return;
      setCurrentProject({ ...currentProject, assets: updatedAssets });
  };

  const handleAddToGlobal = (asset: Asset) => {
      setGlobalAssets(prev => [...prev, { ...asset, id: `g_${Date.now()}`, scope: 'GLOBAL', projectId: undefined }]);
      alert("已存入全局资产库");
  };

  const handleDeleteGlobalAsset = (id: string) => {
      setGlobalAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAssetFromShot = (url: string) => {
      if(!currentProject) return;
      const newAsset: Asset = {
          id: `shot_asset_${Date.now()}`,
          name: `Shot_Asset_${Date.now().toString().slice(-4)}`,
          type: 'SCENE',
          description: 'Created from storyboard',
          visualPrompt: '',
          tags: ['FromShot'],
          scope: 'PROJECT',
          status: 'LOCKED',
          referenceImage: url
      };
      setCurrentProject({ ...currentProject, assets: [...currentProject.assets, newAsset] });
      alert("已从分镜创建新资产");
  };

  if (view === 'DASHBOARD') {
      return <ProjectDashboard onSelectProject={handleSelectProject} onCreateNew={handleCreateNewProject} />;
  }

  const navItems = [
    { id: WorkflowStep.SCRIPT, label: '脚本与分镜', sub: 'Scripting', icon: Bot },
    { id: WorkflowStep.ASSETS, label: '项目资产库', sub: 'Asset Library', icon: Layers },
    { id: WorkflowStep.STORYBOARD, label: '可视化制作', sub: 'Storyboard', icon: Layout },
    { id: WorkflowStep.EXPORT, label: '合成输出', sub: 'Export', icon: Clapperboard },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-30 shadow-2xl">
        {/* Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors" onClick={handleBackToDashboard}>
          <Clapperboard className="text-blue-500 w-6 h-6" />
          <span className="font-bold text-lg text-white">DirectorAI</span>
        </div>

        {/* Project Info */}
        <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50">
            <button onClick={handleBackToDashboard} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold mb-2 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> 返回项目大厅
            </button>
            {currentProject && (
                <div>
                    <div className="text-sm font-bold text-white truncate">{currentProject.title}</div>
                    <div className="text-[10px] bg-slate-800 inline-block px-1.5 py-0.5 rounded text-blue-300 mt-1 border border-slate-700">
                        画风: {currentProject.artStyleConfig.label}
                    </div>
                </div>
            )}
        </div>

        {/* Chapter/Segment Selector */}
        <div className="px-4 py-4 border-b border-slate-800">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">分集/章节 (Segments)</span>
                <button onClick={handleAddSegment} className="text-slate-400 hover:text-white"><Plus className="w-4 h-4"/></button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {currentProject?.segments.map(seg => (
                    <button 
                        key={seg.id}
                        onClick={() => setActiveSegmentId(seg.id)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded truncate flex items-center gap-2 ${activeSegmentId === seg.id ? 'bg-blue-900/40 text-blue-200 border border-blue-800' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        {seg.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 py-4 px-3 space-y-2">
          {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = step === item.id;
             const isDisabled = !currentProject;
             return (
               <button
                 key={item.id}
                 onClick={() => !isDisabled && setStep(item.id)}
                 disabled={isDisabled}
                 className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-400' : isDisabled ? 'opacity-40' : 'text-slate-400 hover:bg-slate-800'}`}
               >
                 <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                 <div className="text-left">
                    <div className={`text-sm font-medium ${isActive ? 'text-blue-100' : ''}`}>{item.label}</div>
                    <div className="text-[10px] opacity-60 font-mono">{item.sub}</div>
                 </div>
               </button>
             )
          })}
        </nav>

        {/* Footer Settings */}
        <div className="p-3 border-t border-slate-800">
            <button onClick={() => setStep(WorkflowStep.SETTINGS)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${step === WorkflowStep.SETTINGS ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                <SettingsIcon className="w-5 h-5" /> <span className="text-sm font-medium">全局设置</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col min-w-0 bg-slate-950">
        {!currentProject ? (
             <div className="flex-1 flex items-center justify-center text-slate-500">Loading...</div>
        ) : (
            <>
                {step === WorkflowStep.SCRIPT && activeSegment && (
                    <ScriptParser 
                        segment={activeSegment}
                        onUpdateSegment={handleSegmentUpdate}
                        onExtractAssets={handleExtractAssets}
                    />
                )}
                
                {step === WorkflowStep.ASSETS && (
                    <AssetHub 
                        projectAssets={currentProject.assets}
                        globalAssets={globalAssets}
                        onUpdateProjectAssets={handleProjectAssetsUpdate}
                        onAddToGlobal={handleAddToGlobal}
                        onDeleteGlobalAsset={handleDeleteGlobalAsset}
                        settings={settings}
                    />
                )}

                {step === WorkflowStep.STORYBOARD && activeSegment && (
                    <VisualStoryboard 
                        shots={activeSegment.shots}
                        assets={currentProject.assets} 
                        artStyle={currentProject.artStyleConfig}
                        onUpdateShot={(updatedShot) => {
                            const newShots = activeSegment.shots.map(s => s.id === updatedShot.id ? updatedShot : s);
                            handleSegmentUpdate({ shots: newShots });
                        }}
                        onAddAssetFromShot={handleAddAssetFromShot}
                        onNext={() => setStep(WorkflowStep.EXPORT)}
                        settings={settings}
                    />
                )}

                {step === WorkflowStep.EXPORT && activeSegment && (
                    <ExportStudio shots={activeSegment.shots} assets={currentProject.assets} />
                )}

                {step === WorkflowStep.SETTINGS && (
                    <Settings settings={settings} onSave={setSettings} />
                )}
            </>
        )}
      </main>
    </div>
  );
};

export default App;
