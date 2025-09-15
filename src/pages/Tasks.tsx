import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Calendar,
  User,
  BarChart3,
  FileText,
  Settings,
  Trash2,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  priority: "low" | "medium" | "high";
  assignedAgent: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime: string;
  actualTime?: string;
  progress: number;
  tags: string[];
}

const Tasks = () => {
  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "市場調査レポート作成",
      description: "AI技術市場の最新動向と競合分析を含む包括的なレポートを作成",
      status: "running",
      priority: "high",
      assignedAgent: "Deep Researcher",
      createdAt: new Date(2024, 0, 15, 9, 30),
      updatedAt: new Date(2024, 0, 15, 14, 45),
      estimatedTime: "2時間",
      progress: 65,
      tags: ["調査", "レポート", "市場分析"],
    },
    {
      id: "2",
      title: "データ分析とビジュアライゼーション",
      description: "売上データの統計分析とダッシュボード作成",
      status: "completed",
      priority: "medium",
      assignedAgent: "Deep Analyzer",
      createdAt: new Date(2024, 0, 14, 10, 0),
      updatedAt: new Date(2024, 0, 14, 16, 30),
      estimatedTime: "3時間",
      actualTime: "2時間45分",
      progress: 100,
      tags: ["データ分析", "可視化"],
    },
    {
      id: "3",
      title: "競合サイト情報収集",
      description: "主要競合他社のウェブサイトから製品情報と価格データを収集",
      status: "failed",
      priority: "medium",
      assignedAgent: "Browser Agent",
      createdAt: new Date(2024, 0, 13, 11, 15),
      updatedAt: new Date(2024, 0, 13, 12, 0),
      estimatedTime: "1時間",
      progress: 25,
      tags: ["情報収集", "競合分析"],
    },
    {
      id: "4",
      title: "プレゼンテーション資料作成",
      description: "月次業績報告用のプレゼンテーション資料を作成",
      status: "pending",
      priority: "high",
      assignedAgent: "General Agent",
      createdAt: new Date(2024, 0, 15, 15, 0),
      updatedAt: new Date(2024, 0, 15, 15, 0),
      estimatedTime: "1.5時間",
      progress: 0,
      tags: ["プレゼン", "資料作成"],
    },
    {
      id: "5",
      title: "顧客満足度調査分析",
      description: "アンケート結果の統計分析と改善提案の作成",
      status: "pending",
      priority: "low",
      assignedAgent: "Deep Analyzer",
      createdAt: new Date(2024, 0, 12, 14, 30),
      updatedAt: new Date(2024, 0, 12, 14, 30),
      estimatedTime: "4時間",
      progress: 0,
      tags: ["調査", "分析", "顧客満足度"],
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-600 bg-gray-100";
      case "running":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "running":
        return <Play className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "high":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusStats = () => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      running: tasks.filter(t => t.status === "running").length,
      completed: tasks.filter(t => t.status === "completed").length,
      failed: tasks.filter(t => t.status === "failed").length,
    };
  };

  const stats = getStatusStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">タスク管理</h1>
            <p className="text-gray-600 mt-2">AIエージェントのタスク実行状況を監視・管理</p>
          </div>
          <motion.button
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>新しいタスク</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総タスク数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600" />
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
              <p className="text-sm text-gray-600">待機中</p>
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-600" />
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
              <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600">完了</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
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
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">失敗</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="タスクを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全ステータス</option>
                <option value="pending">待機中</option>
                <option value="running">実行中</option>
                <option value="completed">完了</option>
                <option value="failed">失敗</option>
              </select>
            </div>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全優先度</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedTask(task)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      <span className="capitalize">{task.status}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{task.assignedAgent}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{task.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimatedTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    {task.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {task.status === "running" && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>進捗</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedTask(null)}
        >
          <motion.div
            className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">タスク詳細</h3>
                <p className="text-gray-600">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">基本情報</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ステータス:</span>
                      <span className={`capitalize ${getStatusColor(selectedTask.status)} px-2 py-1 rounded text-xs`}>
                        {selectedTask.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">優先度:</span>
                      <span className={`${getPriorityColor(selectedTask.priority)} px-2 py-1 rounded text-xs`}>
                        {selectedTask.priority === "high" ? "高" : selectedTask.priority === "medium" ? "中" : "低"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">担当エージェント:</span>
                      <span>{selectedTask.assignedAgent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">予想時間:</span>
                      <span>{selectedTask.estimatedTime}</span>
                    </div>
                    {selectedTask.actualTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">実際の時間:</span>
                        <span>{selectedTask.actualTime}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">タイムライン</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">作成日時:</span>
                      <span>{selectedTask.createdAt.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">更新日時:</span>
                      <span>{selectedTask.updatedAt.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedTask.status === "running" && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">進捗状況</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">完了率</span>
                      <span className="font-medium">{selectedTask.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedTask.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Tasks;