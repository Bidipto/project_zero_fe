import EnvironmentVariables from '@/config/config';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
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

  async getUserList(): Promise<any[]> {
    const response = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/user/usernames`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - please login again');
      throw new Error(`Failed to fetch users: ${response.status}`);
    }
    const data = await response.json();
    return data.usernames || data.data || data.users || data || [];
  }

  async searchUsers(query: string): Promise<any[]> {
    const response = await fetch(
      `${EnvironmentVariables.BACKEND_URL}/v1/user/usernames?search=${encodeURIComponent(query)}`,
      { method: 'GET', headers: this.getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - please login again');
      throw new Error(`Search failed: ${response.status}`);
    }
    const data = await response.json();
    return data.usernames || data.data || data.users || data || [];
  }

  async getPrivateChats(): Promise<any[]> {
    const response = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/chat/private`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - please login again');
      if (response.status === 404) return [];
      throw new Error(`Failed to get chats: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.chats || data.data || data.private_chats || [];
  }

  async getChatMessages(chatId: string | number): Promise<any[]> {
    const response = await fetch(
      `${EnvironmentVariables.BACKEND_URL}/v1/chat/${String(chatId)}/messages`,
      { method: 'GET', headers: this.getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - please login again');
      if (response.status === 404) return [];
      throw new Error(`Failed to get messages: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.messages || data.data || [];
  }

  async sendMessage(message: string, chatId: string | number): Promise<any> {
    const response = await fetch(
      `${EnvironmentVariables.BACKEND_URL}/v1/chat/${String(chatId)}/messages`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          content: message.trim(), 
          message_type: 'text', 
          chat_id: String(chatId) 
        })
      }
    );
    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - please login again');
      throw new Error(`Failed to send message: ${response.status}`);
    }
    return await response.json();
  }

  async markMessagesAsRead(chatId: string | number): Promise<boolean> {
    const response = await fetch(
      `${EnvironmentVariables.BACKEND_URL}/v1/chat/${String(chatId)}/messages/mark-read`,
      { method: 'POST', headers: this.getAuthHeaders() }
    );
    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - please login again');
      return false;
    }
    return true;
  }

  async createPrivateChat(username: string): Promise<{ id: string; title: string }> {
    const response = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/chat/private`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ other_username: username.trim() })
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - please login again');
      if (response.status === 409) throw new Error('Chat already exists with this user');
      if (response.status === 404) throw new Error('User not found');
      throw new Error(`Failed to create chat: ${response.status}`);
    }
    const data = await response.json();
    return {
      id: data.id || data.chat_id || data.data?.id,
      title: data.title || `Chat with ${username}`
    };
  }
}

export const chatApi = new ChatApiService();