import { motion } from "framer-motion";
import { Activity, Users, Zap, TrendingUp, Clock, CheckCircle, Send, Bot, Eye, Settings, BarChart3, FileText, Lightbulb, AlertCircle, Target, User, Database, ArrowRight, Network } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { llmService } from "../services/llm";

const Dashboard = () => {
  console.log('Dashboard component loaded');
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentActivities, setAgentActivities] = useState<Array<{
    id: string;
    agent: string;
    action: string;
    status: 'active' | 'completed' | 'waiting';
    timestamp: string;
    result?: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
  }>>([]);
  const [finalOutput, setFinalOutput] = useState<string>("");
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [dataFlow, setDataFlow] = useState([]);
  const [sharedData, setSharedData] = useState({});
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  console.log('Current message state:', message);
  console.log('Current isProcessing state:', isProcessing);
  const { settings } = useAppStore();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsProcessing(true);
    setAgentActivities([]);
    
    try {
      // Step 1: Send request to Top-Level Planning Agent
      const response = await fetch('/api/agents/top-level-planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          settings: {
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.7,
            maxTokens: 2000,
            topP: 0.9
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const planningData = await response.json();
      
      if (!planningData.task || !planningData.task.id) {
        throw new Error('No task created by Top-Level Planning Agent');
      }
      
      const taskId = planningData.task.id;
      const subTasks = planningData.task.subTasks || [];
      
      // タスクIDを保存してデータフロー監視を開始
      setCurrentTaskId(taskId);
      console.log('Task ID set:', taskId);
      
      // Initialize agent activities based on sub-tasks
      const initialActivities = subTasks.map((subTask, index) => ({
        id: subTask.agentId,
        name: subTask.agentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        status: 'pending',
        result: null,
        description: subTask.description
      }));
      
      setAgentActivities(initialActivities);
      
      // Step 2: Execute sub-agents sequentially
      for (const subTask of subTasks) {
        // Update status to active
        setAgentActivities(prev => 
          prev.map(activity => 
            activity.id === subTask.agentId 
              ? { ...activity, status: 'active' }
              : activity
          )
        );
        
        try {
          const subAgentResponse = await fetch(`/api/agents/sub-agent/${subTask.agentId}/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskId: taskId,
              description: subTask.description,
              settings: {
                model: 'claude-3-5-sonnet-20241022',
                temperature: 0.7,
                maxTokens: 1500,
                topP: 0.9
              }
            }),
          });
          
          if (!subAgentResponse.ok) {
            throw new Error(`Sub-agent ${subTask.agentId} failed: ${subAgentResponse.status}`);
          }
          
          const subAgentData = await subAgentResponse.json();
          
          // データフロー情報を取得
          try {
            const dataFlowResponse = await fetch(`/api/data-flow/${taskId}`);
            if (dataFlowResponse.ok) {
              const dataFlowResult = await dataFlowResponse.json();
              setDataFlow(dataFlowResult.dataFlow || []);
              setSharedData(dataFlowResult.taskData || {});
              console.log('Data flow updated:', dataFlowResult);
              
              // デバッグログに追加
              setDebugLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                type: 'data_flow_update',
                agent: subTask.agentId,
                message: `データフロー更新: ${dataFlowResult.dataFlow?.length || 0}件のフロー`,
                data: dataFlowResult
              }]);
            }
          } catch (error) {
            console.warn('Failed to fetch data flow:', error);
            setDebugLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              type: 'error',
              agent: subTask.agentId,
              message: `データフロー取得エラー: ${error.message}`,
              data: { error: error.message }
            }]);
          }
          
          // Update status to completed with result
          setAgentActivities(prev => 
            prev.map(activity => 
              activity.id === subTask.agentId 
                ? { 
                    ...activity, 
                    status: 'completed', 
                    result: subAgentData.response?.content || 'Task completed',
                    reportId: subAgentData.report?.id,
                    usedPreviousData: subAgentData.usedPreviousData || false
                  }
                : activity
            )
          );
          
        } catch (error) {
          console.error(`Sub-agent ${subTask.agentId} error:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setAgentActivities(prev => 
            prev.map(activity => 
              activity.id === subTask.agentId 
                ? { 
                    ...activity, 
                    status: 'error', 
                    result: `❌ エラー: ${errorMessage}\n📋 詳細: Sub-agent execution failed\n⏰ 時刻: ${new Date().toLocaleTimeString()}` 
                  }
                : activity
            )
          );
        }
      }
      
      // Step 3: Generate final output
      try {
        const finalResponse = await fetch(`/api/tasks/${taskId}/finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (finalResponse.ok) {
          const finalData = await finalResponse.json();
          
          // Add final output as a special activity
          setAgentActivities(prev => [
            ...prev,
            {
              id: 'final-output',
              name: 'Final Output',
              status: 'completed',
              result: finalData.finalOutput?.content || 'Final processing completed',
              isFinalOutput: true
            }
          ]);
        }
      } catch (error) {
        console.error('Final output generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setAgentActivities(prev => [
          ...prev,
          {
            id: 'final-output-error',
            name: '⚠️ Final Output Error',
            status: 'error',
            result: `❌ 最終出力生成エラー\n📋 詳細: ${errorMessage}\n⏰ 時刻: ${new Date().toLocaleTimeString()}`,
            isFinalOutput: true
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorDetails = {
        message: errorMessage,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      };
      
      setAgentActivities(prev => 
        prev.length > 0 
          ? prev.map(activity => ({ 
              ...activity, 
              status: 'error', 
              result: `❌ エラー: ${errorMessage}\n📋 実行結果: ${errorDetails.timestamp}` 
            }))
          : [{ 
              id: 'error', 
              name: '🤖 System Error', 
              status: 'error', 
              result: `❌ エラー\n📋 実行結果\n${errorMessage}` 
            }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = [
    { label: "アクティブエージェント", value: "3", icon: Users, color: "text-blue-600" },
    { label: "実行中タスク", value: "7", icon: Activity, color: "text-green-600" },
    { label: "完了タスク", value: "24", icon: CheckCircle, color: "text-purple-600" },
    { label: "システム稼働率", value: "99.8%", icon: TrendingUp, color: "text-orange-600" },
  ];

  const recentActivities = [
    { id: 1, type: "task_completed", message: "画像生成タスクが完了しました", time: "2分前" },
    { id: 2, type: "agent_started", message: "Deep Researcher Agentが開始されました", time: "5分前" },
    { id: 3, type: "file_uploaded", message: "research_data.pdf がアップロードされました", time: "10分前" },
    { id: 4, type: "task_created", message: "新しい分析タスクが作成されました", time: "15分前" },
  ];

  const quickActions = [
    { label: "新しいチャット", icon: Zap, color: "bg-blue-500 hover:bg-blue-600" },
    { label: "タスク作成", icon: Activity, color: "bg-green-500 hover:bg-green-600" },
    { label: "ファイルアップロード", icon: Clock, color: "bg-purple-500 hover:bg-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
          <p className="text-gray-600">DeepResearchAgent WebUI へようこそ</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top-Level Planning Agent Chat */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Top-Level Planning Agent</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      console.log('Input changed:', e.target.value);
                      setMessage(e.target.value);
                    }}
                    onKeyPress={(e) => {
                      console.log('Key pressed:', e.key);
                      if (e.key === 'Enter') {
                        console.log('Enter key pressed, calling handleSendMessage');
                        handleSendMessage();
                      }
                    }}
                    placeholder="タスクを入力してください..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={() => {
                      console.log('Send button clicked!');
                      handleSendMessage();
                    }}
                    disabled={!message.trim() || isProcessing}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                
                {isProcessing && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-blue-700 font-medium">エージェントが処理中...</span>
                      </div>
                      {processingStartTime && (
                        <span className="text-blue-600 text-sm font-medium">
                          {((Date.now() - processingStartTime) / 1000).toFixed(1)}秒経過
                        </span>
                      )}
                    </div>
                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">クイックアクション</h3>
                <div className="space-y-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`w-full flex items-center space-x-3 p-2 rounded-lg text-white transition-colors text-sm ${action.color}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{action.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Agent Activity Monitor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">エージェント連携状況</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{agentActivities.length} 件のタスク</span>
                </div>
              </div>
              
              {/* Overall Progress Bar */}
              {agentActivities.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">全体進捗状況</h4>
                    <span className="text-sm text-gray-600">
                      {Math.round((agentActivities.filter(a => a.status === 'completed').length / agentActivities.length) * 100)}% 完了
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: `${(agentActivities.filter(a => a.status === 'completed').length / agentActivities.length) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>待機: {agentActivities.filter(a => a.status === 'pending').length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>実行中: {agentActivities.filter(a => a.status === 'active').length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>完了: {agentActivities.filter(a => a.status === 'completed').length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>エラー: {agentActivities.filter(a => a.status === 'error').length}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Agent Flow Visualization */}
              {agentActivities.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    エージェント連携フロー
                  </h4>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {agentActivities.map((activity, index) => (
                      <div key={activity.id} className="flex items-center space-x-2 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          activity.status === 'completed' ? 'bg-green-500 text-white' :
                          activity.status === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                          activity.status === 'error' ? 'bg-red-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-xs text-gray-600 max-w-20 truncate">
                          {activity.name}
                        </div>
                        {activity.usedPreviousData && (
                          <div className="text-xs text-green-600 flex items-center">
                            <Database className="w-3 h-3 mr-1" />
                            データ連携
                          </div>
                        )}
                        {index < agentActivities.length - 1 && (
                          <div className={`w-6 h-0.5 relative ${
                            agentActivities[index + 1].status !== 'pending' ? 'bg-blue-300' : 'bg-gray-300'
                          }`}>
                            {dataFlow.some(flow => flow.from === activity.id && flow.to === agentActivities[index + 1].id) && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                                データ転送
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* データフロー監視パネル */}
               {dataFlow.length > 0 && (
                 <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                   <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                     <Database className="w-4 h-4 mr-2 text-green-600" />
                     データフロー監視
                   </h4>
                   <div className="space-y-2">
                     {dataFlow.map((flow, index) => (
                       <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                         <div className="flex items-center space-x-2">
                           <span className="text-sm font-medium text-gray-700">{flow.from}</span>
                           <ArrowRight className="w-3 h-3 text-gray-400" />
                           <span className="text-sm font-medium text-gray-700">{flow.to}</span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className="text-xs text-gray-500">{flow.timestamp}</span>
                           <span className={`text-xs px-2 py-1 rounded-full ${
                             flow.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                           }`}>
                             {flow.success ? '成功' : '失敗'}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
               
               {/* 共有データ詳細パネル */}
               {Object.keys(sharedData).length > 0 && (
                 <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                   <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                     <FileText className="w-4 h-4 mr-2 text-blue-600" />
                     共有データ詳細
                   </h4>
                   <div className="space-y-3">
                     {Object.entries(sharedData).map(([agentType, data]) => (
                       <div key={agentType} className="border border-gray-200 rounded-lg p-3">
                         <div className="flex items-center justify-between mb-2">
                           <span className="font-medium text-gray-700">{agentType}</span>
                           <span className="text-xs text-gray-500">
                             {data.timestamp ? new Date(data.timestamp).toLocaleString('ja-JP') : ''}
                           </span>
                         </div>
                         <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                           {typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)}
                         </div>
                         {data.dataSize && (
                           <div className="text-xs text-gray-500 mt-1">
                             データサイズ: {data.dataSize} 文字
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
                )}
                
                {/* デバッグパネル */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">デバッグ情報 {showDebugPanel ? '非表示' : '表示'}</span>
                    <span className="text-xs bg-gray-300 px-2 py-1 rounded-full">{debugLogs.length}</span>
                  </button>
                  
                  {showDebugPanel && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">エージェント間通信ログ</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {debugLogs.length === 0 ? (
                          <p className="text-sm text-gray-500">ログがありません</p>
                        ) : (
                          debugLogs.slice(-20).reverse().map((log, index) => (
                            <div key={index} className={`p-2 rounded text-xs ${
                              log.type === 'error' ? 'bg-red-100 text-red-800' :
                              log.type === 'data_flow_update' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{log.agent}</span>
                                <span className="text-gray-500">
                                  {new Date(log.timestamp).toLocaleTimeString('ja-JP')}
                                </span>
                              </div>
                              <div className="mb-1">{log.message}</div>
                              {log.data && (
                                <details className="mt-1">
                                  <summary className="cursor-pointer text-gray-600">詳細データ</summary>
                                  <pre className="mt-1 text-xs bg-white p-2 rounded overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => setDebugLogs([])}
                          className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                        >
                          ログクリア
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                {agentActivities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="relative">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <motion.div 
                        className="absolute inset-0 w-16 h-16 mx-auto border-2 border-blue-300 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">エージェント連携システム待機中</h4>
                    <p className="text-sm text-gray-500 mb-1">メッセージを送信してマルチエージェント処理を開始</p>
                    <p className="text-xs text-gray-400">Top-Level Planning Agent → サブエージェント → 統合レポート</p>
                  </div>
                ) : (
                  agentActivities.map((activity, index) => {
                    const statusColor = {
                      'pending': 'text-yellow-600 bg-yellow-50 border-yellow-200',
                      'active': 'text-blue-600 bg-blue-50 border-blue-200',
                      'completed': 'text-green-600 bg-green-50 border-green-200',
                      'error': 'text-red-600 bg-red-50 border-red-200'
                    }[activity.status] || 'text-gray-600 bg-gray-50 border-gray-200';
                    
                    const statusIcon = {
                      'pending': Clock,
                      'active': Activity,
                      'completed': CheckCircle,
                      'error': AlertCircle
                    }[activity.status] || Clock;
                    
                    const StatusIcon = statusIcon;
                    
                    return (
                      <motion.div 
                        key={activity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                          activity.isFinalOutput 
                            ? 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-green-300 shadow-lg' 
                            : `bg-white ${statusColor.split(' ')[2]} hover:shadow-md`
                        }`}
                      >
                        {/* Progress Bar for In-Progress Tasks */}
                        {activity.status === 'active' && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                            <motion.div 
                              className="h-full bg-blue-500"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                          </div>
                        )}
                        
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className={`p-3 rounded-xl shadow-sm ${statusColor.split(' ')[1]} ${statusColor.split(' ')[2]}`}>
                                <StatusIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className={`text-lg font-bold truncate ${
                                    activity.isFinalOutput ? 'text-green-800' : 'text-gray-900'
                                  }`}>
                                    {activity.isFinalOutput ? '🎯 最終統合レポート' : `🤖 ${activity.name}`}
                                  </h4>
                                  <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                                    statusColor.split(' ')[1]
                                  } ${statusColor.split(' ')[2]} ${statusColor.split(' ')[0]}`}>
                                    {activity.status === 'pending' && '⏳ 待機中'}
                                    {activity.status === 'active' && '⚡ 実行中'}
                                    {activity.status === 'completed' && '✅ 完了'}
                                    {activity.status === 'error' && '❌ エラー'}
                                  </span>
                                </div>
                                
                                {activity.reportId && (
                                  <div className="flex items-center space-x-2 mb-3">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm text-gray-600 font-mono">
                                      ID: {activity.reportId}
                                    </p>
                                  </div>
                                )}
                                
                                {activity.description && (
                                  <div className="mb-3">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {activity.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-1">
                              <div className="text-xs text-gray-500 font-mono">
                                {activity.timestamp}
                              </div>
                              {activity.status === 'active' && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-blue-600">処理中...</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {activity.result && (
                            <div className={`mt-4 rounded-lg border-2 overflow-hidden ${
                              activity.isFinalOutput 
                                ? 'bg-white border-green-200 shadow-inner' 
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className={`px-3 py-2 text-xs font-semibold border-b ${
                                activity.isFinalOutput 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                                📋 実行結果
                              </div>
                              <div className="p-4 max-h-64 overflow-y-auto">
                                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {typeof activity.result === 'string' 
                                    ? activity.result 
                                    : JSON.stringify(activity.result, null, 2)
                                  }
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Quality Indicator for Completed Tasks */}
                          {activity.status === 'completed' && activity.quality && (
                            <div className="mt-3 flex items-center space-x-2">
                              <span className="text-xs text-gray-500">品質スコア:</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    activity.quality >= 0.8 ? 'bg-green-500' :
                                    activity.quality >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${activity.quality * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">
                                {(activity.quality * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
                
                {/* Static recent activities for demo */}
                {agentActivities.length === 0 && recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors opacity-50"
                  >
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Final Output Display */}
              {finalOutput && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-lg">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-xl font-bold text-gray-800">最終統合レポート</h3>
                  </div>
                  
                  {/* Executive Summary */}
                  <div className="mb-6 p-4 bg-white rounded-lg border">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                      エグゼクティブサマリー
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">{finalOutput.executionSummary.totalAgents}</div>
                        <div className="text-sm text-gray-600">参加エージェント</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">{finalOutput.executionSummary.completionRate?.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">完了率</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-2xl font-bold text-purple-600">{(finalOutput.executionSummary.averageQuality * 100)?.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">品質スコア</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-2xl font-bold text-orange-600">{finalOutput.executionSummary.executionTime}</div>
                        <div className="text-sm text-gray-600">実行時間</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>要求:</strong> {finalOutput.originalRequest}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>目標達成:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                          finalOutput.executionSummary.goalAchieved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {finalOutput.executionSummary.goalAchieved ? '達成' : '部分的達成'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Consolidated Result */}
                  {finalOutput.consolidatedResult && (
                    <div className="mb-6 p-4 bg-white rounded-lg border">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        統合分析結果
                      </h4>
                      
                      {finalOutput.consolidatedResult.executiveSummary && (
                        <div className="mb-4 p-3 bg-blue-50 rounded">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {finalOutput.consolidatedResult.executiveSummary}
                          </pre>
                        </div>
                      )}
                      
                      {finalOutput.consolidatedResult.synthesis && (
                        <div className="mb-4 p-3 bg-green-50 rounded">
                          <h5 className="font-semibold text-gray-800 mb-2">統合分析</h5>
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {finalOutput.consolidatedResult.synthesis}
                          </pre>
                        </div>
                      )}
                      
                      {finalOutput.consolidatedResult.keyFindings && finalOutput.consolidatedResult.keyFindings.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-800 mb-2">主要な発見</h5>
                          <ul className="space-y-1">
                            {finalOutput.consolidatedResult.keyFindings.slice(0, 5).map((finding, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Agent Contributions */}
                  {finalOutput.agentContributions && finalOutput.agentContributions.length > 0 && (
                    <div className="mb-6 p-4 bg-white rounded-lg border">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-purple-600" />
                        エージェント貢献度
                      </h4>
                      <div className="space-y-3">
                        {finalOutput.agentContributions.map((contribution, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-semibold text-gray-800">{contribution.agentType}</span>
                                <span className="text-sm text-gray-500 ml-2">({contribution.agentId})</span>
                              </div>
                              <div className="flex items-center">
                                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                  contribution.quality >= 0.8 ? 'bg-green-100 text-green-800' :
                                  contribution.quality >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  品質: {(contribution.quality * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                            
                            {contribution.summary && (
                              <div className="mb-2">
                                <p className="text-sm text-gray-700">{contribution.summary.firstSentence}</p>
                                {contribution.summary.keyPoints && contribution.summary.keyPoints.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {contribution.summary.keyPoints.map((point, pointIndex) => (
                                      <li key={pointIndex} className="text-xs text-gray-600 flex items-start">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                        {point}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500">
                              完了時刻: {contribution.completedAt} | 文字数: {contribution.summary?.wordCount || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {finalOutput.recommendations && finalOutput.recommendations.length > 0 && (
                    <div className="mb-6 p-4 bg-white rounded-lg border">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                        推奨事項
                      </h4>
                      <ul className="space-y-2">
                        {finalOutput.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Final Conclusion */}
                  {finalOutput.finalConclusion && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-blue-600" />
                        最終結論
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{finalOutput.finalConclusion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;