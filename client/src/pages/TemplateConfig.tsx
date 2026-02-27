import { useState, useEffect, type ChangeEvent } from 'react';
import type { PdfTemplateConfig, CreateTemplatePayload, SuggestedPatterns } from '../types/exam';
import {
  Plus,
  Copy,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  AlertCircle,
  Upload,
  Eye,
  Wand2,
  Sparkles,
  Search,
  Settings2,
} from 'lucide-react';

interface TemplateConfigProps {
  baseUrl: string;
}

/** 模版字段描述信息 */
const FIELD_META: {
  key: keyof CreateTemplatePayload;
  label: string;
  desc: string;
  placeholder: string;
  isToggle?: boolean;
}[] = [
  {
    key: 'questionSplitPattern',
    label: '题目分割正则',
    desc: '从全文中切割出每道题的文本块。匹配位置即为每道题的起始点。',
    placeholder: '(?:^|\\n)(?:Topic\\s+\\d+\\s*)?Question\\s*#?\\d+',
  },
  {
    key: 'questionNumberPattern',
    label: '题号提取正则',
    desc: '从题目块第一行提取题号。捕获组1=题号数字，捕获组2=剩余文本（可选）。',
    placeholder: '(?:Topic\\s+\\d+\\s*)?Question\\s*#?(\\d+)\\s*[:.)-]?\\s*(.*)$',
  },
  {
    key: 'optionPattern',
    label: '选项识别正则',
    desc: '识别选项行（如 "A. xxx"）。捕获组1=选项标签字母。',
    placeholder: '^([A-F])[).:]\s+',
  },
  {
    key: 'correctAnswerLinePattern',
    label: '答案行定位正则',
    desc: '用于定位"正确答案"所在行，将题目和答案/讨论区分隔开。',
    placeholder: 'Correct\\s*Answer[s]?\\s*[:：]',
  },
  {
    key: 'correctAnswerExtractPattern',
    label: '答案提取正则',
    desc: '从答案行提取正确选项字母。捕获组1=答案字母串。',
    placeholder: 'Correct\\s*Answer[s]?\\s*[:-]\\s*([A-F,\\s]+)',
  },
  {
    key: 'explanationPattern',
    label: '解析提取正则',
    desc: '提取题目解释/解析文本。捕获组1=解释内容。',
    placeholder: 'Explanation\\s*[:-](.*)$',
  },
  {
    key: 'hasDiscussion',
    label: '是否解析讨论区',
    desc: '开启后将尝试解析题目后的讨论区评论。',
    placeholder: '',
    isToggle: true,
  },
  {
    key: 'discussionDatePattern',
    label: '讨论区日期正则',
    desc: '用于分割评论的日期锚点（如 "2 months ago"）。仅在开启讨论区解析时生效。',
    placeholder:
      '(\\d+\\s+(?:year|month|week|day|hour)s?,\\s*)*\\d+\\s+(?:year|month|week|day|hour)s?\\s+ago',
  },
];

export function TemplateConfig({ baseUrl }: TemplateConfigProps) {
  const [templates, setTemplates] = useState<PdfTemplateConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateTemplatePayload>>({});
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 预览相关
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 样本驱动创建 wizard
  type WizardStep = 'idle' | 'input' | 'review';
  const [wizardStep, setWizardStep] = useState<WizardStep>('idle');
  const [sampleText, setSampleText] = useState('');
  const [wizardHints, setWizardHints] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);

  // AI 配置
  const [useAi, setUseAi] = useState(false);
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [aiEndpoint, setAiEndpoint] = useState(
    () => localStorage.getItem('tpl_ai_endpoint') || 'https://api.openai.com/v1/chat/completions',
  );
  const [aiKey, setAiKey] = useState(
    () => localStorage.getItem('tpl_ai_key') || '',
  );
  const [aiModel, setAiModel] = useState(
    () => localStorage.getItem('tpl_ai_model') || 'gpt-4o-mini',
  );
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/templates`);
      if (!res.ok) throw new Error('获取模版列表失败');
      const data = (await res.json()) as PdfTemplateConfig[];
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleCreate = async () => {
    if (!editForm.name?.trim()) {
      setError('模版名称不能为空');
      return;
    }
    const requiredFields: (keyof CreateTemplatePayload)[] = [
      'questionSplitPattern',
      'questionNumberPattern',
      'optionPattern',
      'correctAnswerLinePattern',
      'correctAnswerExtractPattern',
      'explanationPattern',
    ];
    for (const f of requiredFields) {
      if (!editForm[f]) {
        setError(`字段 "${FIELD_META.find((m) => m.key === f)?.label}" 不能为空`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${baseUrl}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || '创建失败');
      }
      setCreating(false);
      setEditForm({});
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${baseUrl}/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || '更新失败');
      }
      setEditingId(null);
      setEditForm({});
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${baseUrl}/templates/${id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('复制失败');
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '复制失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此模版吗？')) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${baseUrl}/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || '删除失败');
      }
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tpl: PdfTemplateConfig) => {
    setEditingId(tpl.id);
    setCreating(false);
    setEditForm({
      name: tpl.name,
      description: tpl.description,
      questionSplitPattern: tpl.questionSplitPattern,
      questionNumberPattern: tpl.questionNumberPattern,
      optionPattern: tpl.optionPattern,
      correctAnswerLinePattern: tpl.correctAnswerLinePattern,
      correctAnswerExtractPattern: tpl.correctAnswerExtractPattern,
      explanationPattern: tpl.explanationPattern,
      hasDiscussion: tpl.hasDiscussion,
      discussionDatePattern: tpl.discussionDatePattern,
    });
    setExpandedId(tpl.id);
  };

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setEditForm({
      name: '',
      hasDiscussion: false,
    });
    setExpandedId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreating(false);
    setEditForm({});
    setWizardStep('idle');
    setSampleText('');
    setWizardHints({});
  };

  /** 开始样本驱动创建 */
  const startWizard = () => {
    setCreating(false);
    setEditingId(null);
    setEditForm({});
    setSampleText('');
    setWizardHints({});
    setWizardStep('input');
    setExpandedId(null);
  };

  /** 启发式分析样本 */
  const handleAnalyzeSample = async () => {
    if (!sampleText.trim()) {
      setError('请先粘贴示例题目文本');
      return;
    }
    try {
      setAnalyzing(true);
      setError(null);
      const res = await fetch(`${baseUrl}/templates/analyze-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleText }),
      });
      if (!res.ok) throw new Error('分析失败');
      const data = (await res.json()) as SuggestedPatterns;
      applyPatterns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  /** AI 生成 */
  const handleAiGenerate = async () => {
    if (!sampleText.trim()) {
      setError('请先粘贴示例题目文本');
      return;
    }
    if (!aiKey.trim()) {
      setError('请先配置 AI API Key');
      setShowAiConfig(true);
      return;
    }
    // 保存 AI 配置到 localStorage
    localStorage.setItem('tpl_ai_endpoint', aiEndpoint);
    localStorage.setItem('tpl_ai_key', aiKey);
    localStorage.setItem('tpl_ai_model', aiModel);

    try {
      setAnalyzing(true);
      setError(null);
      const res = await fetch(`${baseUrl}/templates/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleText,
          apiEndpoint: aiEndpoint,
          apiKey: aiKey,
          model: aiModel,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'AI 生成失败');
      }
      const data = (await res.json()) as SuggestedPatterns;
      applyPatterns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 生成失败');
    } finally {
      setAnalyzing(false);
    }
  };

  /** 测试 AI 连通性 */
  const handleTestAiConnection = async () => {
    if (!aiKey.trim()) {
      setAiTestResult({ success: false, message: '请先配置 AI API Key' });
      return;
    }
    
    // 保存 AI 配置到 localStorage
    localStorage.setItem('tpl_ai_endpoint', aiEndpoint);
    localStorage.setItem('tpl_ai_key', aiKey);
    localStorage.setItem('tpl_ai_model', aiModel);

    try {
      setTestingAi(true);
      setAiTestResult(null);
      
      // 直接在前端调用 AI 接口进行测试，验证 URL、Key 和 Model 是否正确
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        setAiTestResult({
          success: false,
          message: `连接失败 (${response.status}): ${errText.slice(0, 200)}`,
        });
        return;
      }

      setAiTestResult({
        success: true,
        message: '连接成功！配置正确。',
      });
    } catch (err) {
      setAiTestResult({ 
        success: false, 
        message: `连接异常: ${err instanceof Error ? err.message : String(err)}` 
      });
    } finally {
      setTestingAi(false);
    }
  };

  /** 将分析结果应用到表单 */
  const applyPatterns = (data: SuggestedPatterns) => {
    const { hints, ...patterns } = data;
    setEditForm({
      name: '',
      hasDiscussion: false,
      ...patterns,
    });
    setWizardHints(hints || {});
    setWizardStep('review');
  };

  const handlePreview = async () => {
    if (!previewFile || !previewTemplateId) return;
    try {
      setPreviewLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', previewFile);
      formData.append('templateId', String(previewTemplateId));
      const res = await fetch(`${baseUrl}/pdf/preview`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || '预览失败');
      }
      const data = await res.json();
      setPreviewResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '预览解析失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const renderFormField = (
    field: (typeof FIELD_META)[number],
    values: Partial<CreateTemplatePayload>,
    onChange: (key: string, value: any) => void,
    disabled: boolean,
  ) => {
    if (field.isToggle) {
      return (
        <div className="tpl-form-field" key={field.key}>
          <label className="tpl-field-label">
            <input
              type="checkbox"
              checked={!!values[field.key]}
              onChange={(e) => onChange(field.key, e.target.checked)}
              disabled={disabled}
            />
            <span>{field.label}</span>
          </label>
          <p className="tpl-field-desc">{field.desc}</p>
        </div>
      );
    }

    if (field.key === 'discussionDatePattern' && !values.hasDiscussion) {
      return null;
    }

    return (
      <div className="tpl-form-field" key={field.key}>
        <label className="tpl-field-label">{field.label}</label>
        <p className="tpl-field-desc">{field.desc}</p>
        <input
          type="text"
          className="tpl-field-input"
          placeholder={field.placeholder}
          value={(values[field.key] as string) || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          spellCheck={false}
        />
      </div>
    );
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <h2>PDF 模版配置</h2>
        <p className="page-subtitle">
          配置 PDF 题库的解析规则。每个模版定义一组正则表达式来提取题目、选项、答案等内容。
        </p>
      </div>

      <div className="management-content">
        {error && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button
              className="tpl-error-close"
              onClick={() => setError(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 模版列表 */}
        <div className="card">
          <div className="section-header">
            <h3>解析模版 ({templates.length})</h3>
            <div className="section-header-actions">
              <button
                className="btn-primary btn-sm"
                onClick={startWizard}
                disabled={loading || wizardStep !== 'idle'}
                title="粘贴示例题目，自动识别格式"
              >
                <Wand2 size={14} /> 从样本创建
              </button>
              <button
                className="btn-nav btn-sm"
                onClick={startCreate}
                disabled={loading || creating}
                title="手动填写正则表达式"
              >
                <Plus size={14} /> 手动新建
              </button>
            </div>
          </div>

          {/* ── 样本驱动向导 ── */}
          {wizardStep === 'input' && (
            <div className="tpl-edit-card wizard-card">
              <div className="tpl-edit-header">
                <h4><Wand2 size={16} /> 从样本创建模版</h4>
                <button className="tpl-btn-icon" onClick={cancelEdit}>
                  <X size={16} />
                </button>
              </div>
              <p className="wizard-desc">
                粘贴 1–2 道完整的示例题目文本（包含题号、题目、选项、答案等），系统将自动识别格式并生成解析规则。
              </p>
              <textarea
                className="wizard-textarea"
                rows={12}
                placeholder={`例如：\n\nQuestion #42\nA company needs to store data...\nA. Use Amazon S3\nB. Use Amazon EBS\nC. Use Amazon RDS\nD. Use Amazon DynamoDB\nCorrect Answer: A\nExplanation: Amazon S3 provides...`}
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                spellCheck={false}
              />

              {/* AI 配置折叠区 */}
              <div className="wizard-ai-section">
                <button
                  className="wizard-ai-toggle"
                  onClick={() => setShowAiConfig(!showAiConfig)}
                >
                  <Settings2 size={14} />
                  AI 设置 {showAiConfig ? '▾' : '▸'}
                </button>
                {showAiConfig && (
                  <div className="wizard-ai-config">
                    <div className="wizard-ai-row">
                      <label>API Endpoint</label>
                      <input
                        type="text"
                        className="tpl-field-input"
                        value={aiEndpoint}
                        onChange={(e) => setAiEndpoint(e.target.value)}
                        placeholder="https://api.openai.com/v1/chat/completions"
                      />
                    </div>
                    <div className="wizard-ai-row">
                      <label>API Key</label>
                      <input
                        type="password"
                        className="tpl-field-input"
                        value={aiKey}
                        onChange={(e) => setAiKey(e.target.value)}
                        placeholder="sk-..."
                      />
                    </div>
                    <div className="wizard-ai-row">
                      <label>Model</label>
                      <input
                        type="text"
                        className="tpl-field-input"
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder="gpt-4o-mini"
                      />
                    </div>
                    <div className="wizard-ai-actions" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        className="btn-nav btn-sm"
                        onClick={handleTestAiConnection}
                        disabled={testingAi || !aiKey.trim()}
                      >
                        {testingAi ? '测试中...' : '测试连通性'}
                      </button>
                      {aiTestResult && (
                        <span style={{ fontSize: '12px', color: aiTestResult.success ? '#10b981' : '#ef4444' }}>
                          {aiTestResult.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="wizard-actions">
                <button
                  className="btn-primary"
                  onClick={handleAnalyzeSample}
                  disabled={analyzing || !sampleText.trim()}
                >
                  <Search size={14} />
                  {analyzing ? '分析中...' : '智能识别'}
                </button>
                <button
                  className="btn-ai"
                  onClick={handleAiGenerate}
                  disabled={analyzing || !sampleText.trim()}
                  title={aiKey ? 'AI 辅助生成' : '需先配置 AI API Key'}
                >
                  <Sparkles size={14} />
                  {analyzing ? '生成中...' : 'AI 生成'}
                </button>
                <button className="btn-nav" onClick={cancelEdit}>
                  取消
                </button>
              </div>
            </div>
          )}

          {/* ── 样本向导 – 审核/编辑阶段 ── */}
          {wizardStep === 'review' && (
            <div className="tpl-edit-card wizard-card">
              <div className="tpl-edit-header">
                <h4><Wand2 size={16} /> 审核生成结果</h4>
                <button className="tpl-btn-icon" onClick={() => setWizardStep('input')}>
                  ← 重新分析
                </button>
              </div>
              <p className="wizard-desc">
                以下正则已从示例文本中推断得出，请核对并补充缺少的字段，然后命名保存。
              </p>
              <div className="tpl-form-field">
                <label className="tpl-field-label">模版名称</label>
                <input
                  type="text"
                  className="tpl-field-input"
                  placeholder="如：ExamTopics SAA-C03"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="tpl-form-field">
                <label className="tpl-field-label">描述（可选）</label>
                <input
                  type="text"
                  className="tpl-field-input"
                  placeholder="对此模版的简要说明"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              {FIELD_META.map((field) => {
                const hint = wizardHints[field.key];
                return (
                  <div key={field.key}>
                    {renderFormField(
                      field,
                      editForm,
                      (key, val) => setEditForm({ ...editForm, [key]: val }),
                      false,
                    )}
                    {hint && (
                      <p className={`wizard-hint ${hint.startsWith('未识别') || hint.startsWith('⚠') ? 'wizard-hint-warn' : 'wizard-hint-ok'}`}>
                        {hint}
                      </p>
                    )}
                  </div>
                );
              })}
              <div className="tpl-edit-actions">
                <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                  <Save size={14} /> 保存模版
                </button>
                <button className="btn-nav" onClick={cancelEdit}>
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 手动新建表单 */}
          {creating && (
            <div className="tpl-edit-card">
              <div className="tpl-edit-header">
                <h4>新建模版</h4>
                <button className="tpl-btn-icon" onClick={cancelEdit}>
                  <X size={16} />
                </button>
              </div>
              <div className="tpl-form-field">
                <label className="tpl-field-label">模版名称</label>
                <input
                  type="text"
                  className="tpl-field-input"
                  placeholder="如：ExamTopics SAA-C03"
                  value={editForm.name || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className="tpl-form-field">
                <label className="tpl-field-label">描述（可选）</label>
                <input
                  type="text"
                  className="tpl-field-input"
                  placeholder="对此模版的简要说明"
                  value={editForm.description || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              {FIELD_META.map((field) =>
                renderFormField(field, editForm, (key, val) =>
                  setEditForm({ ...editForm, [key]: val }),
                  false,
                ),
              )}
              <div className="tpl-edit-actions">
                <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                  <Save size={14} /> 创建
                </button>
                <button className="btn-nav" onClick={cancelEdit}>
                  取消
                </button>
              </div>
            </div>
          )}

          {templates.length === 0 && !creating ? (
            <div className="empty-state">暂无模版，将在首次启动时自动创建默认模版。</div>
          ) : (
            <ul className="management-list">
              {templates.map((tpl) => (
                <li key={tpl.id} className="tpl-item">
                  {/* 折叠头 */}
                  <div
                    className="tpl-item-header"
                    onClick={() =>
                      setExpandedId(expandedId === tpl.id ? null : tpl.id)
                    }
                  >
                    <div className="tpl-item-toggle">
                      {expandedId === tpl.id ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                    <div className="tpl-item-info">
                      <div className="tpl-item-name">
                        {tpl.isBuiltin && (
                          <span className="tpl-badge-builtin">
                            <Shield size={12} /> 内置
                          </span>
                        )}
                        {tpl.name}
                      </div>
                      {tpl.description && (
                        <div className="tpl-item-desc">{tpl.description}</div>
                      )}
                    </div>
                    <div className="tpl-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="tpl-btn-icon"
                        title="复制模版"
                        onClick={() => handleDuplicate(tpl.id)}
                        disabled={loading}
                      >
                        <Copy size={15} />
                      </button>
                      {!tpl.isBuiltin && (
                        <button
                          className="tpl-btn-icon tpl-btn-danger"
                          title="删除模版"
                          onClick={() => handleDelete(tpl.id)}
                          disabled={loading}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {expandedId === tpl.id && (
                    <div className="tpl-item-detail">
                      {editingId === tpl.id ? (
                        /* 编辑模式 */
                        <div className="tpl-edit-section">
                          <div className="tpl-form-field">
                            <label className="tpl-field-label">模版名称</label>
                            <input
                              type="text"
                              className="tpl-field-input"
                              value={editForm.name || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="tpl-form-field">
                            <label className="tpl-field-label">描述</label>
                            <input
                              type="text"
                              className="tpl-field-input"
                              value={editForm.description || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, description: e.target.value })
                              }
                            />
                          </div>
                          {FIELD_META.map((field) =>
                            renderFormField(field, editForm, (key, val) =>
                              setEditForm({ ...editForm, [key]: val }),
                              false,
                            ),
                          )}
                          <div className="tpl-edit-actions">
                            <button
                              className="btn-primary"
                              onClick={() => handleUpdate(tpl.id)}
                              disabled={loading}
                            >
                              <Save size={14} /> 保存
                            </button>
                            <button className="btn-nav" onClick={cancelEdit}>
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 查看模式 */
                        <div className="tpl-view-section">
                          {FIELD_META.map((field) => {
                            if (field.key === 'discussionDatePattern' && !tpl.hasDiscussion) {
                              return null;
                            }
                            const value = tpl[field.key as keyof PdfTemplateConfig];
                            return (
                              <div className="tpl-view-field" key={field.key}>
                                <span className="tpl-view-label">{field.label}</span>
                                <span className="tpl-view-value">
                                  {field.isToggle
                                    ? value
                                      ? '✓ 开启'
                                      : '✗ 关闭'
                                    : (value as string) || '—'}
                                </span>
                              </div>
                            );
                          })}
                          {!tpl.isBuiltin && (
                            <div className="tpl-edit-actions">
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => startEdit(tpl)}
                              >
                                编辑模版
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 模版预览测试 */}
        <div className="card">
          <h3>
            <Eye size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            解析预览
          </h3>
          <p className="tpl-preview-desc">
            选择一个模版并上传 PDF 文件，预览解析结果（不会入库）。
          </p>
          <div className="tpl-preview-form">
            <select
              className="tpl-field-input tpl-select"
              value={previewTemplateId ?? ''}
              onChange={(e) =>
                setPreviewTemplateId(
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
            >
              <option value="">选择模版...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isBuiltin ? ' (内置)' : ''}
                </option>
              ))}
            </select>
            <div className="tpl-preview-upload">
              <input
                type="file"
                accept="application/pdf"
                id="preview-file"
                className="file-input"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files?.[0]) setPreviewFile(e.target.files[0]);
                }}
              />
              <label htmlFor="preview-file" className="file-label tpl-preview-label">
                <Upload size={18} />
                <span>{previewFile ? previewFile.name : '选择 PDF 文件'}</span>
              </label>
            </div>
            <button
              className="btn-primary"
              onClick={handlePreview}
              disabled={!previewFile || !previewTemplateId || previewLoading}
            >
              {previewLoading ? '解析中...' : '预览解析'}
            </button>
          </div>

          {previewResult && (
            <div className="tpl-preview-result">
              <div className="tpl-preview-summary">
                <strong>标题：</strong>{previewResult.title} &nbsp;|&nbsp;
                <strong>题目数：</strong>{previewResult.questions?.length ?? 0}
              </div>
              {previewResult.questions?.length > 0 && (
                <div className="tpl-preview-questions">
                  {previewResult.questions.slice(0, 3).map((q: any, i: number) => (
                    <div key={i} className="tpl-preview-q">
                      <div className="tpl-preview-q-header">
                        第 {q.number ?? i + 1} 题
                        {q.correctAnswers?.length > 0 && (
                          <span className="tpl-preview-answer">
                            答案: {q.correctAnswers.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="tpl-preview-q-text">
                        {q.text?.slice(0, 150)}
                        {q.text?.length > 150 ? '...' : ''}
                      </div>
                      <div className="tpl-preview-q-options">
                        {q.options?.map((opt: any) => (
                          <span key={opt.label} className="tpl-preview-opt">
                            {opt.label}. {opt.text?.slice(0, 60)}
                            {opt.text?.length > 60 ? '...' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {previewResult.questions.length > 3 && (
                    <div className="tpl-preview-more">
                      ... 还有 {previewResult.questions.length - 3} 道题
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
