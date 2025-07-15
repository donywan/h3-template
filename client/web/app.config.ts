import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  // Bun 运行时优化
  server: {
    preset: "bun",
    experimental: {
      wasm: true,
    },
  },

  // Vite 配置优化
  vite: {
    // 开发服务器配置
    server: {
      port: 3001,
      host: true,
      hmr: {
        port: 3002,
      },
    },

    // 构建优化
    build: {
      target: "esnext",
      minify: "esbuild",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("@solidjs")) {
                return "solidjs";
              }
              return "vendor";
            }
          },
        },
      },
    },

    // 依赖优化
    optimizeDeps: {
      include: ["solid-js", "@solidjs/router", "@solidjs/meta"],
      exclude: ["@solidjs/start"],
    },

    // 环境变量
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    },
  },

  // 路由配置
  router: {
    base: "/",
  },

  // 实验性功能
  experimental: {
    islands: false,
  },
});
