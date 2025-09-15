import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { llmService, LLMMessage, LLMSettings } from "../services/llm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "こんにちは！DeepResearchAgent WebUIへようこそ。どのようなお手伝いができますか？",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("general");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agents = [
    { id: "general", name: "General Agent", description: "汎用的なタスクに対応" },
    { id: "researcher", name: "Deep Researcher", description: "深い調査・分析に特化" },
    { id: "analyzer", name: "Deep Analyzer", description: "データ分析に特化" },
    { id: "browser", name: "Browser Agent", description: "ウェブ操作に特化" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLLMSettings = (agentType: 'top' | 'sub' = 'top'): LLMSettings => {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    const apiSettings = settings.api || {
      selectedModel: 'gpt-4o',
      modelSettings: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1.0,
      },
      openaiKey: '',
      anthropicKey: '',
      googleKey: '',
    };
    
    // エージェント別モデル設定を取得
    const topLevelModel = localStorage.getItem('top_level_model');
    const subAgentModel = localStorage.getItem('sub_agent_model');
    const defaultModel = apiSettings.selectedModel || 'gpt-4o';
    
    // エージェントタイプに応じてモデルを選択
    let selectedModel;
    if (agentType === 'top') {
      selectedModel = topLevelModel || defaultModel;
    } else {
      selectedModel = subAgentModel || defaultModel;
    }
    
    return {
      model: selectedModel,
      temperature: apiSettings.modelSettings?.temperature || 0.7,
      maxTokens: apiSettings.modelSettings?.maxTokens || 2000,
      topP: apiSettings.modelSettings?.topP || 1.0,
    };
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    try {
      // Handle different agent types
      if (selectedAgent === 'researcher') {
        // Deep Research Agent - perform web search first (サブエージェント設定を使用)
        const searchQuery = userMessage.content;
        const searchPrompt = `あなたはDeep Research Agentです。以下のクエリについて、まずウェブ検索を行い、最新の情報を収集してから詳細な分析を提供してください。

クエリ: ${searchQuery}

手順:
1. 関連するウェブ検索を実行
2. 複数のソースから情報を収集
3. 情報の信頼性を評価
4. 包括的な分析結果を提供
5. 参考文献を明記

現在のウェブ検索を実行中...`;
        
        const llmMessages: LLMMessage[] = [
          {
            role: "system",
            content: "あなたはDeep Research Agentです。ウェブ検索機能を使用して最新の情報を収集し、包括的な調査結果を提供します。",
          },
          {
            role: "user",
            content: searchPrompt,
          },
        ];

        const llmSettings = getLLMSettings('sub'); // サブエージェント設定を使用

        await llmService.sendMessage(
          llmMessages,
          llmSettings,
          (chunk: string) => {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ));
          }
        );
      } else {
        // Standard agent processing (トップレベルエージェント設定を使用)
        const llmMessages: LLMMessage[] = [
          {
            role: "system",
            content: `あなたは${selectedAgent}エージェントです。ユーザーの質問に対して親切で詳細な回答を提供してください。`,
          },
          ...messages.slice(-5).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          {
            role: "user",
            content: userMessage.content,
          },
        ];

        const llmSettings = getLLMSettings('top'); // トップレベルエージェント設定を使用

        await llmService.sendMessage(
          llmMessages,
          llmSettings,
          (chunk: string) => {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
              : msg
            ));
          }
        );
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ));
    } catch (error) {
      console.error('LLM API Error:', error);
      
      let errorMessage = "申し訳ございません。エラーが発生しました。";
      let userGuidance = "";
      
      if (error instanceof Error) {
        if (error.message.includes('API key not found')) {
          errorMessage = "APIキーが設定されていません。";
          userGuidance = "設定画面でAPIキーを入力し、保存してください。";
        } else if (error.message.includes('Invalid API key')) {
          errorMessage = "APIキーが無効です。";
          userGuidance = "設定画面で正しいAPIキーを入力してください。";
        } else if (error.message.includes('Rate limit')) {
          errorMessage = "レート制限に達しました。";
          userGuidance = "しばらく待ってから再試行してください。";
        } else if (error.message.includes('Network')) {
          errorMessage = "ネットワークエラーが発生しました。";
          userGuidance = "インターネット接続を確認してください。";
        } else {
          errorMessage = "予期しないエラーが発生しました。";
          userGuidance = "設定でAPIキーが正しく設定されているか確認してください。";
        }
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId
          ? { 
              ...msg, 
              content: `${errorMessage}\n\n${userGuidance}`,
              isStreaming: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Agent Selection Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">エージェント選択</h2>
        <div className="space-y-2">
          {agents.map((agent) => (
            <motion.button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedAgent === agent.id
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium">{agent.name}</div>
              <div className="text-sm text-gray-600 mt-1">{agent.description}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                {agents.find(a => a.id === selectedAgent)?.name}
              </h1>
              <p className="text-sm text-gray-600">
                {agents.find(a => a.id === selectedAgent)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg flex items-start space-x-3 ${
                    message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" 
                        ? "bg-green-500" 
                        : message.error 
                        ? "bg-red-500" 
                        : "bg-blue-500"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : message.error ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-green-500 text-white"
                        : message.error
                        ? "bg-red-50 border border-red-200 text-red-800"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
                      )}
                    </p>
                    {message.error && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        エラー: {message.error}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user" ? "text-green-100" : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">応答を生成中...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力してください..."
                className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />
            </div>
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;