import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'researcher';
}

export interface Agent {
  id: string;
  name: string;
  type: 'research' | 'analysis' | 'writing' | 'coding' | 'general';
  status: 'active' | 'inactive' | 'busy' | 'error';
  description: string;
  capabilities: string[];
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageTime: number;
  };
  lastActive: string;
  config: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'research' | 'analysis' | 'generation' | 'processing';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
  tags: string[];
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  metadata?: Record<string, any>;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  agentId?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en' | 'zh' | 'ko';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  ui: {
    sidebarCollapsed: boolean;
    compactMode: boolean;
    animations: boolean;
  };
}

// Store State Interface
interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  
  // Agents
  agents: Agent[];
  selectedAgent: Agent | null;
  
  // Tasks
  tasks: Task[];
  activeTasks: Task[];
  
  // Files
  files: FileItem[];
  uploadProgress: Record<string, number>;
  
  // Chat
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // UI State
  sidebarCollapsed: boolean;
  loading: boolean;
  error: string | null;
  
  // Settings
  settings: AppSettings;
}

// Store Actions Interface
interface AppActions {
  // User Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  // Agent Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  selectAgent: (agent: Agent | null) => void;
  
  // Task Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  startTask: (id: string) => void;
  cancelTask: (id: string) => void;
  
  // File Actions
  setFiles: (files: FileItem[]) => void;
  addFile: (file: FileItem) => void;
  updateFile: (id: string, updates: Partial<FileItem>) => void;
  deleteFile: (id: string) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  
  // Chat Actions
  setChatSessions: (sessions: ChatSession[]) => void;
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteChatSession: (id: string) => void;
  setActiveChatSession: (session: ChatSession | null) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  
  // UI Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  // Utility Actions
  reset: () => void;
}

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  agents: [],
  selectedAgent: null,
  tasks: [],
  activeTasks: [],
  files: [],
  uploadProgress: {},
  chatSessions: [],
  activeChatSession: null,
  notifications: [],
  unreadCount: 0,
  sidebarCollapsed: false,
  loading: false,
  error: null,
  settings: {
    theme: 'light',
    language: 'ja',
    notifications: {
      email: true,
      push: true,
      sound: true,
    },
    ui: {
      sidebarCollapsed: false,
      compactMode: false,
      animations: true,
    },
  },
};

// Create Store
export const useAppStore = create<AppState & AppActions>()(devtools(
  persist(
    (set, get) => ({
        ...initialState,
        
        // User Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        login: async (email, password) => {
          set({ loading: true, error: null });
          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            const user: User = {
              id: '1',
              name: 'Research User',
              email,
              role: 'researcher',
            };
            set({ user, isAuthenticated: true, loading: false });
          } catch (error) {
            set({ error: 'ログインに失敗しました', loading: false });
          }
        },
        
        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            chatSessions: [],
            activeChatSession: null,
          });
        },
        
        // Agent Actions
        setAgents: (agents) => set({ agents }),
        
        addAgent: (agent) => set((state) => ({
          agents: [...state.agents, agent],
        })),
        
        updateAgent: (id, updates) => set((state) => ({
          agents: state.agents.map(agent => 
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        })),
        
        deleteAgent: (id) => set((state) => ({
          agents: state.agents.filter(agent => agent.id !== id),
          selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
        })),
        
        selectAgent: (agent) => set({ selectedAgent: agent }),
        
        // Task Actions
        setTasks: (tasks) => {
          const activeTasks = tasks.filter(task => 
            task.status === 'running' || task.status === 'pending'
          );
          set({ tasks, activeTasks });
        },
        
        addTask: (task) => set((state) => {
          const newTasks = [...state.tasks, task];
          const activeTasks = newTasks.filter(t => 
            t.status === 'running' || t.status === 'pending'
          );
          return { tasks: newTasks, activeTasks };
        }),
        
        updateTask: (id, updates) => set((state) => {
          const newTasks = state.tasks.map(task => 
            task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
          );
          const activeTasks = newTasks.filter(task => 
            task.status === 'running' || task.status === 'pending'
          );
          return { tasks: newTasks, activeTasks };
        }),
        
        deleteTask: (id) => set((state) => {
          const newTasks = state.tasks.filter(task => task.id !== id);
          const activeTasks = newTasks.filter(task => 
            task.status === 'running' || task.status === 'pending'
          );
          return { tasks: newTasks, activeTasks };
        }),
        
        startTask: (id) => {
          get().updateTask(id, { status: 'running', progress: 0 });
        },
        
        cancelTask: (id) => {
          get().updateTask(id, { status: 'cancelled' });
        },
        
        // File Actions
        setFiles: (files) => set({ files }),
        
        addFile: (file) => set((state) => ({
          files: [...state.files, file],
        })),
        
        updateFile: (id, updates) => set((state) => ({
          files: state.files.map(file => 
            file.id === id ? { ...file, ...updates } : file
          ),
        })),
        
        deleteFile: (id) => set((state) => ({
          files: state.files.filter(file => file.id !== id),
        })),
        
        setUploadProgress: (fileId, progress) => set((state) => ({
          uploadProgress: {
            ...state.uploadProgress,
            [fileId]: progress,
          },
        })),
        
        // Chat Actions
        setChatSessions: (sessions) => set({ chatSessions: sessions }),
        
        addChatSession: (session) => set((state) => ({
          chatSessions: [...state.chatSessions, session],
        })),
        
        updateChatSession: (id, updates) => set((state) => ({
          chatSessions: state.chatSessions.map(session => 
            session.id === id ? { ...session, ...updates } : session
          ),
        })),
        
        deleteChatSession: (id) => set((state) => ({
          chatSessions: state.chatSessions.filter(session => session.id !== id),
          activeChatSession: state.activeChatSession?.id === id ? null : state.activeChatSession,
        })),
        
        setActiveChatSession: (session) => set({ activeChatSession: session }),
        
        addMessage: (sessionId, message) => set((state) => ({
          chatSessions: state.chatSessions.map(session => 
            session.id === sessionId 
              ? { 
                  ...session, 
                  messages: [...session.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : session
          ),
          activeChatSession: state.activeChatSession?.id === sessionId
            ? {
                ...state.activeChatSession,
                messages: [...state.activeChatSession.messages, message],
                updatedAt: new Date().toISOString(),
              }
            : state.activeChatSession,
        })),
        
        // Notification Actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false,
          };
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        },
        
        markNotificationRead: (id) => set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (!notification || notification.read) return state;
          
          return {
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }),
        
        markAllNotificationsRead: () => set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        })),
        
        deleteNotification: (id) => set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        }),
        
        // UI Actions
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        
        // Settings Actions
        updateSettings: (updates) => set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
        
        // Utility Actions
        reset: () => set(initialState),
      }),
      {
        name: 'deep-research-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          settings: state.settings,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'DeepResearch Store',
    }
  )
);

// Selectors
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useAgents = () => useAppStore((state) => state.agents);
export const useSelectedAgent = () => useAppStore((state) => state.selectedAgent);
export const useTasks = () => useAppStore((state) => state.tasks);
export const useActiveTasks = () => useAppStore((state) => state.activeTasks);
export const useFiles = () => useAppStore((state) => state.files);
export const useChatSessions = () => useAppStore((state) => state.chatSessions);
export const useActiveChatSession = () => useAppStore((state) => state.activeChatSession);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useUnreadCount = () => useAppStore((state) => state.unreadCount);
export const useSettings = () => useAppStore((state) => state.settings);
export const useLoading = () => useAppStore((state) => state.loading);
export const useError = () => useAppStore((state) => state.error);