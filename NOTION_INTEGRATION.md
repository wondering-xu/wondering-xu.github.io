# Notion Flow 自动发布集成

本集成实现了Notion与Hexo博客的自动同步，让您可以在Notion中写文章并自动发布到线上博客。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
# Notion API配置
NOTION_TOKEN=secret_YourNotionToken
NOTION_DATABASE_ID=YourDatabaseId
NOTION_BLOG_PAGE_ID=YourBlogPageId

# Webhook配置
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_PORT=3000

# 自动同步配置
SYNC_INTERVAL_MINUTES=5

# 博客配置
BLOG_URL=https://wasteland.world
POSTS_DIR=source/_posts
```

### 3. 获取Notion Token和Database ID

#### 3.1 创建Notion Integration

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击"Create new integration"
3. 填写基本信息：
   - Name: "博客自动发布"
   - Type: "Internal"
   - Capabilities: 勾选 "Read content", "Update content"
4. 创建后复制"Internal Integration Token"

#### 3.2 创建博客数据库

1. 在Notion中创建新的数据库页面
2. 配置数据库属性（支持中英文字段名）：
   - **Title** 或 **标题** - Title类型（必需）
   - **Status** 或 **状态** - Select类型，选项：Draft/Published 或 草稿/已发布（必需）
   - **Published Date** 或 **发布日期** - Date类型（必需）
   - **Tags** 或 **标签** - Multi-select类型（可选）
   - **Cover** 或 **封面图** 或 **封面** - Files类型（可选）
   - **Excerpt** 或 **摘要** - Rich text类型（可选）
   - **Category** 或 **分类** - Select类型（可选）

3. 分享数据库给Integration：
   - 点击数据库右上角的"Share"
   - 邀请您的Integration
   - 授予"Can edit"权限

4. 复制数据库ID（从URL中获取）

> 💡 **提示**：字段名支持中英文混用。系统会自动检测并使用正确的字段名。

#### 3.3 配置Webhook（可选）

如果您想要实时同步，可以配置Notion Webhook：

1. 在Integration设置中添加Webhook URL：
   ```
   https://your-domain.com/webhook
   ```
   或本地测试：
   ```
   http://localhost:3000/webhook
   ```

## 📝 使用方法

### 手动同步

```bash
# 测试Notion连接
npm run sync-notion -- --test

# 同步所有已发布文章
npm run sync-notion
```

### 定时自动同步

```bash
# 启动定时同步（每5分钟执行一次）
npm run auto-sync

# 立即执行一次同步
npm run auto-sync -- --once
```

### Webhook服务器

```bash
# 启动Webhook服务器
npm run webhook
```

服务器启动后：
- Webhook地址: http://localhost:3000/webhook
- 健康检查: http://localhost:3000/health
- 手动同步: http://localhost:3000/sync

## 🔧 工作流程

1. **在Notion中写文章**
   - 创建新页面或使用数据库
   - 填写标题、内容、标签等
   - 设置状态为"Published"

2. **自动同步**
   - 系统检测到状态变更
   - 拉取文章内容和元数据
   - 转换为Hexo格式
   - 保存到`source/_posts`目录

3. **自动构建**
   - 清理旧的静态文件
   - 生成新的静态网站
   - 准备部署

## 📄 文章格式

### 在Notion中的文章结构

```markdown
# 标题 (Title属性)
文章内容...

## 小标题
更多内容...

- 列表项1
- 列表项2

> 引用内容

\`\`\`javascript
代码块
\`\`\`
```

### 生成的Hexo文件格式

```markdown
---
title: 文章标题
date: 2025-01-15
tags: ["技术", "博客"]
cover: https://example.com/cover.jpg
excerpt: 文章摘要
category: 技术
---

文章内容...
```

**Front Matter 字段说明**：
- `title`: 文章标题（必需）
- `date`: 发布日期，格式为 YYYY-MM-DD（必需）
- `tags`: 标签列表（可选）
- `cover`: 封面图 URL（可选）
- `excerpt`: 文章摘要（可选）
- `category`: 文章分类（可选）

## 🛠️ 高级配置

### 自定义同步间隔

修改 `.env` 文件中的 `SYNC_INTERVAL_MINUTES`：

```env
SYNC_INTERVAL_MINUTES=10  # 每10分钟同步一次
```

### 自定义文章模板

修改 `scripts/notion-sync.js` 中的 `notionToHexoPost` 方法来自定义文章格式。

### 添加自定义属性

在Notion数据库中添加新属性后，需要在 `notionToHexoPost` 方法中添加相应的处理逻辑。

## 🚨 故障排除

### 常见问题

1. **连接失败**
   - 检查NOTION_TOKEN是否正确
   - 确认Integration有数据库访问权限

2. **文章不同步**
   - 检查文章状态是否为"Published"
   - 确认数据库ID是否正确

3. **格式问题**
   - 检查Notion内容格式
   - 查看转换日志

### 调试模式

```bash
# 查看详细日志
DEBUG=* npm run sync-notion
```

## 📚 API参考

### NotionSync类

- `testConnection()` - 测试Notion连接
- `getPublishedPosts()` - 获取已发布文章
- `notionToHexoPost(page)` - 转换Notion页面为Hexo文章
- `syncAll()` - 同步所有文章

### NotionAutoSync类

- `syncAndBuild()` - 同步并构建网站
- `startScheduler()` - 启动定时任务

### NotionWebhook类

- `start()` - 启动Webhook服务器
- `shouldTriggerSync(event)` - 判断是否需要触发同步

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个集成！

## 📄 许可证

MIT License