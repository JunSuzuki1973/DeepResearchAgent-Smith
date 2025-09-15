import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Settings,
  Play,
  Pause,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  description: string;
  tasksCompleted: number;
  averageTime: string;
  lastActive: string;
  performance: number;
}

const Agents = () => {
  const [agents] = useState<Agent[]>([
    {
      id: "1",
      name: "General Agent",
      type: "汎用エージェント",
      status: "active",
      description: "一般的なタスクや質問に対応する汎用的なAIエージェント",
      tasksCompleted: 156,
      averageTime: "2.3分",
      lastActive: "2分前",
      performance: 94,
    },
    {
      id: "2",
      name: "Deep Researcher",
      type: "研究エージェント",
      status: "active",
      description: "深い調査と分析を行う専門的な研究エージェント",
      tasksCompleted: 89,
      averageTime: "8.7分",
      lastActive: "5分前",
      performance: 97,
    },
    {
      id: "3",
      name: "Deep Analyzer",
      type: "分析エージェント",
      status: "inactive",
      description: "データ分析と統計処理に特化したエージェント",
      tasksCompleted: 67,
      averageTime: "4.1分",
      lastActive: "1時間前",
      performance: 91,
    },
    {
      id: "4",
      name: "Browser Agent",
      type: "ブラウザエージェント",
      status: "error",
      description: "ウェブブラウジングと情報収集を行うエージェント",
      tasksCompleted: 23,
      averageTime: "6.2分",
      lastActive: "30分前",
      performance: 78,
    },
  ]);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "inactive":
        return "text-gray-600 bg-gray-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <Pause className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Pause className="w-4 h-4" />;
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return "text-green-600";
    if (performance >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">エージェント管理</h1>
            <p className="text-gray-600 mt-2">AIエージェントの監視と管理</p>
          </div>
          <motion.button
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>新しいエージェント</span>
          </motion.button>
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
              <p className="text-sm text-gray-600">総エージェント数</p>
              <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
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
              <p className="text-2xl font-bold text-green-600">
                {agents.filter(a => a.status === "active").length}
              </p>
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
              <p className="text-sm text-gray-600">完了タスク</p>
              <p className="text-2xl font-bold text-gray-900">
                {agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
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
              <p className="text-sm text-gray-600">平均パフォーマンス</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedAgent(agent)}
            whileHover={{ scale: 1.02 }}
          >
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2 mb-3">
              <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                {getStatusIcon(agent.status)}
                <span className="capitalize">{agent.status}</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">{agent.description}</p>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">完了タスク</span>
                <span className="font-medium">{agent.tasksCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">平均時間</span>
                <span className="font-medium">{agent.averageTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">最終アクティブ</span>
                <span className="font-medium">{agent.lastActive}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">パフォーマンス</span>
                <span className={`font-medium ${getPerformanceColor(agent.performance)}`}>
                  {agent.performance}%
                </span>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${agent.performance}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {agent.status === "active" ? (
                  <button className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 text-sm">
                    <Pause className="w-4 h-4" />
                    <span>一時停止</span>
                  </button>
                ) : (
                  <button className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm">
                    <Play className="w-4 h-4" />
                    <span>開始</span>
                  </button>
                )}
              </div>
              <button className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedAgent(null)}
        >
          <motion.div
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">基本情報</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">タイプ:</span>
                    <span>{selectedAgent.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ステータス:</span>
                    <span className={`capitalize ${getStatusColor(selectedAgent.status)} px-2 py-1 rounded text-xs`}>
                      {selectedAgent.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">説明:</span>
                    <span className="text-right max-w-xs">{selectedAgent.description}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">パフォーマンス指標</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">完了タスク数:</span>
                    <span>{selectedAgent.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均処理時間:</span>
                    <span>{selectedAgent.averageTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">パフォーマンススコア:</span>
                    <span className={getPerformanceColor(selectedAgent.performance)}>
                      {selectedAgent.performance}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最終アクティブ:</span>
                    <span>{selectedAgent.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Agents;