// 认证状态管理
import { createSignal, createContext, useContext, ParentComponent, onMount, createMemo } from 'solid-js';
import { apiClient, tokenManager } from './api';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string, type?: 'email' | 'phone') => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType>();

// 认证提供者组件
export const AuthProvider: ParentComponent = (props) => {
  const [state, setState] = createSignal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 登录函数
  const login = async (identifier: string, password: string, type: 'email' | 'phone' = 'email'): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      let response;
      if (type === 'email') {
        response = await apiClient.loginWithEmail(identifier, password);
      } else {
        response = await apiClient.loginWithPhone(identifier, password);
      }

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // 保存 tokens
        tokenManager.setTokens(accessToken, refreshToken);

        // 更新状态
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        return true;
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // 退出登录函数
  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 清除本地状态
      tokenManager.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  // 刷新用户信息
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.getUserProfile();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        // 获取用户信息失败，可能 token 无效
        await logout();
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      await logout();
    }
  };

  // 初始化认证状态
  onMount(async () => {
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      // 有 token，尝试获取用户信息
      await refreshUser();
    } else {
      // 没有 token，设置为未认证状态
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  });

  // 使用 createMemo 来优化 contextValue，避免不必要的重新渲染
  const contextValue = createMemo(() => ({
    state: state(),
    login,
    logout,
    refreshUser,
  }));

  return (
    <AuthContext.Provider value={contextValue()}>
      {props.children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的 Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 认证守卫组件
export const AuthGuard: ParentComponent<{ fallback?: () => any }> = (props) => {
  const { state } = useAuth();

  // 如果正在加载，显示加载状态
  if (state.isLoading) {
    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-lg">加载中...</div>
      </div>
    );
  }

  // 如果未认证，显示 fallback 或重定向到登录页
  if (!state.isAuthenticated) {
    if (props.fallback) {
      return props.fallback();
    }

    // 重定向到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-lg">请先登录</div>
      </div>
    );
  }

  // 已认证，显示子组件
  return <>{props.children}</>;
};

// 检查是否已认证的工具函数
export const isAuthenticated = (): boolean => {
  return !!tokenManager.getAccessToken();
};

// 获取当前用户信息的工具函数
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.getUserProfile();
    return response.success ? response.data : null;
  } catch {
    return null;
  }
};
