import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Sparkles, Key, Brain, AlertCircle, Check, Loader2, Search as SearchIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BoardSettingsProps {
  boardId: string;
  isOwner: boolean;
  onClose: () => void;
}

interface LLMConfig {
  provider: 'openai' | 'openrouter' | '';
  model: string;
  enabled: boolean;
  has_api_key?: boolean;
}

export const BoardSettings: React.FC<BoardSettingsProps> = ({ boardId, isOwner, onClose }) => {
  const { t } = useLanguage();
  const [llmConfig, setLLMConfig] = useState<LLMConfig>({
    provider: '',
    model: '',
    enabled: false,
  });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modelQuery, setModelQuery] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [searchingModels, setSearchingModels] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);

  useEffect(() => {
    fetchLLMConfig();
  }, [boardId]);

  const fetchLLMConfig = async () => {
    setLoading(true);
    try {
      const tokenRaw = localStorage.getItem('kanban-token');
      const token = tokenRaw ? JSON.parse(tokenRaw) : null;
      const response = await fetch(`/api/boards/${boardId}/llm-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLLMConfig(data);
        setModelQuery(data?.model || '');
      }
    } catch (error) {
      console.error('Failed to fetch LLM config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset model and query when provider changes
  useEffect(() => {
    setLLMConfig((prev) => ({ ...prev, model: '' }));
    setModelQuery('');
    setModelOptions([]);
  }, [llmConfig.provider]);

  // Debounced search for provider models
  useEffect(() => {
    if (!llmConfig.provider) return;
    const q = modelQuery.trim();
    if (q.length < 2) {
      setModelOptions([]);
      return;
    }

    setSearchingModels(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const tokenRaw = localStorage.getItem('kanban-token');
      const token = tokenRaw ? JSON.parse(tokenRaw) : null;
        const res = await fetch(`/api/boards/${boardId}/llm-models/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            provider: llmConfig.provider,
            query: q,
            // If user entered an API key, pass it; otherwise backend may use stored key for owners
            api_key: apiKey || undefined,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          setModelOptions(Array.isArray(data.models) ? data.models : []);
        } else {
          setModelOptions([]);
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setModelOptions([]);
        }
      } finally {
        setSearchingModels(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [boardId, llmConfig.provider, modelQuery, apiKey]);

  const handleSave = async () => {
    const chosenModel = (llmConfig.model && llmConfig.model.trim()) || modelQuery.trim();

    if (!llmConfig.provider || !chosenModel) {
      setMessage({ type: 'error', text: t('boardSettings.llm.providerModelRequired') });
      return;
    }

    if (!apiKey && !llmConfig.has_api_key) {
      setMessage({ type: 'error', text: t('boardSettings.llm.apiKeyRequired') });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const tokenRaw = localStorage.getItem('kanban-token');
      const token = tokenRaw ? JSON.parse(tokenRaw) : null;
      const response = await fetch(`/api/boards/${boardId}/llm-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: llmConfig.provider,
          api_key: apiKey || undefined,
          model: chosenModel,
          enabled: llmConfig.enabled,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('boardSettings.llm.configSaved') });
        setLLMConfig((prev) => ({ ...prev, model: chosenModel }));
        setApiKey(''); // Clear API key from form after saving
        fetchLLMConfig(); // Refresh config
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || t('boardSettings.llm.saveFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('boardSettings.llm.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTasks = async () => {
    setGenerating(true);
    setMessage(null);

    try {
      const tokenRaw = localStorage.getItem('kanban-token');
      const token = tokenRaw ? JSON.parse(tokenRaw) : null;
      const response = await fetch(`/api/boards/${boardId}/generate-tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        // Optionally refresh the board to show new tasks
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || t('boardSettings.llm.generateFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('boardSettings.llm.generateFailed') });
    } finally {
      setGenerating(false);
    }
  };

  const canSearchModels = !!llmConfig.provider && (!!apiKey || !!llmConfig.has_api_key);
  const canSave = !!llmConfig.provider && (!!(llmConfig.model && llmConfig.model.trim()) || !!modelQuery.trim());

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold">{t('boardSettings.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {!isOwner ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {t('boardSettings.ownerOnly')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-medium">{t('boardSettings.llm.title')}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('boardSettings.llm.provider')}
                    </label>
                    <select
                      value={llmConfig.provider}
                      onChange={(e) => setLLMConfig({ ...llmConfig, provider: e.target.value as any, model: '' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('boardSettings.llm.selectProvider')}</option>
                      <option value="openai">OpenAI</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>
                  </div>

                  {llmConfig.provider && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Key className="w-4 h-4 inline mr-1" />
                          {t('boardSettings.llm.apiKey')}
                        </label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={llmConfig.has_api_key ? t('boardSettings.llm.apiKeySet') : t('boardSettings.llm.enterApiKey')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        />
                        {llmConfig.provider === 'openai' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('boardSettings.llm.openaiKeyHelp')}
                          </p>
                        )}
                        {llmConfig.provider === 'openrouter' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('boardSettings.llm.openrouterKeyHelp')}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('boardSettings.llm.model')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={modelQuery}
                            onChange={(e) => { setModelQuery(e.target.value); setShowModelOptions(true); }}
                            onFocus={() => setShowModelOptions(true)}
                            onBlur={() => setTimeout(() => setShowModelOptions(false), 150)}
                            placeholder={t('boardSettings.llm.searchModelPlaceholder')}
                            disabled={!canSearchModels}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                          />
                          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        {!canSearchModels && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('boardSettings.llm.enterApiKeyToSearch')}</p>
                        )}
                        {canSearchModels && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('boardSettings.llm.typeToSearch')}</p>
                        )}

                        {showModelOptions && (modelOptions.length > 0 || searchingModels) && (
                          <div className="absolute z-[1000] mt-2 w-full max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                            {searchingModels ? (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> {t('boardSettings.llm.searching')}
                              </div>
                            ) : (
                              <ul className="py-1">
                                {modelOptions.map((m) => (
                                  <li
                                    key={m}
                                    className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setLLMConfig({ ...llmConfig, model: m });
                                      setModelQuery(m);
                                      setShowModelOptions(false);
                                    }}
                                  >
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="llm-enabled"
                          checked={llmConfig.enabled}
                          onChange={(e) => setLLMConfig({ ...llmConfig, enabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="llm-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('boardSettings.llm.enableLLM')}
                        </label>
                      </div>
                    </>
                  )}
                </div>

                {message && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
                    message.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {message.type === 'success' ? (
                      <Check className="w-5 h-5 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mt-0.5" />
                    )}
                    <p className="text-sm">{message.text}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving || !canSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t('boardSettings.llm.saveConfig')}
                  </button>

                  {llmConfig.enabled && llmConfig.has_api_key && (
                    <button
                      onClick={handleGenerateTasks}
                      disabled={generating}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {t('boardSettings.llm.generateTasks')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
