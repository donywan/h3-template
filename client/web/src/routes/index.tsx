import { Title } from "@solidjs/meta";
import { Show } from "solid-js";
import { useAuth } from "../lib/auth";

export default function Home() {
  const { state } = useAuth();

  return (
    <main class="min-h-screen bg-gray-50">
      <Title>H3 Template Web App</Title>

      {/* 导航栏 */}
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">
                H3 Template
              </h1>
            </div>
            <div class="flex items-center space-x-4">
              <Show
                when={state.isAuthenticated}
                fallback={
                  <div class="space-x-2">
                    <a
                      href="/login"
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      登录
                    </a>
                  </div>
                }
              >
                <span class="text-sm text-gray-700">
                  欢迎, {state.user?.name || state.user?.email || '用户'}
                </span>
                <a
                  href="/dashboard"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  仪表板
                </a>
              </Show>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            欢迎使用 H3 Template
          </h1>
          <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            基于 H3 后端和 SolidStart 前端的现代化全栈应用模板
          </p>

          <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Show
              when={!state.isAuthenticated}
              fallback={
                <div class="space-x-4">
                  <a
                    href="/dashboard"
                    class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    进入仪表板
                  </a>
                </div>
              }
            >
              <div class="space-x-4">
                <a
                  href="/login"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  立即登录
                </a>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </main>
  );
}
