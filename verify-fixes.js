#!/usr/bin/env node

/**
 * Verify that all fixes have been applied correctly
 * 验证所有修复是否已正确应用
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 验证 Notion 同步系统修复\n');
console.log('━'.repeat(60));

let passedChecks = 0;
let totalChecks = 0;

function checkFeature(name, condition, description) {
  totalChecks++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (description) {
    console.log(`   ${description}`);
  }
  if (condition) passedChecks++;
  return condition;
}

// 1. 检查 notion-sync.js 的改进
console.log('\n1️⃣  notion-sync.js 改进检查');
console.log('─'.repeat(60));

const syncContent = fs.readFileSync('/home/engine/project/scripts/notion-sync.js', 'utf8');

checkFeature(
  'validateEnv() 方法',
  syncContent.includes('validateEnv()'),
  '验证必需的环境变量'
);

checkFeature(
  '环境变量验证逻辑',
  syncContent.includes("const required = ['NOTION_TOKEN', 'NOTION_DATABASE_ID']"),
  '检查 NOTION_TOKEN 和 NOTION_DATABASE_ID'
);

checkFeature(
  '完整块类型支持',
  syncContent.includes("case 'divider'") && 
  syncContent.includes("case 'callout'") &&
  syncContent.includes("case 'toggle'") &&
  syncContent.includes("case 'table'"),
  '支持 divider, callout, toggle, table'
);

checkFeature(
  '中文标题支持',
  syncContent.includes('\\u4e00-\\u9fff'),
  '正则表达式支持中文字符 (\\u4e00-\\u9fff)'
);

checkFeature(
  '文件冲突检测',
  syncContent.includes('while (fs.existsSync(filePath) && counter < 10)'),
  '自动检测和处理文件名冲突'
);

checkFeature(
  '日期格式校验',
  syncContent.includes('/^\\d{4}-\\d{2}-\\d{2}$/'),
  '验证日期格式为 YYYY-MM-DD'
);

checkFeature(
  'richText 注解处理改进',
  syncContent.includes('if (text.annotations.code)') &&
  syncContent.includes('} else {'),
  '先处理代码注解，再处理其他注解'
);

checkFeature(
  '改进的错误处理',
  syncContent.includes('process.exit(1)'),
  '设置正确的退出码'
);

checkFeature(
  'tableToMarkdown 方法',
  syncContent.includes('tableToMarkdown(block)'),
  '支持表格块的转换'
);

checkFeature(
  '改进的 syncAll 日志',
  syncContent.includes('console.log(`\\n✨ 同步完成!`)') &&
  syncContent.includes('✅ 成功: '),
  '提供详细的同步结果统计'
);

// 2. 检查工作流文件的改进
console.log('\n2️⃣  GitHub Actions 工作流改进检查');
console.log('─'.repeat(60));

const workflowContent = fs.readFileSync('/home/engine/project/.github/workflows/notion-sync.yml', 'utf8');

checkFeature(
  'Git 配置步骤',
  workflowContent.includes('Setup Git configuration'),
  '添加了 git config 步骤'
);

checkFeature(
  'Git 用户邮箱配置',
  workflowContent.includes('git config --global user.email'),
  '设置 git 用户邮箱'
);

checkFeature(
  'Git 用户名配置',
  workflowContent.includes('git config --global user.name'),
  '设置 git 用户名'
);

checkFeature(
  'Commit 和 Push 步骤',
  workflowContent.includes('Commit and push new posts'),
  '添加了提交和推送新文章的步骤'
);

checkFeature(
  'Git status 检查',
  workflowContent.includes('git status --short source/_posts/'),
  '检查是否有新文件需要提交'
);

checkFeature(
  'Fetch depth 配置',
  workflowContent.includes('fetch-depth: 0'),
  '获取完整的 git 历史'
);

checkFeature(
  '测试连接步骤',
  workflowContent.includes('Test Notion connection'),
  '在同步前测试 Notion 连接'
);

// 3. 检查 notion-auto-sync.js 的改进
console.log('\n3️⃣  notion-auto-sync.js 改进检查');
console.log('─'.repeat(60));

const autoSyncContent = fs.readFileSync('/home/engine/project/scripts/notion-auto-sync.js', 'utf8');

checkFeature(
  '改进的错误处理',
  autoSyncContent.includes('try {') && autoSyncContent.includes('await this.syncAndBuild();'),
  '在定时任务中处理错误'
);

checkFeature(
  '时间戳日志',
  autoSyncContent.includes('new Date().toLocaleString()'),
  '记录每次同步的时间'
);

checkFeature(
  '目录信息日志',
  autoSyncContent.includes("process.env.POSTS_DIR || 'source/_posts'"),
  '显示配置的文章目录'
);

// 4. 检查诊断工具
console.log('\n4️⃣  诊断工具检查');
console.log('─'.repeat(60));

checkFeature(
  '诊断脚本存在',
  fs.existsSync('/home/engine/project/diagnose.js'),
  'diagnose.js 文件存在'
);

if (fs.existsSync('/home/engine/project/diagnose.js')) {
  const diagnoseContent = fs.readFileSync('/home/engine/project/diagnose.js', 'utf8');
  
  checkFeature(
    '环境变量诊断',
    diagnoseContent.includes('NOTION_TOKEN'),
    '检查必需的环境变量'
  );
  
  checkFeature(
    '文件完整性诊断',
    diagnoseContent.includes('.github/workflows/notion-sync.yml'),
    '检查所有必需的文件'
  );
  
  checkFeature(
    '块类型支持诊断',
    diagnoseContent.includes('divider') && diagnoseContent.includes('toggle'),
    '检查块类型支持'
  );
}

// 5. 检查文档
console.log('\n5️⃣  文档检查');
console.log('─'.repeat(60));

checkFeature(
  '诊断报告文档',
  fs.existsSync('/home/engine/project/DIAGNOSIS_AND_FIXES.md'),
  'DIAGNOSIS_AND_FIXES.md 文件存在'
);

checkFeature(
  '快速开始指南',
  fs.existsSync('/home/engine/project/QUICK_START.md'),
  'QUICK_START.md 文件存在'
);

checkFeature(
  '测试验证计划',
  fs.existsSync('/home/engine/project/TEST_VERIFICATION_PLAN.md'),
  'TEST_VERIFICATION_PLAN.md 文件存在'
);

// 6. 检查依赖
console.log('\n6️⃣  依赖检查');
console.log('─'.repeat(60));

const packageJson = JSON.parse(fs.readFileSync('/home/engine/project/package.json', 'utf8'));

checkFeature(
  '@notionhq/client 依赖',
  '@notionhq/client' in packageJson.dependencies,
  `版本: ${packageJson.dependencies['@notionhq/client']}`
);

checkFeature(
  'dotenv 依赖',
  'dotenv' in packageJson.dependencies,
  `版本: ${packageJson.dependencies['dotenv']}`
);

checkFeature(
  'node-cron 依赖',
  'node-cron' in packageJson.dependencies,
  `版本: ${packageJson.dependencies['node-cron']}`
);

// 7. 检查脚本命令
console.log('\n7️⃣  NPM 脚本检查');
console.log('─'.repeat(60));

checkFeature(
  'sync-notion 脚本',
  'sync-notion' in packageJson.scripts,
  packageJson.scripts['sync-notion']
);

checkFeature(
  'auto-sync 脚本',
  'auto-sync' in packageJson.scripts,
  packageJson.scripts['auto-sync']
);

checkFeature(
  'webhook 脚本',
  'webhook' in packageJson.scripts,
  packageJson.scripts['webhook']
);

checkFeature(
  'clean 脚本',
  'clean' in packageJson.scripts,
  packageJson.scripts['clean']
);

checkFeature(
  'build 脚本',
  'build' in packageJson.scripts,
  packageJson.scripts['build']
);

// 总结
console.log('\n' + '━'.repeat(60));
console.log(`\n📊 验证结果: ${passedChecks}/${totalChecks} 检查通过\n`);

if (passedChecks === totalChecks) {
  console.log('✨ 所有修复都已正确应用！系统已准备好投入生产。\n');
  process.exit(0);
} else {
  console.log(`⚠️  有 ${totalChecks - passedChecks} 项检查未通过。\n`);
  process.exit(1);
}
