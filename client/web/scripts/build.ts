#!/usr/bin/env bun
// Bun 生产构建脚本

import { spawn } from "bun";
import { existsSync, rmSync } from "fs";
import path from "path";

// 清理构建目录
const cleanBuildDirs = () => {
  console.log("🧹 清理构建目录...");
  
  const dirsToClean = [".vinxi", "dist", ".output", "node_modules/.vinxi"];
  
  for (const dir of dirsToClean) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      console.log(`✅ 已清理: ${dir}`);
    }
  }
};

// 检查生产环境配置
const checkProductionConfig = () => {
  console.log("🔍 检查生产环境配置...");
  
  // 检查环境变量
  const requiredEnvVars = [
    "VITE_API_BASE_URL",
    "VITE_APP_TITLE",
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn("⚠️  缺少以下环境变量:");
    missingVars.forEach(varName => console.warn(`   - ${varName}`));
    console.warn("   请在 .env 文件中设置这些变量");
  }
  
  console.log("✅ 配置检查完成");
};

// 执行构建
const runBuild = async () => {
  console.log("🏗️  开始生产构建 (Bun 运行时)...");
  console.log("⚡ 使用 Bun 运行时以获得最佳构建性能");
  
  const startTime = Date.now();
  
  const proc = Bun.spawn([
    "bun", 
    "--bun", 
    "vinxi", 
    "build"
  ], {
    stdio: ["inherit", "inherit", "inherit"],
    env: {
      ...process.env,
      NODE_ENV: "production",
      BUN_ENV: "production",
    },
  });
  
  const exitCode = await proc.exited;
  const duration = Date.now() - startTime;
  
  if (exitCode === 0) {
    console.log(`✅ 构建成功完成 (${duration}ms)`);
    console.log("📦 构建文件位于: .output/");
    console.log("🚀 可以使用以下命令预览:");
    console.log("   bun run preview");
  } else {
    console.error("❌ 构建失败");
    process.exit(exitCode);
  }
};

// 显示构建信息
const showBuildInfo = () => {
  console.log("📊 构建信息:");
  console.log(`   - Bun 版本: ${Bun.version}`);
  console.log(`   - Node.js 兼容: ${process.version}`);
  console.log(`   - 平台: ${process.platform}`);
  console.log(`   - 架构: ${process.arch}`);
  console.log(`   - 工作目录: ${process.cwd()}`);
};

// 主函数
const main = async () => {
  try {
    showBuildInfo();
    cleanBuildDirs();
    checkProductionConfig();
    await runBuild();
  } catch (error) {
    console.error("❌ 构建失败:", error);
    process.exit(1);
  }
};

// 运行
if (import.meta.main) {
  main();
}
