
import React, { useState, useEffect } from 'react';
import { parseScriptWithGemini } from '../services/geminiService';
import { Asset, Shot, ScriptSegment, AssetUsageLog, ParsingRule } from '../types';
import { Bot, Loader2, Sparkles, Save, Plus, Trash2, Code, CheckCircle2, AlertCircle, Edit3, X } from 'lucide-react';
import { backend } from '../services/mockBackend';

interface ScriptParserProps {
  segment: ScriptSegment;
  onUpdateSegment: (updates: Partial<ScriptSegment>) => void;
  onExtractAssets: (newAssets: Asset[]) => void;
}

export const ScriptParser: React.FC<ScriptParserProps> = ({ segment, onUpdateSegment, onExtractAssets }) => {
  // --- Script State ---
  const [script, setScript] = useState(segment.scriptRaw);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Rules State ---
  const [rules, setRules] = useState<ParsingRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('default');
  
  // --- Editor State ---
  // If editingRule is null, we are just viewing. If set, we are editing.
  // For simplicity in this layout, we always show the editor for the selected rule.
  const [localRuleState, setLocalRuleState] = useState<ParsingRule | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync internal state if parent changes segment
  useEffect(() => {
      setScript(segment.scriptRaw);
  }, [segment.id]);

  // Load rules on mount
  useEffect(() => {
      loadRules();
  }, []);

  // When selected rule changes, load it into local editor state
  useEffect(() => {
      const rule = rules.find(r => r.id === selectedRuleId);
      if (rule) {
          setLocalRuleState({ ...rule });
          setHasUnsavedChanges(false);
          setSaveStatus('idle');
      }
  }, [selectedRuleId, rules]);

  const loadRules = async () => {
      const list = await backend.listParsingRules();
      setRules(list);
      // Ensure selected ID is valid
      if (selectedRuleId && !list.find(r => r.id === selectedRuleId)) {
          setSelectedRuleId(list[0]?.id || 'default');
      }
  };

  const handleSaveText = () => {
      onUpdateSegment({ scriptRaw: script });
  };

  // --- Rule Logic ---

  const handleCreateRule = async () => {
      const newRule: ParsingRule = {
          id: `rule_${Date.now()}`,
          name: 'New Custom Rule',
          systemInstruction: rules.find(r => r.isDefault)?.systemInstruction || '',
          isDefault: false
      };
      await backend.saveParsingRule(newRule);
      await loadRules();
      setSelectedRuleId(newRule.id);
  };

  const handleDeleteRule = async (id: string) => {
      if (confirm("确定要删除此规则吗？")) {
          await backend.deleteParsingRule(id);
          const remaining = await backend.listParsingRules();
          setRules(remaining);
          setSelectedRuleId(remaining[0]?.id || 'default');
      }
  };

  const handleEditorChange = (field: keyof ParsingRule, value: any) => {
      if (!localRuleState) return;
      setLocalRuleState({ ...localRuleState, [field]: value });
      setHasUnsavedChanges(true);
      setSaveStatus('idle');
  };

  const handleSaveRule = async () => {
      if (!localRuleState) return;
      setSaveStatus('saving');
      await backend.saveParsingRule(localRuleState);
      await loadRules();
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // --- Analysis Logic ---

  const handleAnalyze = async () => {
    if (!script.trim()) {
        setError("请输入脚本内容");
        return;
    }
    
    // Auto-save rule if dirty
    if (hasUnsavedChanges) {
        await handleSaveRule();
    }
    
    setLoading(true);
    setError(null);

    // Use local state if active, otherwise find from list
    const activeInstruction = localRuleState?.systemInstruction;

    try {
      // 1. Save Raw Script
      onUpdateSegment({ scriptRaw: script });

      // 2. Call AI
      const data = await parseScriptWithGemini(script, activeInstruction);
      
      if (!data) throw new Error("AI 未返回有效数据");

      // 3. Process Assets
      const usageLog: AssetUsageLog = {
          segmentId: segment.id,
          segmentName: segment.name,
          timestamp: Date.now()
      };

      const newAssets: Asset[] = [
        ...data.characters.map((c: any) => ({
          id: `char_${Date.now()}_${Math.random()}`,
          name: c.name,
          type: 'CHARACTER',
          description: c.description,
          visualPrompt: c.visualPrompt,
          status: 'PENDING',
          tags: ['AutoExtracted'],
          scope: 'PROJECT',
          usageLog: [usageLog]
        })),
        ...data.scenes.map((s: any) => ({
          id: `scene_${Date.now()}_${Math.random()}`,
          name: s.name,
          type: 'SCENE',
          description: s.description,
          visualPrompt: s.visualPrompt,
          status: 'PENDING',
          tags: ['AutoExtracted'],
          scope: 'PROJECT',
          usageLog: [usageLog]
        }))
      ] as Asset[];

      // 4. Process Shots
      const newShots: Shot[] = data.shots.map((s: any) => ({
        id: `shot_${segment.id}_${s.sequence}_${Date.now()}`,
        sequence: s.sequence,
        scriptContent: s.scriptContent,
        visualPrompt: s.visualPrompt,
        shotType: s.shotType,
        cameraMovement: s.cameraMovement,
        assignedAssetIds: [], 
        status: 'PENDING'
      }));

      onUpdateSegment({ shots: newShots });
      onExtractAssets(newAssets);

    } catch (err) {
      console.error(err);
      setError("解析失败，请检查网络配置或 Key。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* LEFT COLUMN: Script Input */}
      <div className="flex-1 flex flex-col p-6 min-w-0 border-r border-slate-800">
          <div className="mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-400" />
                脚本解析引擎
            </h1>
            <p className="text-slate-400 text-sm mt-1">
                当前章节: <span className="text-white font-bold">{segment.name}</span>
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-4 relative min-h-0">
            <div className="flex-1 relative group">
                <textarea
                    className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl p-6 text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-inner leading-relaxed placeholder-slate-600"
                    placeholder="在此输入本章节的剧本内容..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    onBlur={handleSaveText}
                />
            </div>
            
            {error && (
                <div className="bg-red-900/80 text-white px-4 py-2 rounded shadow flex items-center gap-2 animate-pulse">
                   <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}
            
            <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`
                py-4 px-8 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all
                ${loading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transform hover:-translate-y-1'}
                `}
            >
                {loading ? (
                <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    正在分析...
                </>
                ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    使用选定规则解析
                </>
                )}
            </button>
          </div>
      </div>

      {/* RIGHT COLUMN: Rule Manager Sidebar */}
      <div className="w-96 flex flex-col bg-slate-900 shadow-2xl z-10 flex-shrink-0">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <Code className="w-4 h-4 text-purple-400" />
                  解析规则库
              </div>
              <button 
                onClick={handleCreateRule}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors shadow-sm"
                title="新建规则"
              >
                  <Plus className="w-4 h-4" />
              </button>
          </div>

          {/* Rule List */}
          <div className="h-48 overflow-y-auto border-b border-slate-700 bg-slate-800/30 p-2 space-y-1 custom-scrollbar">
              {rules.map(rule => (
                  <button
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between group transition-all
                        ${selectedRuleId === rule.id ? 'bg-blue-900/40 border border-blue-500/50 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}
                    `}
                  >
                      <div className="flex items-center gap-2 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${selectedRuleId === rule.id ? 'bg-blue-400' : 'bg-slate-600'}`} />
                          <span className="truncate max-w-[180px]">{rule.name}</span>
                      </div>
                      {rule.isDefault && <span className="text-[10px] bg-slate-700 px-1 py-0.5 rounded text-slate-300">Default</span>}
                  </button>
              ))}
          </div>

          {/* Rule Editor Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950 flex flex-col">
              {localRuleState ? (
                  <>
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                        {/* Name Input */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">规则名称</label>
                                {!localRuleState.isDefault && (
                                    <button onClick={() => handleDeleteRule(localRuleState.id)} className="text-slate-600 hover:text-red-400" title="删除">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <input 
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 outline-none transition-colors"
                                value={localRuleState.name}
                                onChange={(e) => handleEditorChange('name', e.target.value)}
                            />
                        </div>

                        {/* System Prompt Editor */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                    System Instruction <Code className="w-3 h-3" />
                                </label>
                            </div>
                            <div className="relative flex-1 min-h-[300px]">
                                <textarea 
                                    className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-300 resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed custom-scrollbar"
                                    value={localRuleState.systemInstruction}
                                    onChange={(e) => handleEditorChange('systemInstruction', e.target.value)}
                                    spellCheck={false}
                                />
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2">
                                提示: 定义 AI 如何理解分镜、提取资产以及转换视觉提示词。
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
                        <div className="text-xs">
                             {hasUnsavedChanges ? (
                                  <span className="text-yellow-500 font-bold flex items-center gap-1">● 未保存</span>
                              ) : (
                                  <span className="text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已同步</span>
                              )}
                        </div>
                        <button 
                            onClick={handleSaveRule}
                            disabled={!hasUnsavedChanges && saveStatus === 'idle'}
                            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all
                                ${hasUnsavedChanges 
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                    : saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}
                            `}
                        >
                            {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />}
                            {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存修改'}
                        </button>
                    </div>
                  </>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                      Select a rule to edit
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
    