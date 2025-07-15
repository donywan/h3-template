#!/usr/bin/env bun
// Bun 开发服务器启动脚本

import { spawn } from "bun";
import { existsSync } from "fs";
import path from "path";

// 检查环境
const checkEnvironment = () => {
  console.log("🔍 检查开发环境...");
  
  // 检查 .env 文件
  if (!existsSync(".env")) {
    console.log("⚠️  .env 文件不存在，从 .env.example 复制...");
    await Bun.write(".env", await Bun.file(".env.example").text());
    console.log("✅ .env 文件已创建");
  }
  
  // 检查依赖
  if (!existsSync("node_modules")) {
    console.log("📦 安装依赖...");
    await Bun.spawn(["bun", "install"], { stdio: ["inherit", "inherit", "inherit"] });
    console.log("✅ 依赖安装完成");
  }
  
  console.log("✅ 环境检查完成");
};

// 启动开发服务器
const startDevServer = async () => {
  console.log("🚀 启动 SolidStart 开发服务器 (Bun 运行时)...");
  console.log("📍 服务器地址: http://localhost:3001");
  console.log("🔥 HMR 端口: 3002");
  console.log("⚡ 使用 Bun 运行时以获得最佳性能");
  
  const proc = Bun.spawn([
    "bun", 
    "--bun", 
    "vinxi", 
    "dev", 
    "--port", 
    "3001"
  ], {
    stdio: ["inherit", "inherit", "inherit"],
    env: {
      ...process.env,
      NODE_ENV: "development",
      BUN_ENV: "development",
    },
  });
  
  // 处理进程退出
  process.on("SIGINT", () => {
    console.log("\n🛑 正在关闭开发服务器...");
    proc.kill();
    process.exit(0);
  });
  
  process.on("SIGTERM", () => {
    console.log("\n🛑 正在关闭开发服务器...");
    proc.kill();
    process.exit(0);
  });
  
  await proc.exited;
};

// 主函数
const main = async () => {
  try {
    await checkEnvironment();
    await startDevServer();
  } catch (error) {
    console.error("❌ 启动失败:", error);
    process.exit(1);
  }
};

// 运行
if (import.meta.main) {
  main();
}
