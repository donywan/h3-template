// API 客户端配置和工具函数

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// API 配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Token 存储键
const ACCESS_TOKEN_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'h3_access_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'h3_refresh_token';

// Token 管理
export const tokenManager = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }
};

// HTTP 客户端类
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = tokenManager.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // 添加认证头
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 处理 401 错误 (token 过期)
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.data?.code === 'TOKEN_EXPIRED') {
            // 尝试刷新 token
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // 重试原请求
              return this.request(endpoint, options);
            } else {
              // 刷新失败，清除 token 并跳转登录
              tokenManager.clearTokens();
              window.location.href = '/login';
              throw new Error('认证失败，请重新登录');
            }
          }
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  // 刷新 token
  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/app/user/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data: ApiResponse<RefreshTokenResponse> = await response.json();
      if (data.success && data.data?.accessToken) {
        tokenManager.setAccessToken(data.data.accessToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // GET 请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST 请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT 请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 用户登录 (邮箱)
  async loginWithEmail(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/app/user/login/email', { email, password });
  }

  // 用户登录 (手机)
  async loginWithPhone(phone: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/app/user/login/phone', { phone, password });
  }

  // 获取用户信息
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.get('/app/user/profile');
  }

  // 退出登录
  async logout(): Promise<ApiResponse<any>> {
    const result = await this.post('/app/user/logout');
    tokenManager.clearTokens();
    return result;
  }

  // 健康检查
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/health');
  }
}

// 创建 API 客户端实例
export const apiClient = new ApiClient(API_BASE_URL, API_TIMEOUT);

// 导出常用方法
export const {
  get,
  post,
  put,
  delete: del,
  loginWithEmail,
  loginWithPhone,
  getUserProfile,
  logout,
  healthCheck,
} = apiClient;
