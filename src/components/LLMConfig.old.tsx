import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Key, Settings, Sparkles, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LLMConfigProps {
  boardId: string;
  isOwner: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface LLMConfiguration {
  id?: number;
  board_id: string;
  provider: 'openai' | 'openrouter';
  api_key?: string;
  model_name: string;
  enabled: boolean;
}

const LLMConfig: React.FC<LLMConfigProps> = ({ boardId, isOwner, isOpen, onClose }) => {
  const { t } = useLanguage();
  const [config, setConfig] = useState<LLMConfiguration>({
    board_id: boardId,
    provider: 'openai',
    model_name: 'gpt-4',
    enabled: false,
  });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');
  const [generating, setGenerating] = useState(false);

  const openAIModels = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
  ];

  const openRouterModels = [
    'anthropic/claude-3-opus',
    'anthropic/claude-3-sonnet',
    'google/gemini-pro',
    'meta-llama/llama-2-70b-chat',
    'mistralai/mixtral-8x7b-instruct',
  ];

  useEffect(() => {
    fetchLLMConfig();
  }, [boardId]);

  const fetchLLMConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/boards/${boardId}/llm`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch LLM config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey && !config.id) {
      setError(t('llm.apiKeyRequired') || 'API key is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/boards/${boardId}/llm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          api_key: apiKey || undefined,
          model_name: config.model_name,
          enabled: config.enabled,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setApiKey('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('llm.saveFailed') || 'Failed to save configuration');
      }
    } catch (err) {
      setError(t('llm.saveFailed') || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!projectDescription.trim()) {
      setError(t('llm.descriptionRequired') || 'Project description is required');
      return;
    }

    if (!config.enabled) {
      setError(t('llm.notEnabled') || 'LLM is not enabled for this board');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/boards/${boardId}/llm/generate-tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_description: projectDescription,
          auto_assign: true,
        }),
      });

      if (response.ok) {
        await response.json(); // Process response but don't need the data
        setProjectDescription('');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('llm.generateFailed') || 'Failed to generate tasks');
      }
    } catch (err) {
      setError(t('llm.generateFailed') || 'Failed to generate tasks');
    } finally {
      setGenerating(false);
    }
  };

  const models = config.provider === 'openai' ? openAIModels : openRouterModels;

  if (loading) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" />
            {t('llm.title') || 'AI Configuration'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {t('llm.success') || 'Configuration saved successfully!'}
          </div>
        )}

        {isOwner ? (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('llm.provider') || 'AI Provider'}
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value as 'openai' | 'openrouter' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Key className="inline w-4 h-4 mr-1" />
                  {t('llm.apiKey') || 'API Key'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config.id ? t('llm.apiKeyPlaceholder') || 'Leave empty to keep current key' : t('llm.enterApiKey') || 'Enter your API key'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {config.provider === 'openai' 
                    ? t('llm.openaiHelp') || 'Get your API key from platform.openai.com'
                    : t('llm.openrouterHelp') || 'Get your API key from openrouter.ai'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('llm.model') || 'Model'}
                </label>
                <select
                  value={config.model_name}
                  onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="enabled" className="text-sm font-medium">
                  {t('llm.enable') || 'Enable AI for this board'}
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('llm.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    {t('llm.save') || 'Save Configuration'}
                  </>
                )}
              </button>
            </div>

            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                {t('llm.generateTitle') || 'Generate Tasks with AI'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('llm.projectDescription') || 'Project Description'}
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder={t('llm.descriptionPlaceholder') || 'Describe your project goals, features, and requirements...'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-32 resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerateTasks}
                  disabled={generating || !config.enabled}
                  className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('llm.generating') || 'Generating Tasks...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t('llm.generate') || 'Generate Tasks'}
                    </>
                  )}
                </button>

                {!config.enabled && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {t('llm.enableFirst') || 'Enable AI configuration above to generate tasks'}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {t('llm.ownerOnly') || 'Only board owners can configure AI settings'}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LLMConfig;
