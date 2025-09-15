import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Image,
  Video,
  FileText,
  Globe,
  Database,
  Calculator,
  Palette,
  Search,
  Settings,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  Bookmark,
  Share2,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: "code" | "image" | "video" | "text" | "web" | "data" | "utility";
  status: "active" | "inactive" | "running";
  lastUsed?: Date;
  usageCount: number;
  rating: number;
  isFavorite: boolean;
  icon: React.ReactNode;
  features: string[];
  apiEndpoint?: string;
}

const Tools = () => {
  const [tools] = useState<Tool[]>([
    {
      id: "1",
      name: "コードエディター",
      description: "高機能なコードエディターでプログラミング作業を効率化",
      category: "code",
      status: "active",
      lastUsed: new Date(2024, 0, 15, 14, 30),
      usageCount: 127,
      rating: 4.8,
      isFavorite: true,
      icon: <Code className="w-6 h-6" />,
      features: ["シンタックスハイライト", "自動補完", "デバッグ機能", "Git統合"],
      apiEndpoint: "/api/tools/code-editor",
    },
    {
      id: "2",
      name: "画像生成AI",
      description: "テキストから高品質な画像を生成するAIツール",
      category: "image",
      status: "active",
      lastUsed: new Date(2024, 0, 14, 16, 45),
      usageCount: 89,
      rating: 4.9,
      isFavorite: true,
      icon: <Image className="w-6 h-6" />,
      features: ["テキスト→画像", "スタイル選択", "高解像度出力", "バッチ処理"],
      apiEndpoint: "/api/tools/image-generator",
    },
    {
      id: "3",
      name: "動画編集ツール",
      description: "プロフェッショナルな動画編集機能を提供",
      category: "video",
      status: "inactive",
      lastUsed: new Date(2024, 0, 12, 10, 15),
      usageCount: 34,
      rating: 4.5,
      isFavorite: false,
      icon: <Video className="w-6 h-6" />,
      features: ["カット・編集", "エフェクト", "音声調整", "エクスポート"],
      apiEndpoint: "/api/tools/video-editor",
    },
    {
      id: "4",
      name: "文書生成AI",
      description: "AIを活用した高品質な文書作成支援ツール",
      category: "text",
      status: "running",
      lastUsed: new Date(2024, 0, 15, 18, 20),
      usageCount: 156,
      rating: 4.7,
      isFavorite: true,
      icon: <FileText className="w-6 h-6" />,
      features: ["自動生成", "校正機能", "翻訳", "要約"],
      apiEndpoint: "/api/tools/text-generator",
    },
    {
      id: "5",
      name: "Webスクレイピング",
      description: "Webサイトからデータを自動収集するツール",
      category: "web",
      status: "active",
      lastUsed: new Date(2024, 0, 13, 9, 30),
      usageCount: 67,
      rating: 4.3,
      isFavorite: false,
      icon: <Globe className="w-6 h-6" />,
      features: ["データ抽出", "スケジュール実行", "API連携", "フィルタリング"],
      apiEndpoint: "/api/tools/web-scraper",
    },
    {
      id: "6",
      name: "データ分析ツール",
      description: "統計分析と可視化を行う高度なデータ分析ツール",
      category: "data",
      status: "active",
      lastUsed: new Date(2024, 0, 11, 15, 45),
      usageCount: 92,
      rating: 4.6,
      isFavorite: true,
      icon: <Database className="w-6 h-6" />,
      features: ["統計分析", "グラフ作成", "機械学習", "レポート生成"],
      apiEndpoint: "/api/tools/data-analyzer",
    },
    {
      id: "7",
      name: "計算機ツール",
      description: "高度な数学計算と関数グラフ描画機能",
      category: "utility",
      status: "active",
      lastUsed: new Date(2024, 0, 10, 11, 20),
      usageCount: 45,
      rating: 4.2,
      isFavorite: false,
      icon: <Calculator className="w-6 h-6" />,
      features: ["科学計算", "グラフ描画", "単位変換", "履歴保存"],
      apiEndpoint: "/api/tools/calculator",
    },
    {
      id: "8",
      name: "カラーパレット",
      description: "デザイン作業に最適なカラーパレット生成ツール",
      category: "utility",
      status: "inactive",
      lastUsed: new Date(2024, 0, 9, 14, 10),
      usageCount: 23,
      rating: 4.4,
      isFavorite: false,
      icon: <Palette className="w-6 h-6" />,
      features: ["パレット生成", "色彩理論", "アクセシビリティ", "エクスポート"],
      apiEndpoint: "/api/tools/color-palette",
    },
  ]);

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getCategoryIcon = (category: Tool["category"]) => {
    switch (category) {
      case "code":
        return <Code className="w-5 h-5" />;
      case "image":
        return <Image className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "text":
        return <FileText className="w-5 h-5" />;
      case "web":
        return <Globe className="w-5 h-5" />;
      case "data":
        return <Database className="w-5 h-5" />;
      case "utility":
        return <Calculator className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: Tool["category"]) => {
    switch (category) {
      case "code":
        return "text-blue-600 bg-blue-100";
      case "image":
        return "text-green-600 bg-green-100";
      case "video":
        return "text-purple-600 bg-purple-100";
      case "text":
        return "text-orange-600 bg-orange-100";
      case "web":
        return "text-cyan-600 bg-cyan-100";
      case "data":
        return "text-indigo-600 bg-indigo-100";
      case "utility":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status: Tool["status"]) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "running":
        return "text-blue-600 bg-blue-100";
      case "inactive":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: Tool["status"]) => {
    switch (status) {
      case "active":
        return <Play className="w-4 h-4" />;
      case "running":
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case "inactive":
        return <Pause className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === "all" || tool.category === filterCategory;
    const matchesStatus = filterStatus === "all" || tool.status === filterStatus;
    const matchesFavorites = !showFavoritesOnly || tool.isFavorite;
    return matchesSearch && matchesCategory && matchesStatus && matchesFavorites;
  });

  const getCategoryStats = () => {
    const stats = {
      code: 0,
      image: 0,
      video: 0,
      text: 0,
      web: 0,
      data: 0,
      utility: 0,
    };
    tools.forEach(tool => {
      stats[tool.category]++;
    });
    return stats;
  };

  const getStatusStats = () => {
    const stats = {
      active: 0,
      running: 0,
      inactive: 0,
    };
    tools.forEach(tool => {
      stats[tool.status]++;
    });
    return stats;
  };

  const handleCopyEndpoint = (endpoint: string, toolId: string) => {
    navigator.clipboard.writeText(endpoint);
    setCopiedId(toolId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categoryStats = getCategoryStats();
  const statusStats = getStatusStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ツール統合</h1>
            <p className="text-gray-600 mt-2">利用可能なツールの管理と統合</p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-5 h-5" />
              <span>ツール追加</span>
            </motion.button>
            <motion.button
              className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
              <span>設定</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総ツール数</p>
              <p className="text-2xl font-bold text-gray-900">{tools.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">アクティブ</p>
              <p className="text-2xl font-bold text-green-600">{statusStats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">実行中</p>
              <p className="text-2xl font-bold text-blue-600">{statusStats.running}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">お気に入り</p>
              <p className="text-2xl font-bold text-yellow-600">{tools.filter(t => t.isFavorite).length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="ツールを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全カテゴリ</option>
                <option value="code">コード</option>
                <option value="image">画像</option>
                <option value="video">動画</option>
                <option value="text">テキスト</option>
                <option value="web">Web</option>
                <option value="data">データ</option>
                <option value="utility">ユーティリティ</option>
              </select>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全ステータス</option>
              <option value="active">アクティブ</option>
              <option value="running">実行中</option>
              <option value="inactive">非アクティブ</option>
            </select>
            
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFavoritesOnly ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
              <span>お気に入りのみ</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tools Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTool(tool)}
                whileHover={{ scale: 1.02 }}
              >
                {/* Tool Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(tool.category)}`}>
                      {tool.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(tool.category)}`}>
                          {tool.category}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${getStatusColor(tool.status)}`}>
                          {getStatusIcon(tool.status)}
                          <span>{tool.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle favorite logic here
                    }}
                    className={`p-1 rounded transition-colors ${
                      tool.isFavorite ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
                    }`}
                  >
                    <Star className={`w-5 h-5 ${tool.isFavorite ? "fill-current" : ""}`} />
                  </button>
                </div>
                
                {/* Tool Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tool.description}</p>
                
                {/* Tool Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span>使用回数: {tool.usageCount}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{tool.rating}</span>
                    </div>
                  </div>
                  {tool.lastUsed && (
                    <span>最終使用: {tool.lastUsed.toLocaleDateString()}</span>
                  )}
                </div>
                
                {/* Tool Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {tool.features.slice(0, 3).map((feature) => (
                      <span key={feature} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                    {tool.features.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{tool.features.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Tool Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Launch tool logic here
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Settings logic here
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  {tool.apiEndpoint && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyEndpoint(tool.apiEndpoint!, tool.id);
                      }}
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {copiedId === tool.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-xs">API</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">ツール名</th>
                  <th className="text-left p-4 font-medium text-gray-900">カテゴリ</th>
                  <th className="text-left p-4 font-medium text-gray-900">ステータス</th>
                  <th className="text-left p-4 font-medium text-gray-900">使用回数</th>
                  <th className="text-left p-4 font-medium text-gray-900">評価</th>
                  <th className="text-left p-4 font-medium text-gray-900">最終使用</th>
                  <th className="text-left p-4 font-medium text-gray-900">アクション</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredTools.map((tool, index) => (
                    <motion.tr
                      key={tool.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => setSelectedTool(tool)}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${getCategoryColor(tool.category)}`}>
                            {getCategoryIcon(tool.category)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{tool.name}</span>
                              {tool.isFavorite && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate max-w-xs">{tool.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(tool.category)}`}>
                          {tool.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs flex items-center space-x-1 w-fit ${getStatusColor(tool.status)}`}>
                          {getStatusIcon(tool.status)}
                          <span>{tool.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{tool.usageCount}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-gray-600">{tool.rating}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {tool.lastUsed ? tool.lastUsed.toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Launch tool logic here
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Settings logic here
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          {tool.apiEndpoint && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyEndpoint(tool.apiEndpoint!, tool.id);
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            >
                              {copiedId === tool.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tool Detail Modal */}
      {selectedTool && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedTool(null)}
        >
          <motion.div
            className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getCategoryColor(selectedTool.category)}`}>
                  {selectedTool.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTool.name}</h2>
                  <p className="text-gray-600">{selectedTool.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTool(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tool Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">機能一覧</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTool.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedTool.apiEndpoint && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">API エンドポイント</h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span>{selectedTool.apiEndpoint}</span>
                        <button
                          onClick={() => handleCopyEndpoint(selectedTool.apiEndpoint!, selectedTool.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedId === selectedTool.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tool Stats */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">統計情報</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">カテゴリ:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(selectedTool.category)}`}>
                        {selectedTool.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ステータス:</span>
                      <span className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${getStatusColor(selectedTool.status)}`}>
                        {getStatusIcon(selectedTool.status)}
                        <span>{selectedTool.status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">使用回数:</span>
                      <span className="font-medium">{selectedTool.usageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">評価:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{selectedTool.rating}</span>
                      </div>
                    </div>
                    {selectedTool.lastUsed && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">最終使用:</span>
                        <span>{selectedTool.lastUsed.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
              <div className="flex items-center space-x-3">
                <motion.button
                  className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>ツールを起動</span>
                </motion.button>
                <motion.button
                  className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-4 h-4" />
                  <span>設定</span>
                </motion.button>
              </div>
              <div className="flex items-center space-x-3">
                <motion.button
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedTool.isFavorite
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Star className={`w-4 h-4 ${selectedTool.isFavorite ? "fill-current" : ""}`} />
                  <span>{selectedTool.isFavorite ? "お気に入り解除" : "お気に入り追加"}</span>
                </motion.button>
                <motion.button
                  className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 className="w-4 h-4" />
                  <span>共有</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Tools;