import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Brain,
  BarChart3,
  FileOutput,
  Code,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Target,
  Layers,
  Activity,
  TrendingUp,
  Database,
  Globe,
  Zap,
  Eye,
  Share2,
  Filter,
  FileText,
  Loader,
  Users,
} from "lucide-react";
import FileManager from '../components/FileManager';
import PreviewModal from '../components/PreviewModal';

interface AgentTask {
  id: string;
  title: string;
  purpose: string;
  agent: 'research' | 'analysis' | 'coding' | 'output';
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  data?: any;
  searchStrategy?: SearchStrategy;
  results?: any[];
}

interface GeneratedFile {
  id: string;
  name: string;
  type: 'html' | 'python' | 'javascript' | 'css' | 'json' | 'text';
  content: string;
  size: number;
  createdAt: Date;
  agentId: string;
  description?: string;
}

interface SearchStrategy {
  phase: 'initial' | 'deep_dive' | 'related' | 'validation';
  keywords: string[];
  queries: string[];
  sources: string[];
  perspectives: string[];
}

interface DataFlow {
  from: string;
  to: string;
  data: any;
  timestamp: Date;
  status: 'pending' | 'transferred' | 'processed';
}

const Files: React.FC = () => {
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [tasks, setTasks] = useState<AgentTask[]>([
    {
      id: "research_1",
      title: "AI技術の最新動向調査",
      purpose: "2024年のAI技術トレンドと市場動向を包括的に調査し、競合分析と将来予測を行う",
      agent: "research",
      status: "in_progress",
      progress: 65,
      startTime: new Date(Date.now() - 300000),
      searchStrategy: {
        phase: "deep_dive",
        keywords: ["AI技術", "機械学習", "深層学習", "自然言語処理", "コンピュータビジョン"],
        queries: [
          "AI technology trends 2024",
          "machine learning market analysis",
          "deep learning applications industry",
          "NLP breakthrough 2024",
          "computer vision commercial use"
        ],
        sources: ["arXiv", "Google Scholar", "IEEE", "Nature", "MIT Technology Review"],
        perspectives: ["技術革新", "市場動向", "産業応用", "研究開発", "投資動向"]
      },
      results: [
        { source: "MIT Technology Review", title: "AI Breakthrough in 2024", relevance: 95 },
        { source: "Nature AI", title: "Deep Learning Applications", relevance: 88 },
        { source: "arXiv", title: "Latest NLP Research", relevance: 92 }
      ]
    },
    {
      id: "analysis_1",
      title: "収集データの分析と洞察抽出",
      purpose: "Research Agentが収集したデータを分析し、重要な洞察とトレンドを抽出する",
      agent: "analysis",
      status: "pending",
      progress: 0,
      data: "Research Agentからのデータ待機中..."
    },
    {
      id: "output_1",
      title: "最終レポート生成",
      purpose: "分析結果を基に包括的なレポートを生成し、実用的な推奨事項を提供する",
      agent: "output",
      status: "pending",
      progress: 0,
      data: "Analysis Agentからのデータ待機中..."
    }
  ]);

  const [dataFlows, setDataFlows] = useState<DataFlow[]>([
    {
      from: "Research Agent",
      to: "Analysis Agent",
      data: { type: "research_results", count: 15, status: "processing" },
      timestamp: new Date(Date.now() - 120000),
      status: "transferred"
    }
  ]);

  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Fetch generated files from backend
  const fetchGeneratedFiles = async () => {
    try {
      const response = await fetch('/api/coding-agent/files');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedFiles = data.files.map((file: any) => ({
            ...file,
            createdAt: new Date(file.createdAt)
          }));
          setGeneratedFiles(formattedFiles);
        }
      }
    } catch (error) {
      console.error('Failed to fetch generated files:', error);
    }
  };

  // Load files on component mount and set up polling
  useEffect(() => {
    fetchGeneratedFiles();
    
    // Poll for new files every 5 seconds
    const interval = setInterval(fetchGeneratedFiles, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (startTime?: Date, endTime?: Date): string => {
    if (!startTime) return "未開始";
    const end = endTime || new Date();
    const diff = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAgentIcon = (agent: AgentTask["agent"]) => {
    switch (agent) {
      case "research":
        return <Search className="w-6 h-6" />;
      case "analysis":
        return <BarChart3 className="w-6 h-6" />;
      case "coding":
        return <Code className="w-6 h-6" />;
      case "output":
        return <FileOutput className="w-6 h-6" />;
      default:
        return <Brain className="w-6 h-6" />;
    }
  };

  const getAgentColor = (agent: AgentTask["agent"]) => {
    switch (agent) {
      case "research":
        return "text-blue-600 bg-blue-100";
      case "analysis":
        return "text-green-600 bg-green-100";
      case "coding":
        return "text-orange-600 bg-orange-100";
      case "output":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: AgentTask["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Activity className="w-5 h-5 text-blue-600 animate-pulse" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPhaseColor = (phase: SearchStrategy["phase"]) => {
    switch (phase) {
      case "initial":
        return "bg-blue-100 text-blue-800";
      case "deep_dive":
        return "bg-green-100 text-green-800";
      case "related":
        return "bg-yellow-100 text-yellow-800";
      case "validation":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.agent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgent = filterType === "all" || task.agent === filterType;
    return matchesSearch && matchesAgent;
  });

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    errorTasks: tasks.filter((t) => t.status === "error").length,
    researchTasks: tasks.filter((t) => t.agent === "research").length,
    analysisTasks: tasks.filter((t) => t.agent === "analysis").length,
    codingTasks: tasks.filter((t) => t.agent === "coding").length,
    outputTasks: tasks.filter((t) => t.agent === "output").length,
    totalDataFlows: dataFlows.length,
    activeDataFlows: dataFlows.filter((df) => df.status === "active").length,
  };

  const handleTaskSelect = (task: AgentTask) => {
    setSelectedTask(task);
  };

  const handleRefresh = () => {
    // リアルタイム更新の手動トリガー
    setRealTimeUpdates(!realTimeUpdates);
    setTimeout(() => setRealTimeUpdates(true), 100);
  };

  const [searchStrategies, setSearchStrategies] = useState([
    {
      id: "strategy_1",
      taskId: "research_1",
      name: "AI Technology Research",
      status: "active",
      perspective: "Technical Innovation",
      queriesExecuted: 7,
      lastUpdate: new Date().toLocaleTimeString()
    },
    {
      id: "strategy_2", 
      taskId: "research_1",
      name: "Market Analysis",
      status: "active",
      perspective: "Market Trends",
      queriesExecuted: 4,
      lastUpdate: new Date().toLocaleTimeString()
    }
  ]);

  // ファイル管理機能
  const handleFilePreview = (file: GeneratedFile) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleFileDownload = async (file: GeneratedFile) => {
    try {
      // Use backend download endpoint for proper file handling
      const response = await fetch(`/api/coding-agent/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download file:', response.statusText);
        // Fallback to client-side download
        const blob = new Blob([file.content], { type: getContentType(file.type) });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to client-side download
      const blob = new Blob([file.content], { type: getContentType(file.type) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getContentType = (type: GeneratedFile['type']): string => {
    switch (type) {
      case 'html': return 'text/html';
      case 'javascript': return 'text/javascript';
      case 'css': return 'text/css';
      case 'python': return 'text/x-python';
      case 'json': return 'application/json';
      default: return 'text/plain';
    }
  };

  // Agent collaboration data
  const [agentCollaboration, setAgentCollaboration] = useState([
    {
      id: 'collab-1',
      sourceAgent: 'Deep Researcher',
      targetAgent: 'Archive Searcher',
      taskTitle: 'AI Technology Market Analysis',
      purpose: 'Historical data validation',
      dataShared: 'Search queries and initial findings',
      status: 'active',
      timestamp: '2 minutes ago'
    },
    {
      id: 'collab-2',
      sourceAgent: 'Archive Searcher',
      targetAgent: 'Deep Researcher',
      taskTitle: 'AI Technology Market Analysis',
      purpose: 'Historical context enrichment',
      dataShared: 'Academic papers and historical trends',
      status: 'completed',
      timestamp: '5 minutes ago'
    },
    {
      id: 'collab-3',
      sourceAgent: 'Deep Researcher',
      targetAgent: 'Web Searcher',
      taskTitle: 'Current Market Trends',
      purpose: 'Real-time data collection',
      dataShared: 'Optimized search queries',
      status: 'pending',
      timestamp: '1 minute ago'
    }
  ]);

  const getSearchStrategies = (taskId: string) => {
    return searchStrategies.filter(strategy => strategy.taskId === taskId);
  };

  // Real-time updates with enhanced progress tracking
  useEffect(() => {
    if (!realTimeUpdates) return;
    
    const interval = setInterval(() => {
      handleRefresh();
      
      // Update task progress and search strategies in real-time
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.status === 'running') {
            // Simulate progress updates for running tasks
            const newProgress = Math.min(task.progress + Math.random() * 5, 95);
            return { ...task, progress: newProgress };
          }
          return task;
        })
      );
    }, 1500); // Update every 1.5 seconds for more responsive UI

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Enhanced search strategy tracking
  useEffect(() => {
    const strategyInterval = setInterval(() => {
      // Update search strategies with real-time data
      setSearchStrategies(prevStrategies => 
        prevStrategies.map(strategy => {
          if (strategy.status === 'active') {
            return {
              ...strategy,
              queriesExecuted: strategy.queriesExecuted + Math.floor(Math.random() * 2),
              lastUpdate: new Date().toLocaleTimeString()
            };
          }
          return strategy;
        })
      );
    }, 3000); // Update search strategies every 3 seconds

    return () => clearInterval(strategyInterval);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DeepResearcher エージェント処理状況</h1>
            <p className="text-gray-600 mt-2">各サブエージェントの処理状況とデータフローをリアルタイムで監視します。</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Activity className="w-4 h-4" />
              更新
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${realTimeUpdates ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {realTimeUpdates ? 'リアルタイム更新中' : '更新停止中'}
              </span>
            </div>
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
              <p className="text-sm text-gray-600">総タスク数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600">完了タスク</p>
              <p className="text-2xl font-bold text-green-900">{stats.completedTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
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
              <p className="text-sm text-gray-600">実行中タスク</p>
              <p className="text-2xl font-bold text-blue-900">{stats.inProgressTasks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600">アクティブデータフロー</p>
              <p className="text-2xl font-bold text-purple-900">{stats.activeDataFlows}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="タスクタイトル、調査目的、エージェント名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべてのエージェント</option>
                <option value="research">Research Agent</option>
                <option value="analysis">Analysis Agent</option>
                <option value="output">Output Agent</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Database className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Search Strategy Monitor */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-600" />
            Active Search Strategies
          </h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchStrategies.filter(s => s.status === 'active').map((strategy) => (
            <div key={strategy.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Queries: {strategy.queriesExecuted}</div>
                <div>Perspective: {strategy.perspective}</div>
                <div>Updated: {strategy.lastUpdate}</div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((strategy.queriesExecuted / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          
          {searchStrategies.filter(s => s.status === 'active').length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active search strategies</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Files Section */}
      {generatedFiles.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Code className="w-6 h-6 mr-2 text-orange-600" />
                生成されたファイル
              </h2>
              <div className="text-sm text-gray-500">
                {generatedFiles.length} ファイル
              </div>
            </div>
            <FileManager
              files={generatedFiles}
              onPreview={handleFilePreview}
              onDownload={handleFileDownload}
            />
          </div>
        </div>
      )}

      {/* Research Quality & Information Collection Metrics */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Information Quality</p>
                <p className="text-2xl font-bold text-green-600">87%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sources Collected</p>
                <p className="text-2xl font-bold text-blue-600">142</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">+23 in last hour</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Perspectives Explored</p>
                <p className="text-2xl font-bold text-purple-600">5</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Technical, Market, Social, Legal, Environmental</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Research Depth</p>
                <p className="text-2xl font-bold text-orange-600">Level 4</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Deep analysis mode</p>
          </div>
        </div>

        {/* Agent Collaboration Status */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Agent Collaboration Status
            </h2>
            <div className="text-sm text-gray-500">
              {agentCollaboration.filter(c => c.status === 'active').length} active collaborations
            </div>
          </div>
          
          <div className="space-y-3">
            {agentCollaboration.map((collab) => (
              <div key={collab.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{collab.taskTitle}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        collab.status === 'active' ? 'bg-green-100 text-green-800' :
                        collab.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {collab.status === 'active' ? 'Active' :
                         collab.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <span className="font-medium">{collab.sourceAgent}</span>
                      <Share2 className="h-4 w-4 mx-2" />
                      <span className="font-medium">{collab.targetAgent}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Purpose:</span> {collab.purpose}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Data Shared:</span> {collab.dataShared}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {collab.timestamp}
                  </div>
                </div>
                
                {collab.status === 'active' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Data Transfer Progress</span>
                      <span>Processing...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      {/* Data Flow Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          データフロー可視化
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataFlows.map((flow) => (
            <div key={flow.from + flow.to} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{flow.from} → {flow.to}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  flow.status === 'transferred' ? 'bg-green-100 text-green-800' : 
                  flow.status === 'processed' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {flow.status === 'transferred' ? '転送済み' : 
                   flow.status === 'processed' ? '処理済み' : '待機中'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{flow.data.type}</p>
              <div className="text-xs text-gray-500">
                件数: {flow.data.count}
              </div>
              {flow.status === 'transferred' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Tasks Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleTaskSelect(task)}
                whileHover={{ scale: 1.02 }}
              >
                {/* Task Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${getAgentColor(task.agent)}`}>
                    {getAgentIcon(task.agent)}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className="text-xs text-gray-500">
                      {formatDuration(task.startTime, task.endTime)}
                    </span>
                  </div>
                </div>
                
                {/* Task Title */}
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  {task.title}
                </h3>
                
                {/* Investigation Purpose */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">調査目的</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {task.purpose}
                  </p>
                </div>
                
                {/* Progress */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>進行状況</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${task.progress}%`}}
                    ></div>
                  </div>
                </div>
                
                {/* Search Strategy (for Research Agent) */}
                {task.agent === 'research' && task.searchStrategy && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">検索戦略</p>
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPhaseColor(task.searchStrategy.phase)}`}>
                        {task.searchStrategy.phase === 'initial' ? '初期検索' :
                         task.searchStrategy.phase === 'deep_dive' ? '深掘り' :
                         task.searchStrategy.phase === 'related' ? '関連検索' : '検証'}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        {task.searchStrategy.keywords.length}キーワード
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Results (for Research Agent) */}
                {task.results && task.results.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Database className="w-3 h-3" />
                      <span>収集結果: {task.results.length}件</span>
                    </div>
                  </div>
                )}
                
                {/* Data Status */}
                {task.data && typeof task.data === 'string' && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{task.data}</span>
                    </div>
                  </div>
                )}
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
                  <th className="text-left p-4 font-medium text-gray-900">タスク名</th>
                  <th className="text-left p-4 font-medium text-gray-900">ステータス</th>
                  <th className="text-left p-4 font-medium text-gray-900">進行状況</th>
                  <th className="text-left p-4 font-medium text-gray-900">実行時間</th>
                  <th className="text-left p-4 font-medium text-gray-900">調査目的</th>
                  <th className="text-left p-4 font-medium text-gray-900">アクション</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredTasks.map((task, index) => (
                    <motion.tr
                      key={task.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleTaskSelect(task)}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${getAgentColor(task.agent)}`}>
                            {getAgentIcon(task.agent)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            <div className="text-xs text-gray-500 capitalize">{task.agent} Agent</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="text-sm capitalize">
                            {task.status === 'in_progress' ? '実行中' :
                             task.status === 'completed' ? '完了' :
                             task.status === 'error' ? 'エラー' : '待機中'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${task.progress}%`}}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatDuration(task.startTime, task.endTime)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700 max-w-xs truncate" title={task.purpose}>
                          {task.purpose}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                            <Target className="w-4 h-4" />
                          </button>
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

      {/* Task Details Modal */}
      {selectedTask && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedTask(null)}
        >
          <motion.div
            className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${getAgentColor(selectedTask.agent)}`}>
                  {getAgentIcon(selectedTask.agent)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                  <p className="text-sm text-gray-500 capitalize">{selectedTask.agent} Agent</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Task Status and Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(selectedTask.status)}
                    <span className="font-medium">
                      {selectedTask.status === 'in_progress' ? '実行中' :
                       selectedTask.status === 'completed' ? '完了' :
                       selectedTask.status === 'error' ? 'エラー' : '待機中'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    実行時間: {formatDuration(selectedTask.startTime, selectedTask.endTime)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">進行状況</span>
                    <span className="text-sm text-gray-600">{selectedTask.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${selectedTask.progress}%`}}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium mb-2">データ状況</div>
                  <div className="text-sm text-gray-600">
                    {selectedTask.results ? 
                      `収集結果: ${selectedTask.results.length}件` :
                      selectedTask.data || '待機中'}
                  </div>
                </div>
              </div>
              
              {/* Investigation Purpose */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">調査目的</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTask.purpose}</p>
              </div>
              
              {/* Search Strategies (for Research Agent) */}
               {selectedTask.agent === 'research' && (
                 <div>
                   <h3 className="font-semibold text-gray-900 mb-4">検索戦略</h3>
                   <div className="space-y-4">
                     {getSearchStrategies(selectedTask.id).map((strategy) => (
                       <div key={strategy.id} className="border rounded-lg p-4">
                         <div className="flex items-center justify-between mb-3">
                           <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(strategy.phase)}`}>
                             {strategy.phase === 'initial' ? '初期検索' :
                              strategy.phase === 'deep_dive' ? '深掘り検索' :
                              strategy.phase === 'related' ? '関連検索' : '検証検索'}
                           </span>
                           <span className="text-sm text-gray-500">
                             {strategy.keywords.length}個のキーワード
                           </span>
                         </div>
                         <div className="mb-3">
                           <p className="text-sm font-medium text-gray-700 mb-1">検索クエリ</p>
                           <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{strategy.query}</p>
                         </div>
                         <div>
                           <p className="text-sm font-medium text-gray-700 mb-1">キーワード</p>
                           <div className="flex flex-wrap gap-1">
                             {strategy.keywords.map((keyword, idx) => (
                               <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                 {keyword}
                               </span>
                             ))}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
              
              {/* Results (if available) */}
              {selectedTask.results && selectedTask.results.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">収集結果</h3>
                  <div className="space-y-3">
                    {selectedTask.results.slice(0, 5).map((result, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{result.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">ソース: {result.source}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>関連性: {result.relevance}%</span>
                        </div>
                      </div>
                    ))}
                    {selectedTask.results.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        他 {selectedTask.results.length - 5} 件の結果があります
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Data Flow Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">データフロー</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataFlows.filter(flow => 
                    flow.from.includes(selectedTask.agent) || flow.to.includes(selectedTask.agent)
                  ).map((flow, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {flow.from} → {flow.to}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          flow.status === 'transferred' ? 'bg-green-100 text-green-800' : 
                          flow.status === 'processed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {flow.status === 'transferred' ? '転送済み' : 
                           flow.status === 'processed' ? '処理済み' : '待機中'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{flow.data.type}</p>
                      <p className="text-xs text-gray-500">件数: {flow.data.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* File Preview Modal */}
      {showPreview && selectedFile && (
        <PreviewModal
          file={selectedFile}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};

export default Files;