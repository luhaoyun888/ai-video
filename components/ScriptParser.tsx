
import React, { useState, useEffect } from 'react';
import { parseScriptWithGemini } from '../services/geminiService';
import { Asset, Shot, ScriptSegment, AssetUsageLog, ParsingRule } from '../types';
import { Bot, Loader2, Sparkles, Save, Plus, Trash2, Code, CheckCircle2, AlertCircle } from 'lucide-react';
import { backend } from '../services/mockBackend';

interface ScriptParserProps {
  segment: ScriptSegment;
  onUpdateSegment: (updates: Partial<ScriptSegment>) => void;
  onExtractAssets: (newAssets: Asset[]) => void;
}

export const ScriptParser: React.FC<ScriptParserProps> = ({ segment, onUpdateSegment, onExtractAssets }) => {
  // Script State
  const [script, setScript] = useState(segment.scriptRaw);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rules State
  const [rules, setRules] = useState<ParsingRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('default');
  
  // Rule Editor State
  const [editingRule, setEditingRule] = useState<ParsingRule | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Sync internal state if parent changes segment
  useEffect(() => {
      setScript(segment.scriptRaw);
  }, [segment.id]);

  // Load rules on mount
  useEffect(() => {
      loadRules();
  }, []);

  // When selected rule changes, update the editor
  useEffect(() => {
      const rule = rules.find(r => r.id === selectedRuleId);
      if (rule) {
          setEditingRule({ ...rule });
          setHasUnsavedChanges(false);
          setSaveStatus('saved');
      }
  }, [selectedRuleId, rules]);

  const loadRules = async () => {
      const list = await backend.listParsingRules();
      setRules(list);
      // Ensure selected ID is valid
      if (!list.find(r => r.id === selectedRuleId)) {
          setSelectedRuleId(list[0]?.id || 'default');
      }
  };

  const handleSaveText = () => {
      onUpdateSegment({ scriptRaw: script });
  };

  // --- Rule Management ---

  const handleCreateRule = async () => {
      const newRule: ParsingRule = {
          id: `rule_${Date.now()}`,
          name: '新自定义规则',
          systemInstruction: rules.find(r => r.isDefault)?.systemInstruction || '',
          isDefault: false
      };
      await backend.saveParsingRule(newRule);
      await loadRules();
      setSelectedRuleId(newRule.id);
  };

  const handleDeleteRule = async (id: string) => {
      if (confirm("确定要删除此规则吗？此操作无法恢复。")) {
          await backend.deleteParsingRule(id);
          const remaining = await backend.listParsingRules();
          setRules(remaining);
          if (selectedRuleId === id) {
              setSelectedRuleId(remaining[0]?.id || 'default');
          }
      }
  };

  const handleRuleEditChange = (field: keyof ParsingRule, value: any) => {
      if (!editingRule) return;
      setEditingRule({ ...editingRule, [field]: value });
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
  };

  const handleSaveRule = async () => {
      if (!editingRule) return;
      if (!editingRule.name.trim()) {
          alert("规则名称不能为空");
          return;
      }
      setSaveStatus('saving');
      await backend.saveParsingRule(editingRule);
      await loadRules(); // Reload to update list
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
  };

  // --- Analysis ---

  const handleAnalyze = async () => {
    if (!script.trim()) {
        setError("请输入脚本内容");
        return;
    }
    
    // Auto-save rule if modified before analyzing
    if (hasUnsavedChanges) {
        await handleSaveRule();
    }
    
    setLoading(true);
    setError(null);

    // Use the currently editing rule (which is now saved) or find by ID
    const activeRule = editingRule || rules.find(r => r.id === selectedRuleId);

    try {
      // 1. Save Raw Script
      onUpdateSegment({ scriptRaw: script });

      // 2. Call AI with selected rule
      const data = await parseScriptWithGemini(script, activeRule?.systemInstruction);
      
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
      setError("解析失败，请检查网络或 API Key。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* LEFT: Main Script Area */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
          <div className="mb-4 flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-400" />
                脚本解析引擎
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                当前章节: <span className="text-white font-bold">{segment.name}</span>
                </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 relative min-h-0">
            <textarea
                className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-6 text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-inner leading-relaxed placeholder-slate-600"
                placeholder="在此输入本章节的剧本内容..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                onBlur={handleSaveText}
            />
            {error && (
                <div className="bg-red-900/80 text-white px-4 py-2 rounded shadow flex items-center gap-2">
                   <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}
            
            <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`
                py-3 px-8 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all
                ${loading 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'}
                `}
            >
                {loading ? (
                <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    正在分析章节...
                </>
                ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    使用当前规则提取资产 & 分镜
                </>
                )}
            </button>
          </div>
      </div>

      {/* RIGHT: Parsing Rules Sidebar */}
      <div className="w-96 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl z-10">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-slate-200">
                  <Code className="w-4 h-4 text-purple-400" />
                  解析规则库
              </h3>
              <button 
                onClick={handleCreateRule}
                className="p-1.5 bg-slate-800 hover:bg-blue-600 rounded-md text-slate-400 hover:text-white transition-colors"
                title="新建规则"
              >
                  <Plus className="w-4 h-4" />
              </button>
          </div>

          {/* Rules List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-900/50 max-h-[30vh] border-b border-slate-800">
              {rules.map(rule => (
                  <button
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-all
                        ${selectedRuleId === rule.id ? 'bg-blue-900/30 border border-blue-500/50 text-white' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}
                    `}
                  >
                      <div className="truncate pr-2 font-medium">{rule.name}</div>
                      {rule.isDefault && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">默认</span>}
                  </button>
              ))}
          </div>

          {/* Rule Editor (Code View) */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
              {editingRule ? (
                  <div className="flex-1 flex flex-col p-4 gap-3">
                      <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-500 uppercase">规则名称</label>
                          <div className="flex gap-2">
                             {!editingRule.isDefault && (
                                <button 
                                    onClick={() => handleDeleteRule(editingRule.id)}
                                    className="text-slate-600 hover:text-red-400 p-1"
                                    title="删除规则"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             )}
                          </div>
                      </div>
                      <input 
                        className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                        value={editingRule.name}
                        onChange={(e) => handleRuleEditChange('name', e.target.value)}
                        placeholder="输入规则名称..."
                      />

                      <div className="flex justify-between items-center mt-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">System Prompt (Prompt 代码)</label>
                          {hasUnsavedChanges ? (
                              <span className="text-[10px] text-yellow-500 animate-pulse">● 未保存</span>
                          ) : (
                              <span className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已同步</span>
                          )}
                      </div>
                      <div className="flex-1 relative group">
                          <textarea 
                            className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-blue-200 resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                            value={editingRule.systemInstruction}
                            onChange={(e) => handleRuleEditChange('systemInstruction', e.target.value)}
                            spellCheck={false}
                          />
                      </div>
                      
                      <button 
                        onClick={handleSaveRule}
                        disabled={!hasUnsavedChanges && saveStatus === 'saved'}
                        className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all
                            ${hasUnsavedChanges 
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-slate-800 text-slate-500 cursor-default'}
                        `}
                      >
                         <Save className="w-4 h-4" />
                         {saveStatus === 'saving' ? '保存中...' : '保存修改'}
                      </button>
                  </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                      请选择一个规则进行编辑
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
