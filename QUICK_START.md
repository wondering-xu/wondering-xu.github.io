# Notion 同步系统 - 快速开始指南

本指南帮助你快速启动和运行 Notion 到 Hexo 博客的自动同步系统。

## 🚀 5 分钟快速开始

### 步骤 1: 安装依赖 (1 分钟)

```bash
npm ci
```

### 步骤 2: 配置环境变量 (2 分钟)

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
NOTION_TOKEN=secret_...your_token...
NOTION_DATABASE_ID=your_database_id...
WEBHOOK_SECRET=your_webhook_secret
BLOG_URL=https://your-blog-url.com
```

### 步骤 3: 测试连接 (1 分钟)

```bash
npm run sync-notion -- --test
```

预期输出：
```
✅ Notion连接成功: Your Name
```

### 步骤 4: 首次同步 (1 分钟)

```bash
npm run sync-notion
```

文章将被同步到 `source/_posts/` 目录。

### 步骤 5: 构建网站 (可选)

```bash
npm run clean
npm run build
```

## 📋 获取 Notion Token 和 Database ID

### 1. 获取 NOTION_TOKEN

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击 "Create new integration"
3. 填写名称：`Blog Auto Sync`
4. 点击 "Create integration"
5. 复制 "Internal Integration Token"

### 2. 获取 NOTION_DATABASE_ID

1. 打开你的博客数据库
2. 点击右上角的 "Share"
3. 邀请你的 Integration（与上面创建的同名）
4. 授予编辑权限
5. 从 URL 复制数据库 ID

例如，URL 为：
```
https://www.notion.so/abc123def456?v=xyz789
                      ↑ 这是数据库 ID (去掉横线)
```

## 🎯 常用命令

### 开发和测试

```bash
# 测试 Notion 连接
npm run sync-notion -- --test

# 手动同步一次
npm run sync-notion

# 启动定时同步服务（每 5 分钟）
npm run auto-sync

# 启动 Webhook 服务器（用于实时同步）
npm run webhook
```

### 构建和部署

```bash
# 清理生成的文件
npm run clean

# 构建网站
npm run build

# 启动本地服务器预览
npm run server
```

## 🔍 诊断和调试

### 检查系统配置

```bash
node diagnose.js
```

这会检查：
- 环境变量配置
- 文件完整性
- 依赖安装
- Notion 连接
- 目录权限

### 启用调试模式

```bash
DEBUG=* npm run sync-notion
```

### 查看最近同步的文章

```bash
ls -la source/_posts/ | head -10
cat source/_posts/[最新文件名]
```

## ⚙️ 在 GitHub Actions 中设置

1. 进入仓库设置：Settings > Secrets and variables > Actions
2. 创建以下 secrets：
   - `NOTION_TOKEN`: 你的 Notion token
   - `NOTION_DATABASE_ID`: 你的数据库 ID
   - `WEBHOOK_SECRET`: 自定义的 webhook 密钥（可选）
   - `BLOG_URL`: 你的博客 URL（可选）

3. 工作流会自动：
   - ✅ 在每次 push 时同步
   - ✅ 每 30 分钟自动同步一次
   - ✅ 支持手动触发（Actions > Run workflow）

## 🗄️ Notion 数据库配置

创建或编辑你的 Notion 数据库，确保包含以下列：

| 列名 | 类型 | 说明 |
|------|------|------|
| Title / 标题 | Title | 文章标题（必需）|
| Status / 状态 | Select | Published / 已发布（必需） |
| Published Date / 发布日期 | Date | 发布日期（必需）|
| Tags / 标签 | Multi-select | 文章标签（可选）|
| Cover / 封面图 | Files | 封面图片（可选）|
| Excerpt / 摘要 | Text | 文章摘要（可选）|
| Category / 分类 | Select | 文章分类（可选）|

## 📝 Notion 中的写作流程

1. **创建新页面**
   - 点击数据库中的 "+ Add a page"
   - 或创建新的数据库项目

2. **填写元数据**
   - Title: 输入文章标题
   - Status: 选择 "Published" 或 "已发布"
   - Published Date: 选择发布日期
   - Tags: 选择标签（可选）
   - Cover: 上传封面图（可选）
   - Excerpt: 输入摘要（可选）
   - Category: 选择分类（可选）

3. **编写内容**
   - 在页面中编写文章
   - 支持的格式：标题、段落、列表、代码块、图片、引用、分割线等

4. **发布**
   - 确保 Status 设置为 "Published" 或 "已发布"
   - 系统会自动同步

## 🐛 常见问题

### Q: 文章没有同步？
A: 检查以下几点：
- [ ] NOTION_TOKEN 和 NOTION_DATABASE_ID 是否正确
- [ ] Integration 是否有数据库访问权限
- [ ] 文章状态是否为 "Published" 或 "已发布"
- [ ] 运行诊断工具：`node diagnose.js`

### Q: 文件名乱码？
A: 如果看到像 `2025-01-24-.md` 的文件名，说明标题处理有问题。
- 确保 Notion 标题不为空
- 重新同步：`npm run sync-notion`

### Q: 内容格式错误？
A: 检查生成的 Markdown 文件：
```bash
cat source/_posts/[文件名]
```
- 确保 Front Matter 在 `---` 之间
- 日期格式应该是 `YYYY-MM-DD`
- 标签应该在方括号中

### Q: 工作流失败？
A: 查看 GitHub Actions 日志：
- 进入 Actions > Notion Auto Sync and Deploy
- 找到失败的运行
- 查看详细日志找出错误原因

## 🔗 相关文档

- [完整诊断和修复报告](./DIAGNOSIS_AND_FIXES.md)
- [Notion 集成完整指南](./NOTION_INTEGRATION.md)
- [部署指南](./DEPLOYMENT.md)
- [测试验证计划](./TEST_VERIFICATION_PLAN.md)

## 💡 高级用法

### 自定义同步间隔

编辑 `.env`：
```env
SYNC_INTERVAL_MINUTES=10  # 改为 10 分钟
```

### 自定义文章目录

编辑 `.env`：
```env
POSTS_DIR=source/blog  # 改为其他目录
```

### 本地定时同步

```bash
npm run auto-sync
```

这会在后台运行，每 5 分钟同步一次。按 Ctrl+C 停止。

### 使用 Webhook 实时同步

```bash
npm run webhook
```

然后在 Notion Integration 设置中添加 Webhook URL：
```
https://your-domain.com/webhook
或本地测试：
http://localhost:3000/webhook
```

## ✅ 验收标准

系统工作正常的标志：

1. ✅ `npm run sync-notion -- --test` 显示连接成功
2. ✅ `npm run sync-notion` 同步文章无错误
3. ✅ `source/_posts/` 目录中有新生成的 `.md` 文件
4. ✅ 文件包含正确的 Front Matter
5. ✅ 中文标题被正确保留
6. ✅ `npm run build` 构建成功
7. ✅ 网站包含新同步的文章

## 🎉 下一步

- [ ] 创建 Notion Integration
- [ ] 创建或配置博客数据库
- [ ] 配置 GitHub Secrets
- [ ] 运行诊断测试
- [ ] 手动同步一篇文章
- [ ] 在 GitHub Actions 中手动运行
- [ ] 验证文章在线上显示
- [ ] 编写更多文章！

## 📞 需要帮助？

如果遇到问题：
1. 查看 [故障排除](./NOTION_INTEGRATION.md#️-故障排除) 部分
2. 运行诊断工具：`node diagnose.js`
3. 查看工作流日志（GitHub Actions）
4. 启用调试模式：`DEBUG=* npm run sync-notion`

祝你使用愉快！ 🚀
