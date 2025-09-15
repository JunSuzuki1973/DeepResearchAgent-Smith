import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { Agent, Task, FileItem, ChatSession, ChatMessage, User } from '../store/useAppStore';

// Query Keys
export const queryKeys = {
  agents: ['agents'] as const,
  agent: (id: string) => ['agents', id] as const,
  tasks: ['tasks'] as const,
  task: (id: string) => ['tasks', id] as const,
  files: ['files'] as const,
  file: (id: string) => ['files', id] as const,
  chatSessions: ['chatSessions'] as const,
  chatSession: (id: string) => ['chatSessions', id] as const,
  chatMessages: (sessionId: string) => ['chatMessages', sessionId] as const,
  systemStatus: ['systemStatus'] as const,
  systemMetrics: ['systemMetrics'] as const,
  user: ['user'] as const,
};

// Auth Hooks
export const useLogin = () => {
  const { setUser } = useAppStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      apiClient.login(email, password),
    onSuccess: (data) => {
      apiClient.setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
};

export const useLogout = () => {
  const { logout } = useAppStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      apiClient.setToken(null);
      logout();
      queryClient.clear();
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => apiClient.getCurrentUser(),
    enabled: !!localStorage.getItem('auth_token'),
  });
};

// Agent Hooks
export const useAgents = () => {
  const { setAgents } = useAppStore();
  
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => apiClient.getAgents(),
    onSuccess: (data) => {
      setAgents(data);
    },
  });
};

export const useAgent = (id: string) => {
  return useQuery({
    queryKey: queryKeys.agent(id),
    queryFn: () => apiClient.getAgent(id),
    enabled: !!id,
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  const { addAgent } = useAppStore();
  
  return useMutation({
    mutationFn: (agent: Omit<Agent, 'id' | 'lastActive' | 'performance'>) => 
      apiClient.createAgent(agent),
    onSuccess: (data) => {
      addAgent(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  const { updateAgent } = useAppStore();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Agent> }) => 
      apiClient.updateAgent(id, updates),
    onSuccess: (data) => {
      updateAgent(data.id, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(data.id) });
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  const { deleteAgent } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAgent(id),
    onSuccess: (_, id) => {
      deleteAgent(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      queryClient.removeQueries({ queryKey: queryKeys.agent(id) });
    },
  });
};

export const useStartAgent = () => {
  const queryClient = useQueryClient();
  const { updateAgent } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.startAgent(id),
    onSuccess: (data) => {
      updateAgent(data.id, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
};

export const useStopAgent = () => {
  const queryClient = useQueryClient();
  const { updateAgent } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.stopAgent(id),
    onSuccess: (data) => {
      updateAgent(data.id, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
};

// Task Hooks
export const useTasks = () => {
  const { setTasks } = useAppStore();
  
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => apiClient.getTasks(),
    onSuccess: (data) => {
      setTasks(data);
    },
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => apiClient.getTask(id),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { addTask } = useAppStore();
  
  return useMutation({
    mutationFn: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => 
      apiClient.createTask(task),
    onSuccess: (data) => {
      addTask(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const { updateTask } = useAppStore();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      apiClient.updateTask(id, updates),
    onSuccess: (data) => {
      updateTask(data.id, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(data.id) });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { deleteTask } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteTask(id),
    onSuccess: (_, id) => {
      deleteTask(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.removeQueries({ queryKey: queryKeys.task(id) });
    },
  });
};

export const useStartTask = () => {
  const queryClient = useQueryClient();
  const { startTask } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.startTask(id),
    onSuccess: (data) => {
      startTask(data.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
};

export const useCancelTask = () => {
  const queryClient = useQueryClient();
  const { cancelTask } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.cancelTask(id),
    onSuccess: (data) => {
      cancelTask(data.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
};

// File Hooks
export const useFiles = () => {
  const { setFiles } = useAppStore();
  
  return useQuery({
    queryKey: queryKeys.files,
    queryFn: () => apiClient.getFiles(),
    onSuccess: (data) => {
      setFiles(data);
    },
  });
};

export const useFile = (id: string) => {
  return useQuery({
    queryKey: queryKeys.file(id),
    queryFn: () => apiClient.getFile(id),
    enabled: !!id,
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  const { addFile, setUploadProgress } = useAppStore();
  
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) => 
      apiClient.uploadFile(file, onProgress),
    onSuccess: (data) => {
      addFile(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.files });
      setUploadProgress(data.id, 100);
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  const { deleteFile } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteFile(id),
    onSuccess: (_, id) => {
      deleteFile(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.files });
      queryClient.removeQueries({ queryKey: queryKeys.file(id) });
    },
  });
};

// Chat Hooks
export const useChatSessions = () => {
  const { setChatSessions } = useAppStore();
  
  return useQuery({
    queryKey: queryKeys.chatSessions,
    queryFn: () => apiClient.getChatSessions(),
    onSuccess: (data) => {
      setChatSessions(data);
    },
  });
};

export const useChatSession = (id: string) => {
  return useQuery({
    queryKey: queryKeys.chatSession(id),
    queryFn: () => apiClient.getChatSession(id),
    enabled: !!id,
  });
};

export const useCreateChatSession = () => {
  const queryClient = useQueryClient();
  const { addChatSession } = useAppStore();
  
  return useMutation({
    mutationFn: ({ agentId, title }: { agentId: string; title?: string }) => 
      apiClient.createChatSession(agentId, title),
    onSuccess: (data) => {
      addChatSession(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions });
    },
  });
};

export const useDeleteChatSession = () => {
  const queryClient = useQueryClient();
  const { deleteChatSession } = useAppStore();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteChatSession(id),
    onSuccess: (_, id) => {
      deleteChatSession(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions });
      queryClient.removeQueries({ queryKey: queryKeys.chatSession(id) });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { addMessage } = useAppStore();
  
  return useMutation({
    mutationFn: ({ sessionId, content, attachments }: { 
      sessionId: string; 
      content: string; 
      attachments?: string[] 
    }) => apiClient.sendMessage(sessionId, content, attachments),
    onSuccess: (data, variables) => {
      addMessage(variables.sessionId, data);
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.chatMessages(variables.sessionId) 
      });
    },
  });
};

export const useChatMessages = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.chatMessages(sessionId),
    queryFn: () => apiClient.getChatMessages(sessionId),
    enabled: !!sessionId,
  });
};

// System Hooks
export const useSystemStatus = () => {
  return useQuery({
    queryKey: queryKeys.systemStatus,
    queryFn: () => apiClient.getSystemStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useSystemMetrics = () => {
  return useQuery({
    queryKey: queryKeys.systemMetrics,
    queryFn: () => apiClient.getSystemMetrics(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

// WebSocket Hook
export const useWebSocket = () => {
  const queryClient = useQueryClient();
  const { addNotification, updateTask, updateAgent } = useAppStore();
  
  const connect = () => {
    const ws = apiClient.createWebSocketConnection();
    
    if (!ws) return null;
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'task_update':
            updateTask(data.taskId, data.updates);
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            break;
            
          case 'agent_update':
            updateAgent(data.agentId, data.updates);
            queryClient.invalidateQueries({ queryKey: queryKeys.agents });
            break;
            
          case 'notification':
            addNotification({
              type: data.level || 'info',
              title: data.title,
              message: data.message,
            });
            break;
            
          case 'chat_message':
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.chatMessages(data.sessionId) 
            });
            break;
            
          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    return ws;
  };
  
  return { connect };
};