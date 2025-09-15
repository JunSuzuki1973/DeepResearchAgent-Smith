import { Agent, Task, FileItem, ChatMessage, ChatSession, User } from '../store/useAppStore';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// API Client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text() as unknown as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/auth/me');
  }

  // Agent endpoints
  async getAgents(): Promise<Agent[]> {
    return this.request('/agents');
  }

  async getAgent(id: string): Promise<Agent> {
    return this.request(`/agents/${id}`);
  }

  async createAgent(agent: Omit<Agent, 'id' | 'lastActive' | 'performance'>): Promise<Agent> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    return this.request(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async startAgent(id: string): Promise<Agent> {
    return this.request(`/agents/${id}/start`, {
      method: 'POST',
    });
  }

  async stopAgent(id: string): Promise<Agent> {
    return this.request(`/agents/${id}/stop`, {
      method: 'POST',
    });
  }

  // Task endpoints
  async getTasks(): Promise<Task[]> {
    return this.request('/tasks');
  }

  async getTask(id: string): Promise<Task> {
    return this.request(`/tasks/${id}`);
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async startTask(id: string): Promise<Task> {
    return this.request(`/tasks/${id}/start`, {
      method: 'POST',
    });
  }

  async cancelTask(id: string): Promise<Task> {
    return this.request(`/tasks/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getTaskResult(id: string): Promise<any> {
    return this.request(`/tasks/${id}/result`);
  }

  // File endpoints
  async getFiles(): Promise<FileItem[]> {
    return this.request('/files');
  }

  async getFile(id: string): Promise<FileItem> {
    return this.request(`/files/${id}`);
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${this.baseURL}/files/upload`);
      
      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }
      
      xhr.send(formData);
    });
  }

  async deleteFile(id: string): Promise<void> {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    });
  }

  async downloadFile(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/files/${id}/download`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }
    
    return response.blob();
  }

  // Chat endpoints
  async getChatSessions(): Promise<ChatSession[]> {
    return this.request('/chat/sessions');
  }

  async getChatSession(id: string): Promise<ChatSession> {
    return this.request(`/chat/sessions/${id}`);
  }

  async createChatSession(agentId: string, title?: string): Promise<ChatSession> {
    return this.request('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ agentId, title }),
    });
  }

  async deleteChatSession(id: string): Promise<void> {
    return this.request(`/chat/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async sendMessage(sessionId: string, content: string, attachments?: string[]): Promise<ChatMessage> {
    return this.request(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    });
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.request(`/chat/sessions/${sessionId}/messages`);
  }

  // WebSocket connection for real-time updates
  createWebSocketConnection(): WebSocket | null {
    if (typeof window === 'undefined') return null;
    
    const wsUrl = this.baseURL.replace('http', 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      if (this.token) {
        ws.send(JSON.stringify({ type: 'auth', token: this.token }));
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    return ws;
  }

  // System endpoints
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    version: string;
    uptime: number;
    agents: { total: number; active: number };
    tasks: { total: number; running: number };
  }> {
    return this.request('/system/status');
  }

  async getSystemMetrics(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
    network: { in: number; out: number };
  }> {
    return this.request('/system/metrics');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { Agent, Task, FileItem, ChatMessage, ChatSession, User };