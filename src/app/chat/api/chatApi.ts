import EnvironmentVariables from '@/config/config';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

export class ChatApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage?.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(
    url: string, 
    options: RequestOptions = {}, 
    timeoutMs: number = 10000
  ): Promise<T> {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Merge headers with auth headers
      const mergedOptions: RequestInit = {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      };

      const response = await fetch(url, mergedOptions);

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      // Handle non-ok responses
      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If error response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Throw uniform error with status code
        const error = new Error(errorMessage) as Error & { status: number };
        error.status = response.status;
        
        // Handle common status codes
        if (response.status === 401) {
          error.message = 'Unauthorized - please login again';
        }
        
        throw error;
      }

      // Parse JSON safely
      let data: any;
      try {
        data = await response.json();
      } catch {
        // If response isn't JSON, return empty object
        data = {};
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`) as Error & { status: number };
        timeoutError.status = 408; // Request Timeout
        throw timeoutError;
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async getUserList(): Promise<string[]> {
    const data = await this.request<{ usernames?: string[], data?: string[], users?: string[] }>(
      `${EnvironmentVariables.BACKEND_URL}/v1/user/usernames`,
      { method: 'GET' }
    );
    
    // Normalize response - prefer usernames, then data, then users, fallback to empty array
    return data.usernames || data.data || data.users || [];
  }

  async searchUsers(query: string): Promise<string[]> {
    const data = await this.request<{ usernames?: string[], data?: string[], users?: string[] }>(
      `${EnvironmentVariables.BACKEND_URL}/v1/user/usernames?search=${encodeURIComponent(query)}`,
      { method: 'GET' }
    );
    
    return data.usernames || data.data || data.users || [];
  }

  async getPrivateChats(): Promise<any[]> {
    try {
      const data = await this.request<{ chats?: any[], data?: any[], private_chats?: any[] }>(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/private`,
        { method: 'GET' }
      );
      
      return Array.isArray(data) ? data : data.chats || data.data || data.private_chats || [];
    } catch (error: any) {
      // Return empty array for 404 (no chats found)
      if (error.status === 404) return [];
      throw error;
    }
  }

  async getChatMessages(chatId: string | number): Promise<any[]> {
    try {
      const data = await this.request<{ messages?: any[], data?: any[] }>(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/${String(chatId)}/messages`,
        { method: 'GET' }
      );
      
      return Array.isArray(data) ? data : data.messages || data.data || [];
    } catch (error: any) {
      // Return empty array for 404 (no messages found)
      if (error.status === 404) return [];
      throw error;
    }
  }

  async sendMessage(message: string, chatId: string | number): Promise<any> {
    return await this.request<any>(
      `${EnvironmentVariables.BACKEND_URL}/v1/chat/${String(chatId)}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ 
          content: message.trim(), 
          message_type: 'text', 
          chat_id: String(chatId) 
        })
      }
    );
  }

  async markMessagesAsRead(chatId: string | number): Promise<boolean> {
    try {
      await this.request<any>(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/${String(chatId)}/messages/mark-read`,
        { method: 'POST' }
      );
      return true;
    } catch (error: any) {
      // Return false for any error instead of throwing
      return false;
    }
  }

  async createPrivateChat(username: string): Promise<{ id: string; title: string }> {
    try {
      const data = await this.request<{ id?: string, chat_id?: string, title?: string, data?: { id: string } }>(
        `${EnvironmentVariables.BACKEND_URL}/v1/chat/private`,
        {
          method: 'POST',
          body: JSON.stringify({ other_username: username.trim() })
        }
      );
      
      return {
        id: data.id || data.chat_id || data.data?.id || '',
        title: data.title || `Chat with ${username}`
      };
    } catch (error: any) {
      // Handle specific error cases with better messages
      if (error.status === 409) {
        throw new Error('Chat already exists with this user');
      }
      if (error.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  }
}

export const chatApi = new ChatApiService();