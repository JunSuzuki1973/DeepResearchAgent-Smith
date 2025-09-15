import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  Lock,
  Unlock,
  Zap,
  Clock,
  FileText,
  Image,
  Video,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { llmService } from "../services/llm";
import { useAppStore } from "../store/useAppStore";

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const Settings = () => {
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [activeSection, setActiveSection] = useState("profile");
  const getInitialSettings = () => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      // Profile Settings
      profile: {
        name: "Deep Research User",
        email: "user@deepresearch.ai",
        avatar: "",
        timezone: "Asia/Tokyo",
        language: "ja",
      },
      // Notification Settings
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        taskCompletion: true,
        agentUpdates: false,
        systemAlerts: true,
        weeklyReport: true,
        soundEnabled: true,
      },
      // Appearance Settings
      appearance: {
        theme: "light", // light, dark, auto
        colorScheme: "blue", // blue, green, purple, orange
        fontSize: "medium", // small, medium, large
        compactMode: false,
        animations: true,
        sidebarCollapsed: false,
      },
      // Privacy & Security
      privacy: {
        dataCollection: true,
        analyticsTracking: false,
        shareUsageData: false,
        twoFactorAuth: false,
        sessionTimeout: 30, // minutes
        autoLogout: true,
      },
      // API & Integration
       api: {
         openaiKey: "",
         anthropicKey: "",
         googleKey: "",
         webhookUrl: "",
         rateLimitPerHour: 1000,
         enableCaching: true,
         selectedModel: "claude-sonnet-4-20250514",
         modelSettings: {
           temperature: 0.7,
           maxTokens: 2000,
           topP: 1.0,
         },
       },
      // Performance
      performance: {
        maxConcurrentTasks: 5,
        autoSaveInterval: 30, // seconds
        cacheSize: 100, // MB
        enablePreloading: true,
        compressionLevel: "medium",
      },
      // File Management
      files: {
        maxFileSize: 100, // MB
        allowedFileTypes: ["pdf", "docx", "txt", "jpg", "png", "mp4", "mp3"],
        autoDeleteAfter: 30, // days
        enableVersioning: true,
        compressionEnabled: true,
      },
    };
  };

  const [settings, setSettings] = useState(getInitialSettings);


  const [showApiKeys, setShowApiKeys] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [keyValidation, setKeyValidation] = useState<{
    openai: 'idle' | 'validating' | 'valid' | 'invalid';
    anthropic: 'idle' | 'validating' | 'valid' | 'invalid';
    google: 'idle' | 'validating' | 'valid' | 'invalid';
  }>({
    openai: 'idle',
    anthropic: 'idle',
    google: 'idle',
  });

  const sections: SettingsSection[] = [
    {
      id: "profile",
      title: "プロフィール",
      icon: <User className="w-5 h-5" />,
      description: "個人情報とアカウント設定",
    },
    {
      id: "notifications",
      title: "通知",
      icon: <Bell className="w-5 h-5" />,
      description: "通知とアラートの設定",
    },
    {
      id: "appearance",
      title: "外観",
      icon: <Palette className="w-5 h-5" />,
      description: "テーマとレイアウトの設定",
    },
    {
      id: "privacy",
      title: "プライバシー・セキュリティ",
      icon: <Shield className="w-5 h-5" />,
      description: "プライバシーとセキュリティの設定",
    },
    {
      id: "api",
      title: "API・統合",
      icon: <Key className="w-5 h-5" />,
      description: "外部サービスとの統合設定",
    },
    {
      id: "performance",
      title: "パフォーマンス",
      icon: <Zap className="w-5 h-5" />,
      description: "システムパフォーマンスの設定",
    },
    {
      id: "files",
      title: "ファイル管理",
      icon: <FileText className="w-5 h-5" />,
      description: "ファイルアップロードと管理の設定",
    },
  ];

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
    setUnsavedChanges(true);
  };

  const validateApiKey = async (provider: 'openai' | 'anthropic' | 'google', key: string) => {
    if (!key.trim()) {
      setKeyValidation(prev => ({ ...prev, [provider]: 'idle' }));
      return;
    }

    setKeyValidation(prev => ({ ...prev, [provider]: 'validating' }));
    
    try {
      const isValid = await llmService.validateApiKey(provider, key);
      setKeyValidation(prev => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }));
    } catch (error) {
      setKeyValidation(prev => ({ ...prev, [provider]: 'invalid' }));
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('settings', JSON.stringify(settings));
      
      // Save individual API keys for backward compatibility
      if (settings.api.openaiKey) {
        localStorage.setItem('openai_api_key', settings.api.openaiKey);
      }
      if (settings.api.anthropicKey) {
        localStorage.setItem('anthropic_api_key', settings.api.anthropicKey);
      }
      if (settings.api.googleKey) {
        localStorage.setItem('google_api_key', settings.api.googleKey);
      }
      if (settings.api.selectedModel) {
        localStorage.setItem('selected_model', settings.api.selectedModel);
      }
      
      // Save agent-specific model settings
      if (settings.api.topLevelModel) {
        localStorage.setItem('top_level_model', settings.api.topLevelModel);
      }
      if (settings.api.subAgentModel) {
        localStorage.setItem('sub_agent_model', settings.api.subAgentModel);
      }
      
      // Update Zustand store
      updateSettings(settings);
      
      setSaveStatus("saved");
      setUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleReset = () => {
    if (confirm("設定をリセットしますか？")) {
      localStorage.removeItem("settings");
      setSettings(getInitialSettings());
      setKeyValidation({
        openai: 'idle',
        anthropic: 'idle',
        google: 'idle',
      });
      setUnsavedChanges(false);
      setSaveStatus("idle");
    }
  };

  // Load existing API keys and validate them on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          
          // Load agent-specific model settings from localStorage
          const topLevelModel = localStorage.getItem('top_level_model');
          const subAgentModel = localStorage.getItem('sub_agent_model');
          
          if (topLevelModel) {
            parsed.api = parsed.api || {};
            parsed.api.topLevelModel = topLevelModel;
          }
          if (subAgentModel) {
            parsed.api = parsed.api || {};
            parsed.api.subAgentModel = subAgentModel;
          }
          
          setSettings(parsed);
          
          // Validate existing API keys
          if (parsed.api?.openaiKey) {
            setKeyValidation(prev => ({ ...prev, openai: 'validating' }));
            const isValid = await llmService.validateApiKey('openai', parsed.api.openaiKey);
            setKeyValidation(prev => ({ ...prev, openai: isValid ? 'valid' : 'invalid' }));
          }
          
          if (parsed.api?.anthropicKey) {
            setKeyValidation(prev => ({ ...prev, anthropic: 'validating' }));
            const isValid = await llmService.validateApiKey('anthropic', parsed.api.anthropicKey);
            setKeyValidation(prev => ({ ...prev, anthropic: isValid ? 'valid' : 'invalid' }));
          }
          
          if (parsed.api?.googleKey) {
            setKeyValidation(prev => ({ ...prev, google: 'validating' }));
            const isValid = await llmService.validateApiKey('google', parsed.api.googleKey);
            setKeyValidation(prev => ({ ...prev, google: isValid ? 'valid' : 'invalid' }));
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
            <input
              type="text"
              value={settings.profile.name}
              onChange={(e) => updateSetting("profile", "name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <input
              type="email"
              value={settings.profile.email}
              onChange={(e) => updateSetting("profile", "email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タイムゾーン</label>
            <select
              value={settings.profile.timezone}
              onChange={(e) => updateSetting("profile", "timezone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">言語</label>
            <select
              value={settings.profile.language}
              onChange={(e) => updateSetting("profile", "language", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ko">한국어</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">通知設定</h3>
        <div className="space-y-4">
          {[
            { key: "emailNotifications", label: "メール通知", description: "重要な更新をメールで受信" },
            { key: "pushNotifications", label: "プッシュ通知", description: "ブラウザ通知を有効にする" },
            { key: "taskCompletion", label: "タスク完了通知", description: "タスクが完了した時に通知" },
            { key: "agentUpdates", label: "エージェント更新通知", description: "エージェントの状態変更を通知" },
            { key: "systemAlerts", label: "システムアラート", description: "システムの重要な通知" },
            { key: "weeklyReport", label: "週次レポート", description: "週次の活動レポートを受信" },
            { key: "soundEnabled", label: "サウンド通知", description: "通知音を有効にする" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <button
                onClick={() => updateSetting("notifications", item.key, !settings.notifications[item.key as keyof typeof settings.notifications])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications[item.key as keyof typeof settings.notifications] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications[item.key as keyof typeof settings.notifications] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">テーマ設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">テーマ</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light", label: "ライト", icon: <Sun className="w-4 h-4" /> },
                { value: "dark", label: "ダーク", icon: <Moon className="w-4 h-4" /> },
                { value: "auto", label: "自動", icon: <Monitor className="w-4 h-4" /> },
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateSetting("appearance", "theme", theme.value)}
                  className={`flex flex-col items-center p-3 border rounded-lg transition-colors ${
                    settings.appearance.theme === theme.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {theme.icon}
                  <span className="text-sm mt-1">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カラースキーム</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: "blue", color: "bg-blue-500" },
                { value: "green", color: "bg-green-500" },
                { value: "purple", color: "bg-purple-500" },
                { value: "orange", color: "bg-orange-500" },
              ].map((scheme) => (
                <button
                  key={scheme.value}
                  onClick={() => updateSetting("appearance", "colorScheme", scheme.value)}
                  className={`w-12 h-12 rounded-lg ${scheme.color} border-2 transition-all ${
                    settings.appearance.colorScheme === scheme.value
                      ? "border-gray-900 scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">フォントサイズ</label>
            <select
              value={settings.appearance.fontSize}
              onChange={(e) => updateSetting("appearance", "fontSize", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4 mt-6">
          {[
            { key: "compactMode", label: "コンパクトモード", description: "より多くの情報を表示" },
            { key: "animations", label: "アニメーション", description: "UI アニメーションを有効にする" },
            { key: "sidebarCollapsed", label: "サイドバー折りたたみ", description: "デフォルトでサイドバーを折りたたむ" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <button
                onClick={() => updateSetting("appearance", item.key, !settings.appearance[item.key as keyof typeof settings.appearance])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.appearance[item.key as keyof typeof settings.appearance] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.appearance[item.key as keyof typeof settings.appearance] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">プライバシー設定</h3>
        <div className="space-y-4">
          {[
            { key: "dataCollection", label: "データ収集", description: "サービス改善のためのデータ収集を許可" },
            { key: "analyticsTracking", label: "分析トラッキング", description: "使用状況の分析を許可" },
            { key: "shareUsageData", label: "使用データ共有", description: "匿名化された使用データの共有を許可" },
            { key: "autoLogout", label: "自動ログアウト", description: "非アクティブ時の自動ログアウト" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <button
                onClick={() => updateSetting("privacy", item.key, !settings.privacy[item.key as keyof typeof settings.privacy])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy[item.key as keyof typeof settings.privacy] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy[item.key as keyof typeof settings.privacy] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">セキュリティ設定</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">セッションタイムアウト (分)</label>
              <input
                type="number"
                value={settings.privacy.sessionTimeout}
                onChange={(e) => updateSetting("privacy", "sessionTimeout", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="480"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">二要素認証</h4>
                <p className="text-sm text-gray-600">追加のセキュリティレイヤー</p>
              </div>
              <button
                onClick={() => updateSetting("privacy", "twoFactorAuth", !settings.privacy.twoFactorAuth)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.twoFactorAuth ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">LLM モデル設定</h3>
        <div className="mb-8">
          <h4 className="font-medium text-gray-900 mb-4">エージェント別LLM設定</h4>
          
          {/* Top Level Agent Settings */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              トップレベルエージェント
            </h5>
            <p className="text-sm text-blue-700 mb-3">メインの対話を担当するエージェント用のLLM設定</p>
            <select
              value={settings.api.topLevelModel || settings.api.selectedModel}
              onChange={(e) => updateSetting("api", "topLevelModel", e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <optgroup label="OpenAI">
                <option value="gpt-5">GPT-5</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="claude-4-opus">Claude 4 Opus</option>
                <option value="claude-4-sonnet">Claude 4 Sonnet</option>
                <option value="claude-4-haiku">Claude 4 Haiku</option>
                <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              </optgroup>
              <optgroup label="Google">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-pro">Gemini Pro</option>
              </optgroup>
            </select>
          </div>

          {/* Sub Agent Settings */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h5 className="font-medium text-green-900 mb-3 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              サブエージェント（専門タスク用）
            </h5>
            <p className="text-sm text-green-700 mb-3">リサーチ、分析、ブラウジングなど専門的なタスクを担当するエージェント用のLLM設定</p>
            <select
              value={settings.api.subAgentModel || settings.api.selectedModel}
              onChange={(e) => updateSetting("api", "subAgentModel", e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <optgroup label="OpenAI">
                <option value="gpt-5">GPT-5</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="claude-4-opus">Claude 4 Opus</option>
                <option value="claude-4-sonnet">Claude 4 Sonnet</option>
                <option value="claude-4-haiku">Claude 4 Haiku</option>
                <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              </optgroup>
              <optgroup label="Google">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-pro">Gemini Pro</option>
              </optgroup>
            </select>
          </div>

          {/* Legacy Model Selection (for backward compatibility) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-700 mb-3 flex items-center">
              <SettingsIcon className="w-4 h-4 mr-2" />
              デフォルトモデル（互換性維持用）
            </h5>
            <p className="text-sm text-gray-600 mb-3">上記で設定されていない場合に使用されるデフォルトモデル</p>
            <select
              value={settings.api.selectedModel}
              onChange={(e) => updateSetting("api", "selectedModel", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="OpenAI">
                <option value="gpt-5">GPT-5</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="claude-4-opus">Claude 4 Opus</option>
                <option value="claude-4-sonnet">Claude 4 Sonnet</option>
                <option value="claude-4-haiku">Claude 4 Haiku</option>
                <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              </optgroup>
              <optgroup label="Google">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-pro">Gemini Pro</option>
              </optgroup>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">モデルパラメータ</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
              <input
                type="number"
                value={settings.api.modelSettings.temperature}
                onChange={(e) => updateSetting("api", "modelSettings", {
                  ...settings.api.modelSettings,
                  temperature: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="2"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
              <input
                type="number"
                value={settings.api.modelSettings.maxTokens}
                onChange={(e) => updateSetting("api", "modelSettings", {
                  ...settings.api.modelSettings,
                  maxTokens: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="8000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Top P</label>
              <input
                type="number"
                value={settings.api.modelSettings.topP}
                onChange={(e) => updateSetting("api", "modelSettings", {
                  ...settings.api.modelSettings,
                  topP: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API キー設定</h3>
        <div className="space-y-4">
          {[
            { key: "openaiKey", label: "OpenAI API キー", placeholder: "sk-...", provider: "openai" as const },
            { key: "anthropicKey", label: "Anthropic API キー", placeholder: "sk-ant-...", provider: "anthropic" as const },
            { key: "googleKey", label: "Google API キー", placeholder: "AIza...", provider: "google" as const },
          ].map((api) => {
            const validationStatus = keyValidation[api.provider];
            return (
              <div key={api.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{api.label}</label>
                <div className="relative">
                  <input
                    type={showApiKeys ? "text" : "password"}
                    value={(settings.api as any)[api.key] || ''}
                    onChange={(e) => {
                      updateSetting("api", api.key, e.target.value);
                      validateApiKey(api.provider, e.target.value);
                    }}
                    placeholder={api.placeholder}
                    className={`w-full px-3 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationStatus === 'valid' ? 'border-green-300' :
                      validationStatus === 'invalid' ? 'border-red-300' :
                      'border-gray-300'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    {validationStatus === 'validating' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {validationStatus === 'valid' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {validationStatus === 'invalid' && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <button
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {validationStatus === 'invalid' && (
                  <p className="text-sm text-red-600 mt-1">無効なAPIキーです</p>
                )}
                {validationStatus === 'valid' && (
                  <p className="text-sm text-green-600 mt-1">有効なAPIキーです</p>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">統合設定</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <input
                type="url"
                value={settings.api.webhookUrl}
                onChange={(e) => updateSetting("api", "webhookUrl", e.target.value)}
                placeholder="https://example.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">レート制限 (時間あたり)</label>
              <input
                type="number"
                value={settings.api.rateLimitPerHour}
                onChange={(e) => updateSetting("api", "rateLimitPerHour", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10000"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">キャッシュ有効化</h4>
                <p className="text-sm text-gray-600">API レスポンスのキャッシュを有効にする</p>
              </div>
              <button
                onClick={() => updateSetting("api", "enableCaching", !settings.api.enableCaching)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.api.enableCaching ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.api.enableCaching ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">パフォーマンス設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最大同時実行タスク数</label>
            <input
              type="number"
              value={settings.performance.maxConcurrentTasks}
              onChange={(e) => updateSetting("performance", "maxConcurrentTasks", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">自動保存間隔 (秒)</label>
            <input
              type="number"
              value={settings.performance.autoSaveInterval}
              onChange={(e) => updateSetting("performance", "autoSaveInterval", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">キャッシュサイズ (MB)</label>
            <input
              type="number"
              value={settings.performance.cacheSize}
              onChange={(e) => updateSetting("performance", "cacheSize", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">圧縮レベル</label>
            <select
              value={settings.performance.compressionLevel}
              onChange={(e) => updateSetting("performance", "compressionLevel", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">プリロード有効化</h4>
              <p className="text-sm text-gray-600">よく使用されるデータの事前読み込み</p>
            </div>
            <button
              onClick={() => updateSetting("performance", "enablePreloading", !settings.performance.enablePreloading)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.performance.enablePreloading ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.performance.enablePreloading ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilesSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ファイル管理設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最大ファイルサイズ (MB)</label>
            <input
              type="number"
              value={settings.files.maxFileSize}
              onChange={(e) => updateSetting("files", "maxFileSize", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">自動削除期間 (日)</label>
            <input
              type="number"
              value={settings.files.autoDeleteAfter}
              onChange={(e) => updateSetting("files", "autoDeleteAfter", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="365"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">許可ファイル形式</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["pdf", "docx", "txt", "jpg", "png", "gif", "mp4", "mp3", "wav", "zip", "csv", "xlsx"].map((type) => (
              <label key={type} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={settings.files.allowedFileTypes.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...settings.files.allowedFileTypes, type]
                      : settings.files.allowedFileTypes.filter(t => t !== type);
                    updateSetting("files", "allowedFileTypes", newTypes);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">.{type}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          {[
            { key: "enableVersioning", label: "バージョン管理", description: "ファイルのバージョン履歴を保持" },
            { key: "compressionEnabled", label: "圧縮有効化", description: "アップロード時にファイルを圧縮" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <button
                onClick={() => updateSetting("files", item.key, !settings.files[item.key as keyof typeof settings.files])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.files[item.key as keyof typeof settings.files] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.files[item.key as keyof typeof settings.files] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSettings();
      case "notifications":
        return renderNotificationSettings();
      case "appearance":
        return renderAppearanceSettings();
      case "privacy":
        return renderPrivacySettings();
      case "api":
        return renderApiSettings();
      case "performance":
        return renderPerformanceSettings();
      case "files":
        return renderFilesSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">設定</h1>
            <p className="text-gray-600 mt-2">アプリケーションの設定とカスタマイズ</p>
          </div>
          
          {/* Save Status */}
          {unsavedChanges && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">未保存の変更があります</span>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={handleReset}
                  className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                  <span>リセット</span>
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {saveStatus === "saving" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : saveStatus === "saved" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {saveStatus === "saving" ? "保存中..." : saveStatus === "saved" ? "保存済み" : "保存"}
                  </span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-80">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    activeSection === section.id ? "text-blue-600" : "text-gray-400"
                  }`}>
                    {section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm text-gray-500 truncate">{section.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            key={activeSection}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderSectionContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;