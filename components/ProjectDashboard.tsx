
import React, { useEffect, useState } from 'react';
import { ProjectMetadata, Project, ArtStyle, ScriptSegment } from '../types';
import { backend } from '../services/mockBackend';
import { ART_STYLES } from '../services/constants';
import { FolderPlus, Clock, Film, Trash2, ArrowRight, Loader2, Palette, Check } from 'lucide-react';

interface ProjectDashboardProps {
  onSelectProject: (projectId: string) => void;
  onCreateNew: (project: Project) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onSelectProject, onCreateNew }) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation Wizard State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(ART_STYLES[0].id);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const list = await backend.listProjects();
    setProjects(list);
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这个项目吗？此操作无法恢复。")) {
      await backend.deleteProject(id);
      loadProjects();
    }
  };

  const handleCreateConfirm = () => {
      if (!newTitle.trim()) {
          alert("请输入项目名称");
          return;
      }
      
      const style = ART_STYLES.find(s => s.id === selectedStyleId) || ART_STYLES[0];
      
      // Initialize with one empty segment
      const firstSegment: ScriptSegment = {
          id: `seg_${Date.now()}`,
          name: '第一章 (Chapter 1)',
          scriptRaw: '',
          shots: [],
          lastModified: Date.now()
      };

      const newProject: Project = {
          id: `proj_${Date.now()}`,
          title: newTitle,
          directoryPath: `Local\\${newTitle}`, // Mock path
          createdAt: Date.now(),
          lastModified: Date.now(),
          artStyleConfig: style,
          assets: [],
          segments: [firstSegment]
      };

      onCreateNew(newProject);
  };

  if (isCreating) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
              <div className="max-w-4xl w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <FolderPlus className="w-6 h-6 text-blue-500" />
                      创建新项目 (Create Project)
                  </h2>

                  <div className="space-y-8">
                      {/* Step 1: Name */}
                      <div>
                          <label className="block text-sm font-bold text-slate-400 mb-2">项目名称</label>
                          <input 
                              autoFocus
                              type="text" 
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-lg focus:border-blue-500 outline-none"
                              placeholder="例如：赛博侦探_S01"
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                          />
                      </div>

                      {/* Step 2: Art Style */}
                      <div>
                          <label className="block text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                              <Palette className="w-4 h-4" />
                              设定艺术画风 (Art Style) - <span className="text-red-400 text-xs">创建后不可修改</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {ART_STYLES.map(style => (
                                  <div 
                                    key={style.id}
                                    onClick={() => setSelectedStyleId(style.id)}
                                    className={`
                                        cursor-pointer rounded-xl p-4 border-2 transition-all relative overflow-hidden group
                                        ${selectedStyleId === style.id ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}
                                    `}
                                  >
                                      <div className="flex justify-between items-center mb-2 relative z-10">
                                          <span className={`font-bold text-sm ${selectedStyleId === style.id ? 'text-white' : 'text-slate-300'}`}>{style.label}</span>
                                          {selectedStyleId === style.id && <Check className="w-4 h-4 text-blue-400" />}
                                      </div>
                                      <p className="text-[10px] text-slate-500 line-clamp-2 relative z-10">{style.positivePrompt}</p>
                                      
                                      {/* Visual Decoration */}
                                      <div className={`absolute bottom-0 right-0 w-16 h-16 rounded-tl-full opacity-10 ${selectedStyleId === style.id ? 'bg-blue-500' : 'bg-slate-500'}`} />
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                          <button onClick={() => setIsCreating(false)} className="px-6 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">取消</button>
                          <button onClick={handleCreateConfirm} className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg">确认创建</button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              DirectorAI 工作台
            </h1>
            <p className="text-slate-400 mt-2">人机协同专业视频生产平台</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
          >
            <FolderPlus className="w-5 h-5" />
            新建项目
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              onClick={() => setIsCreating(true)}
              className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-900 transition-all group min-h-[250px]"
            >
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-900/30 transition-colors">
                <FolderPlus className="w-8 h-8 text-slate-500 group-hover:text-blue-400" />
              </div>
              <h3 className="font-bold text-slate-400 group-hover:text-blue-300">创建新项目</h3>
            </div>

            {projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 hover:shadow-xl transition-all cursor-pointer group flex flex-col min-h-[250px]"
              >
                <div className="h-32 bg-slate-950 relative overflow-hidden">
                  {proj.coverImage ? (
                    <img src={proj.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                      <Film className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  {proj.artStyleLabel && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded border border-white/10">
                          {proj.artStyleLabel}
                      </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white group-hover:text-blue-400 truncate pr-4">{proj.title}</h3>
                    <button 
                      onClick={(e) => handleDelete(e, proj.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      title="删除项目"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(proj.lastModified).toLocaleString()}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                        {proj.shotCount} 分镜
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
