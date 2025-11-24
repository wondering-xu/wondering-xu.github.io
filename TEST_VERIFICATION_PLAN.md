# Notion 同步系统测试验证计划

## 📋 测试目标

验证 Notion 同步发布系统的以下功能：
1. Notion API 连接
2. 文章转换逻辑
3. 文件生成和保存
4. GitHub Actions 工作流执行
5. Hexo 构建和部署
6. 线上博客显示

## 🧪 测试环境

- Node.js: v18+
- npm: 最新版本
- Hexo: 7.3.0
- 操作系统: Ubuntu / macOS / Windows (with WSL)

## ✅ 单元测试

### 1. 环境配置测试

**测试命令**:
```bash
node diagnose.js
```

**预期结果**:
```
✅ 环境变量检查 - 至少需要 NOTION_TOKEN 和 NOTION_DATABASE_ID
✅ 文件完整性检查 - 所有必需文件存在
✅ 依赖检查 - 所有 npm 包已安装
✅ 脚本检查 - 所有 npm 命令可用
✅ 工作流检查 - GitHub Actions 工作流格式正确
✅ 脚本检查 - 所有方法都定义了
✅ 目录权限检查 - source/_posts 目录可读写
```

**通过标准**: 所有检查项都显示 ✅

### 2. Notion 连接测试

**测试命令**:
```bash
npm run sync-notion -- --test
```

**前置条件**:
- `.env` 文件存在且包含有效的 NOTION_TOKEN 和 NOTION_DATABASE_ID
- Notion Integration 具有数据库访问权限

**预期结果**:
```
✅ Notion连接成功: [用户名]
```

**通过标准**: 显示成功的用户名和无错误消息

### 3. 文章获取测试

**测试命令**:
```bash
npm run sync-notion
```

**前置条件**:
- Notion 数据库中至少有一篇文章
- 文章状态为 "Published" 或 "已发布"

**预期结果**:
```
🚀 开始同步Notion文章...
✅ Notion连接成功: [用户名]
📝 找到 X 篇已发布文章
✅ 文章已保存: [文件名]
✨ 同步完成!
  ✅ 成功: X 篇
```

**通过标准**:
- 所有文章都成功同步
- 新文件出现在 `source/_posts/` 目录中

### 4. 文件格式测试

**验证生成的文件格式**:

```bash
cat source/_posts/[生成的文件名].md
```

**预期格式**:
```markdown
---
title: 文章标题
date: 2025-01-24
tags: ["标签1", "标签2"]
cover: https://example.com/cover.jpg
excerpt: 文章摘要
category: 分类
---

# 文章内容
... (Markdown 格式的内容)
```

**检查项**:
- ✅ Front Matter 以 `---` 开始和结束
- ✅ title 字段存在
- ✅ date 字段格式为 YYYY-MM-DD
- ✅ 中文标题被保留（不被删除）
- ✅ 内容是有效的 Markdown 格式

### 5. 中文标题处理测试

**测试场景**: Notion 中有中文标题的文章

**预期结果**:
```
文件名: 2025-01-24-这是一篇中文文章.md
              ↑ 中文字符被保留
```

**检查项**:
- ✅ 文件名包含中文字符（可读）
- ✅ 文件名格式正确（日期-标题.md）
- ✅ 文件名长度合理（不超过 50 字符）

### 6. 特殊字符处理测试

**测试场景**: Notion 中有特殊符号的标题

**示例**:
- "文章: C++ 编程指南"
- "文章 [重要] 2025 年计划"
- "文章 (Draft) HTML & CSS"

**预期结果**: 文件名正确处理，无生成错误

### 7. 块类型转换测试

**创建包含以下块的 Notion 页面**:

| 块类型 | Notion 内容 | 预期输出 |
|--------|-----------|---------|
| 段落 | 普通文本 | 文本保留 |
| 标题 1-3 | 标题文本 | `# ## ###` 格式 |
| 列表 | 项目列表 | `- 1.` 格式 |
| 引用 | 引用文本 | `> ` 格式 |
| 代码块 | 代码 | 三引号代码块 |
| 图片 | 图片 | `![]()` 格式 |
| 分割线 | 分割线块 | `---` |
| 提示框 | Callout | 文本保留 |

**检查命令**:
```bash
npm run sync-notion
cat source/_posts/[文件名].md
```

### 8. 富文本注解测试

**创建包含以下格式的 Notion 页面**:

| 格式 | Notion | 预期输出 |
|------|--------|---------|
| 粗体 | **文本** | `**文本**` |
| 斜体 | *文本* | `*文本*` |
| 删除线 | ~~文本~~ | `~~文本~~` |
| 代码 | `代码` | 反引号代码 |
| 链接 | [文本](url) | `[文本](url)` |

## 🔄 集成测试

### 1. 自动同步测试

**测试命令**:
```bash
npm run auto-sync -- --once
```

**预期结果**:
```
🔄 开始自动同步...
⏰ 时间: [当前时间]
📡 正在同步文章...
[同步日志...]
🔨 开始构建网站...
  清理旧文件...
  生成新网站...
✅ 网站构建完成
🎉 自动同步完成！
```

**通过标准**: 无错误，所有步骤完成

### 2. Webhook 服务测试

**启动 Webhook 服务**:
```bash
npm run webhook &
```

**验证服务状态**:
```bash
curl http://localhost:3000/health
```

**预期输出**:
```json
{"status":"ok","timestamp":"2025-01-24T..."}
```

**手动同步**:
```bash
curl -X POST http://localhost:3000/sync
```

### 3. Hexo 构建测试

**清理和构建**:
```bash
npm run clean
npm run build
```

**验证构建结果**:
```bash
ls public/index.html
```

**预期结果**:
- ✅ `public/` 目录存在
- ✅ `public/index.html` 存在
- ✅ 生成的网站包含新文章的链接

## 🚀 GitHub Actions 测试

### 1. 手动触发测试

**步骤**:
1. 打开 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Notion Auto Sync and Deploy" 工作流
4. 点击 "Run workflow" 按钮
5. 选择分支（默认）
6. 点击 "Run workflow"

**监控日志**:
- 观察每个步骤的执行
- 记录任何错误或警告

**预期结果**:
```
✅ Checkout repository - 成功
✅ Setup Node.js - 成功
✅ Install dependencies - 成功
✅ Setup environment variables - 成功
✅ Setup Git configuration - 成功
✅ Test Notion connection - 成功
✅ Sync posts from Notion - 成功
✅ Generate site - 成功
✅ Commit and push new posts - 成功
✅ Deploy to GitHub Pages - 成功
```

### 2. Push 触发测试

**步骤**:
1. 本地修改一个文件
2. `git commit -m "test: trigger workflow"`
3. `git push origin main`

**监控**:
- 工作流应该自动启动
- 检查工作流执行日志

### 3. 定时触发测试

**配置**: 工作流每 30 分钟运行一次

**验证方法**:
1. 记录工作流开始时间
2. 等待 30 分钟
3. 验证工作流自动运行

## 📊 部署验证

### 1. GitHub Pages 部署验证

**步骤**:
1. 访问 GitHub Pages URL（如 `https://username.github.io/blog`）
2. 检查博客是否能加载
3. 查找新同步的文章

**检查项**:
- ✅ 网站能正常加载
- ✅ 新文章出现在首页
- ✅ 文章链接正常
- ✅ 文章内容正确显示
- ✅ 中文标题正确显示
- ✅ 标签和分类正确显示

### 2. 文章内容验证

**检查**:
- ✅ 文章标题正确
- ✅ 发布日期正确
- ✅ 标签正确显示
- ✅ 封面图片加载
- ✅ 文章摘要显示
- ✅ 文章内容完整
- ✅ 代码块格式正确
- ✅ 链接可点击
- ✅ 图片正常显示

## 🐛 故障排除检查清单

如果出现问题，按以下步骤排查：

### 连接问题
- [ ] 检查 NOTION_TOKEN 是否有效
- [ ] 检查 NOTION_DATABASE_ID 是否正确
- [ ] 验证 Integration 有数据库访问权限
- [ ] 检查网络连接
- [ ] 查看诊断输出：`node diagnose.js`

### 同步问题
- [ ] 确认 Notion 文章状态为 "Published"
- [ ] 检查文章是否有 Title 字段
- [ ] 查看同步日志中的错误信息
- [ ] 验证 source/_posts/ 目录权限
- [ ] 检查磁盘空间是否充足

### 工作流问题
- [ ] 查看 GitHub Actions 执行日志
- [ ] 确认所有 secrets 都已设置
- [ ] 验证工作流文件语法
- [ ] 检查分支是否在触发列表中
- [ ] 查看 git 配置是否正确

### 构建问题
- [ ] 运行 `npm run build` 检查 Hexo 构建
- [ ] 查看 Hexo 构建日志
- [ ] 验证主题文件是否完整
- [ ] 检查 _config.yml 配置

### 部署问题
- [ ] 确认 GitHub Pages 已启用
- [ ] 检查部署分支配置
- [ ] 验证 GitHub Token 有效
- [ ] 查看部署日志
- [ ] 清除浏览器缓存后重新访问

## 📈 性能测试

### 同步性能

**测试**: 同步大量文章

**步骤**:
1. 创建 100+ 篇文章到 Notion 数据库
2. 运行 `npm run sync-notion`
3. 记录完成时间

**预期**: 
- 同步时间 < 5 分钟
- 无内存泄漏
- 所有文章成功同步

### 构建性能

**测试**: 构建包含 100+ 篇文章的网站

**步骤**:
1. 确保 source/_posts/ 有 100+ 文章
2. 运行 `npm run build`
3. 记录构建时间

**预期**:
- 构建时间 < 2 分钟
- 无错误或警告
- 网站能正常显示所有文章

## ✨ 完整测试清单

- [ ] 环境配置测试通过
- [ ] Notion 连接测试通过
- [ ] 文章获取测试通过
- [ ] 文件格式测试通过
- [ ] 中文标题处理测试通过
- [ ] 特殊字符处理测试通过
- [ ] 块类型转换测试通过
- [ ] 富文本注解测试通过
- [ ] 自动同步测试通过
- [ ] Webhook 服务测试通过
- [ ] Hexo 构建测试通过
- [ ] GitHub Actions 手动触发测试通过
- [ ] GitHub Actions 推送触发测试通过
- [ ] GitHub Actions 定时触发测试通过
- [ ] GitHub Pages 部署验证通过
- [ ] 文章内容验证通过
- [ ] 性能测试通过

## 📝 测试报告模板

```
测试日期: [日期]
测试人员: [名字]
系统版本: [版本]

### 测试结果
- [项目]: ✅ 通过 / ⚠️ 警告 / ❌ 失败

### 发现的问题
[描述问题]

### 性能数据
- 同步时间: [时间]
- 构建时间: [时间]

### 备注
[其他备注]
```

## 🎯 验收标准

所有以下条件必须满足：

1. ✅ 所有单元测试通过
2. ✅ 所有集成测试通过
3. ✅ GitHub Actions 工作流成功执行
4. ✅ 线上博客能正确显示同步的文章
5. ✅ 中文标题和内容正确显示
6. ✅ 无任何错误或警告日志
7. ✅ 性能指标在规定范围内

## 📞 支持和反馈

如果遇到问题，请:
1. 查看 [诊断报告](./DIAGNOSIS_AND_FIXES.md)
2. 运行诊断工具：`node diagnose.js`
3. 检查日志和错误消息
4. 参考 [故障排除指南](./NOTION_INTEGRATION.md#️-故障排除)
