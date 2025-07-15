import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login, state } = useAuth();
  
  const [loginType, setLoginType] = createSignal<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  // 如果已经登录，重定向到首页
  if (state.isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(identifier(), password(), loginType());
      
      if (success) {
        navigate('/');
      } else {
        setError('登录失败，请检查用户名和密码');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到您的账户
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            H3 Template Web App
          </p>
        </div>
        
        <form class="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div class="rounded-md shadow-sm -space-y-px">
            {/* 登录类型切换 */}
            <div class="flex mb-4">
              <button
                type="button"
                class={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
                  loginType() === 'email'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setLoginType('email')}
              >
                邮箱登录
              </button>
              <button
                type="button"
                class={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border ${
                  loginType() === 'phone'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setLoginType('phone')}
              >
                手机登录
              </button>
            </div>

            {/* 用户名输入 */}
            <div>
              <label for="identifier" class="sr-only">
                {loginType() === 'email' ? '邮箱地址' : '手机号码'}
              </label>
              <input
                id="identifier"
                name="identifier"
                type={loginType() === 'email' ? 'email' : 'tel'}
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={loginType() === 'email' ? '邮箱地址' : '手机号码'}
                value={identifier()}
                onInput={(e) => setIdentifier(e.currentTarget.value)}
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label for="password" class="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
              />
            </div>
          </div>

          {/* 错误信息 */}
          <Show when={error()}>
            <div class="text-red-600 text-sm text-center">
              {error()}
            </div>
          </Show>

          {/* 提交按钮 */}
          <div>
            <button
              type="submit"
              disabled={isLoading()}
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Show when={isLoading()} fallback="登录">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </Show>
            </button>
          </div>

          {/* 其他链接 */}
          <div class="flex items-center justify-between">
            <div class="text-sm">
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                忘记密码？
              </a>
            </div>
            <div class="text-sm">
              <a href="/register" class="font-medium text-blue-600 hover:text-blue-500">
                注册新账户
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
