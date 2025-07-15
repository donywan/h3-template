import { createSignal, onMount, Show } from 'solid-js';
import { useAuth, AuthGuard } from '../lib/auth';
import { apiClient } from '../lib/api';

interface HealthStatus {
  status: string;
  environment: string;
  timestamp: string;
  database: {
    host: string;
    port: number;
    database: string;
    health: {
      status: string;
      latency?: number;
    };
  };
  version: string;
}

export default function Dashboard() {
  const { state, logout } = useAuth();
  const [healthStatus, setHealthStatus] = createSignal<HealthStatus | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = createSignal(false);

  // 获取系统健康状态
  const fetchHealthStatus = async () => {
    setIsLoadingHealth(true);
    try {
      const response = await apiClient.healthCheck();
      if (response.success) {
        setHealthStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  onMount(() => {
    fetchHealthStatus();
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthGuard>
      <div class="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <nav class="bg-white shadow">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex items-center">
                <h1 class="text-xl font-semibold text-gray-900">
                  H3 Template Dashboard
                </h1>
              </div>
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-700">
                  欢迎, {state.user?.name || state.user?.email || '用户'}
                </span>
                <button
                  onClick={handleLogout}
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 主要内容 */}
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            {/* 用户信息卡片 */}
            <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  用户信息
                </h3>
                <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">用户ID</dt>
                    <dd class="mt-1 text-sm text-gray-900">{state.user?.id}</dd>
                  </div>
                  <Show when={state.user?.email}>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">邮箱</dt>
                      <dd class="mt-1 text-sm text-gray-900">{state.user?.email}</dd>
                    </div>
                  </Show>
                  <Show when={state.user?.phone}>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">手机号</dt>
                      <dd class="mt-1 text-sm text-gray-900">{state.user?.phone}</dd>
                    </div>
                  </Show>
                  <Show when={state.user?.name}>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">姓名</dt>
                      <dd class="mt-1 text-sm text-gray-900">{state.user?.name}</dd>
                    </div>
                  </Show>
                </dl>
              </div>
            </div>

            {/* 系统状态卡片 */}
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    系统状态
                  </h3>
                  <button
                    onClick={fetchHealthStatus}
                    disabled={isLoadingHealth()}
                    class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
                  >
                    <Show when={isLoadingHealth()} fallback="刷新">
                      刷新中...
                    </Show>
                  </button>
                </div>

                <Show when={healthStatus()} fallback={
                  <div class="text-gray-500">加载中...</div>
                }>
                  {(health) => (
                    <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <dt class="text-sm font-medium text-gray-500">系统状态</dt>
                        <dd class="mt-1 flex items-center">
                          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            health().status === 'ok' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {health().status === 'ok' ? '正常' : '异常'}
                          </span>
                        </dd>
                      </div>

                      <div>
                        <dt class="text-sm font-medium text-gray-500">环境</dt>
                        <dd class="mt-1 text-sm text-gray-900">{health().environment}</dd>
                      </div>

                      <div>
                        <dt class="text-sm font-medium text-gray-500">版本</dt>
                        <dd class="mt-1 text-sm text-gray-900">{health().version}</dd>
                      </div>

                      <div>
                        <dt class="text-sm font-medium text-gray-500">数据库状态</dt>
                        <dd class="mt-1 flex items-center">
                          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            health().database.health.status === 'healthy' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {health().database.health.status === 'healthy' ? '健康' : '异常'}
                          </span>
                        </dd>
                      </div>

                      <Show when={health().database.health.latency}>
                        <div>
                          <dt class="text-sm font-medium text-gray-500">数据库延迟</dt>
                          <dd class="mt-1 text-sm text-gray-900">
                            {health().database.health.latency}ms
                          </dd>
                        </div>
                      </Show>

                      <div>
                        <dt class="text-sm font-medium text-gray-500">检查时间</dt>
                        <dd class="mt-1 text-sm text-gray-900">
                          {new Date(health().timestamp).toLocaleString('zh-CN')}
                        </dd>
                      </div>
                    </dl>
                  )}
                </Show>
              </div>
            </div>

            {/* API 测试区域 */}
            <div class="bg-white overflow-hidden shadow rounded-lg mt-6">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  API 测试
                </h3>
                <div class="space-y-4">
                  <div class="flex space-x-4">
                    <button
                      onClick={fetchHealthStatus}
                      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      测试健康检查 API
                    </button>
                    <button
                      onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/db/status`, '_blank')}
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      查看数据库状态
                    </button>
                  </div>
                  <p class="text-sm text-gray-600">
                    这些按钮可以帮助您测试与后端 API 的连接。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
