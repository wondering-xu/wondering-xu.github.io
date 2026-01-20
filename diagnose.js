#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 开始诊断 Notion 同步系统...\n');

// 诊断 1: 检查环境变量
console.log('1️⃣  环境变量检查');
console.log('━'.repeat(50));

const requiredEnvs = ['NOTION_TOKEN', 'NOTION_DATABASE_ID'];
const allEnvs = {
  'NOTION_TOKEN': process.env.NOTION_TOKEN ? '✅ 已配置' : '❌ 未配置',
  'NOTION_DATABASE_ID': process.env.NOTION_DATABASE_ID ? '✅ 已配置' : '❌ 未配置',
  'WEBHOOK_SECRET': process.env.WEBHOOK_SECRET ? '✅ 已配置' : '⚠️ 未配置（可选）',
  'BLOG_URL': process.env.BLOG_URL ? '✅ 已配置' : '⚠️ 未配置（可选）',
  'POSTS_DIR': process.env.POSTS_DIR ? '✅ 已配置' : '⚠️ 未配置（使用默认值）',
};

Object.entries(allEnvs).forEach(([key, status]) => {
  console.log(`  ${key}: ${status}`);
});

const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
if (missingEnvs.length > 0) {
  console.log(`\n❌ 缺少必需的环境变量: ${missingEnvs.join(', ')}`);
  console.log('   请在 .env 文件中配置这些变量或设置 GitHub Secrets\n');
}

// 诊断 2: 检查文件完整性
console.log('\n2️⃣  文件完整性检查');
console.log('━'.repeat(50));

const requiredFiles = [
  '.github/workflows/notion-sync.yml',
  'scripts/notion-sync.js',
  'scripts/notion-auto-sync.js',
  'scripts/notion-webhook.js',
  'package.json',
  '.env.example',
  'source/_posts'
];

requiredFiles.forEach(file => {
  const fullPath = path.join('/home/engine/project', file);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  const type = fs.statSync(fullPath).isDirectory ? '(目录)' : '(文件)';
  console.log(`  ${status} ${file} ${type}`);
});

// 诊断 3: 检查 package.json 依赖
console.log('\n3️⃣  依赖检查');
console.log('━'.repeat(50));

const pkg = require('/home/engine/project/package.json');
const requiredDeps = [
  '@notionhq/client',
  'dotenv',
  'express',
  'node-cron',
  'hexo',
  'hexo-cli'
];

requiredDeps.forEach(dep => {
  const exists = dep in pkg.dependencies;
  const status = exists ? '✅' : '❌';
  const version = pkg.dependencies[dep] || '未配置';
  console.log(`  ${status} ${dep}: ${version}`);
});

// 诊断 4: 检查脚本的 npm 命令
console.log('\n4️⃣  NPM 脚本检查');
console.log('━'.repeat(50));

const requiredScripts = [
  'sync-notion',
  'auto-sync',
  'webhook',
  'clean',
  'build'
];

requiredScripts.forEach(script => {
  const exists = script in pkg.scripts;
  const status = exists ? '✅' : '❌';
  const command = pkg.scripts[script] || '未配置';
  console.log(`  ${status} npm run ${script}: ${command}`);
});

// 诊断 5: 检查工作流配置
console.log('\n5️⃣  GitHub Actions 工作流检查');
console.log('━'.repeat(50));

try {
  const workflowPath = '/home/engine/project/.github/workflows/notion-sync.yml';
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  
  const checks = [
    ['触发条件', 'on:', workflowContent.includes('on:')],
    ['工作流名称', 'jobs:', workflowContent.includes('jobs:')],
    ['Node.js 设置', 'actions/setup-node', workflowContent.includes('actions/setup-node')],
    ['npm ci 安装', 'npm ci', workflowContent.includes('npm ci')],
    ['环境变量设置', 'NOTION_TOKEN', workflowContent.includes('NOTION_TOKEN')],
    ['测试连接', '--test', workflowContent.includes('--test')],
    ['同步脚本', 'sync-notion', workflowContent.includes('sync-notion')],
    ['Hexo 清理', 'npm run clean', workflowContent.includes('npm run clean')],
    ['Hexo 构建', 'npm run build', workflowContent.includes('npm run build')],
  ];
  
  checks.forEach(([name, pattern, found]) => {
    const status = found ? '✅' : '❌';
    console.log(`  ${status} ${name}: ${pattern}`);
  });
} catch (error) {
  console.log(`  ❌ 无法读取工作流文件: ${error.message}`);
}

// 诊断 6: 检查 notion-sync.js 的关键方法
console.log('\n6️⃣  Notion 同步脚本检查');
console.log('━'.repeat(50));

try {
  const syncPath = '/home/engine/project/scripts/notion-sync.js';
  const syncContent = fs.readFileSync(syncPath, 'utf8');
  
  const methods = [
    'testConnection',
    'getPublishedPosts',
    'notionToHexoPost',
    'getPageContent',
    'blockToMarkdown',
    'richTextToMarkdown',
    'generateFilename',
    'savePost',
    'syncAll'
  ];
  
  methods.forEach(method => {
    const exists = syncContent.includes(`${method}(`);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${method} 方法`);
  });

  // 检查块类型支持
  console.log('\n  块类型支持:');
  const blockTypes = [
    'paragraph',
    'heading_1',
    'heading_2',
    'heading_3',
    'bulleted_list_item',
    'numbered_list_item',
    'quote',
    'code',
    'image',
    'divider',
    'table',
    'toggle'
  ];
  
  blockTypes.forEach(type => {
    const supported = syncContent.includes(`case '${type}'`);
    const status = supported ? '✅' : '⚠️';
    console.log(`    ${status} ${type}`);
  });

} catch (error) {
  console.log(`  ❌ 无法读取脚本文件: ${error.message}`);
}

// 诊断 7: Notion API 连接测试
console.log('\n7️⃣  Notion 连接测试');
console.log('━'.repeat(50));

if (!process.env.NOTION_TOKEN) {
  console.log('  ⚠️ 未配置 NOTION_TOKEN，跳过连接测试');
} else {
  try {
    const { Client } = require('@notionhq/client');
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    
    (async () => {
      try {
        const user = await notion.users.me();
        console.log(`  ✅ Notion 连接成功: ${user.name}`);
      } catch (error) {
        console.log(`  ❌ Notion 连接失败: ${error.message}`);
      }
    })();
  } catch (error) {
    console.log(`  ❌ 无法初始化 Notion 客户端: ${error.message}`);
  }
}

// 诊断 8: 目录和权限检查
console.log('\n8️⃣  目录权限检查');
console.log('━'.repeat(50));

try {
  const postsDir = process.env.POSTS_DIR || 'source/_posts';
  const postsPath = path.join('/home/engine/project', postsDir);
  const stats = fs.statSync(postsPath);
  
  const readable = fs.accessSync(postsPath, fs.constants.R_OK) || true;
  const writable = fs.accessSync(postsPath, fs.constants.W_OK) || true;
  
  console.log(`  ✅ 目录存在: ${postsPath}`);
  console.log(`  ✅ 可读权限: 是`);
  console.log(`  ✅ 可写权限: 是`);
  
  // 列出目录中的文件
  const files = fs.readdirSync(postsPath);
  console.log(`  📝 目录中有 ${files.length} 个文件`);
  if (files.length > 0) {
    files.slice(0, 5).forEach(file => {
      console.log(`    - ${file}`);
    });
    if (files.length > 5) {
      console.log(`    ... 和 ${files.length - 5} 个其他文件`);
    }
  }
} catch (error) {
  console.log(`  ❌ 目录检查失败: ${error.message}`);
}

console.log('\n' + '━'.repeat(50));
console.log('✨ 诊断完成！\n');
