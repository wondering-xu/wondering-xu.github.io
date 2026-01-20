# Notion Flow 集成部署指南

本文档说明如何将Notion Flow集成部署到生产环境。

## 🚀 部署选项

### 1. GitHub Actions 自动部署（推荐）

#### 1.1 配置 Secrets

在GitHub仓库设置中添加以下Secrets：

```
NOTION_TOKEN=secret_YourNotionToken
NOTION_DATABASE_ID=YourDatabaseId
WEBHOOK_SECRET=your-webhook-secret
BLOG_URL=https://yourdomain.com
DEPLOY_HOST=your-server.com  # 可选
DEPLOY_USER=username         # 可选
DEPLOY_PATH=/path/to/deploy   # 可选
```

#### 1.2 工作流程

工作流程会自动：
- 每30分钟同步一次Notion文章
- 推送代码时触发同步
- 手动触发同步
- 构建并部署到GitHub Pages

#### 1.3 启用GitHub Pages

1. 在仓库设置中找到"Pages"
2. 选择"GitHub Actions"作为部署源
3. 保存设置

### 2. 服务器部署

#### 2.1 服务器准备

```bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2进程管理器
sudo npm install -g pm2

# 克隆仓库
git clone <your-repo-url>
cd your-repo

# 安装依赖
npm install
```

#### 2.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

#### 2.3 启动服务

```bash
# 测试配置
npm run test-integration

# 启动完整服务
./setup-notion.sh
```

#### 2.4 使用PM2管理进程

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'notion-auto-sync',
      script: 'scripts/notion-auto-sync.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'notion-webhook',
      script: 'scripts/notion-webhook.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

启动进程：

```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all
```

### 3. Docker 部署

#### 3.1 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "run", "webhook"]
```

#### 3.2 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  notion-sync:
    build: .
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./public:/usr/share/nginx/html
    depends_on:
      - notion-sync
    restart: unless-stopped
```

#### 3.3 部署命令

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔧 配置说明

### 环境变量详解

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `NOTION_TOKEN` | ✅ | Notion API Token | `secret_*` |
| `NOTION_DATABASE_ID` | ✅ | Notion数据库ID | `12345678-1234-1234-1234-123456789012` |
| `WEBHOOK_SECRET` | ✅ | Webhook签名密钥 | `your-secret-key` |
| `WEBHOOK_PORT` | ❌ | Webhook服务器端口 | `3000` |
| `SYNC_INTERVAL_MINUTES` | ❌ | 自动同步间隔（分钟） | `5` |
| `BLOG_URL` | ❌ | 博客URL | `https://yourdomain.com` |
| `POSTS_DIR` | ❌ | 文章保存目录 | `source/_posts` |

### Notion数据库结构

必需的属性：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `Title` | Title | 文章标题 |
| `Status` | Select | 文章状态（Draft/Published） |
| `Published Date` | Date | 发布日期 |

可选的属性：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `Tags` | Multi-select | 文章标签 |
| `Cover` | Files | 封面图片 |
| `Excerpt` | Rich text | 文章摘要 |

## 📊 监控和日志

### 1. 日志配置

```bash
# 创建日志目录
mkdir -p logs

# 配置日志轮转
sudo nano /etc/logrotate.d/notion-sync
```

内容：

```
/path/to/your-repo/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
}
```

### 2. 监控脚本

创建 `scripts/health-check.js`:

```javascript
const NotionSync = require('./notion-sync');
const fs = require('fs');

async function healthCheck() {
  const timestamp = new Date().toISOString();
  
  try {
    const sync = new NotionSync();
    await sync.testConnection();
    
    const status = {
      status: 'healthy',
      timestamp: timestamp,
      message: 'Notion连接正常'
    };
    
    fs.writeFileSync('logs/health.json', JSON.stringify(status, null, 2));
    console.log('✅ 健康检查通过');
  } catch (error) {
    const status = {
      status: 'unhealthy',
      timestamp: timestamp,
      error: error.message
    };
    
    fs.writeFileSync('logs/health.json', JSON.stringify(status, null, 2));
    console.error('❌ 健康检查失败:', error.message);
  }
}

if (require.main === module) {
  healthCheck();
}

module.exports = healthCheck;
```

添加到crontab：

```bash
# 每5分钟检查一次
*/5 * * * * cd /path/to/your-repo && npm run health-check
```

## 🔒 安全配置

### 1. 防火墙设置

```bash
# 只允许必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. SSL证书

使用Let's Encrypt：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 备份策略

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/notion-sync"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份代码和配置
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=public \
    --exclude=.git \
    .

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_DIR/backup_$DATE.tar.gz"
```

## 🚨 故障排除

### 常见问题

1. **同步失败**
   - 检查Notion Token是否过期
   - 确认数据库权限
   - 查看错误日志

2. **构建失败**
   - 检查Hexo配置
   - 确认依赖安装完整
   - 清理缓存：`npm run clean`

3. **部署失败**
   - 检查服务器连接
   - 确认文件权限
   - 查看部署日志

### 调试模式

```bash
# 启用详细日志
DEBUG=* npm run sync-notion

# 查看PM2日志
pm2 logs notion-auto-sync --lines 100

# 检查服务状态
systemctl status nginx
```

## 📞 支持

如果遇到问题：

1. 查看 [NOTION_INTEGRATION.md](./NOTION_INTEGRATION.md)
2. 运行测试脚本：`./test-notion-integration.sh`
3. 检查日志文件：`logs/`
4. 提交Issue到仓库