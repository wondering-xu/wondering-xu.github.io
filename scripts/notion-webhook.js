const express = require('express');
const crypto = require('crypto');
const NotionAutoSync = require('./notion-auto-sync');
require('dotenv').config();

class NotionWebhook {
  constructor() {
    this.app = express();
    this.port = process.env.WEBHOOK_PORT || 3000;
    this.secret = process.env.WEBHOOK_SECRET || 'default-secret';
    this.autoSync = new NotionAutoSync();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Webhook verification middleware
    this.app.use((req, res, next) => {
      const signature = req.headers['x-notion-signature'] || req.headers['x-webhook-signature'];
      
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }
      
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(body)
        .digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Main webhook endpoint
    this.app.post('/webhook', async (req, res) => {
      try {
        console.log('📥 收到Notion webhook:', req.body);
        
        // Handle different webhook events
        const event = req.body;
        
        if (this.shouldTriggerSync(event)) {
          console.log('🔄 触发自动同步...');
          
          // Run sync asynchronously
          this.autoSync.syncAndBuild().catch(error => {
            console.error('❌ 同步失败:', error.message);
          });
          
          res.json({ 
            message: 'Sync triggered successfully',
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('⏭️ 跳过同步 - 无相关变更');
          res.json({ 
            message: 'No sync needed',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Webhook处理失败:', error.message);
        res.status(500).json({ 
          error: 'Internal server error',
          message: error.message 
        });
      }
    });

    // Manual trigger endpoint
    this.app.post('/sync', async (req, res) => {
      try {
        console.log('🔄 手动触发同步...');
        await this.autoSync.syncAndBuild();
        
        res.json({ 
          message: 'Manual sync completed successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ 手动同步失败:', error.message);
        res.status(500).json({ 
          error: 'Sync failed',
          message: error.message 
        });
      }
    });
  }

  shouldTriggerSync(event) {
    // Check if the event is related to our database
    if (event.database && event.database.id !== process.env.NOTION_DATABASE_ID) {
      return false;
    }
    
    // Trigger on page changes
    if (event.type === 'page_updated' || event.type === 'page_created') {
      return true;
    }
    
    // Trigger on database changes
    if (event.type === 'database_updated') {
      return true;
    }
    
    return false;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Notion Webhook服务器启动成功`);
      console.log(`📍 端口: ${this.port}`);
      console.log(`🔗 Webhook地址: http://localhost:${this.port}/webhook`);
      console.log(`❤️ 健康检查: http://localhost:${this.port}/health`);
      console.log(`🔄 手动同步: http://localhost:${this.port}/sync`);
    });
  }
}

// CLI interface
async function main() {
  const webhook = new NotionWebhook();
  
  if (process.argv.includes('--help')) {
    console.log(`
使用方法:
  node notion-webhook.js [选项]

选项:
  --help     显示帮助信息

环境变量:
  WEBHOOK_PORT          服务器端口 (默认: 3000)
  WEBHOOK_SECRET        Webhook签名密钥
  NOTION_DATABASE_ID    Notion数据库ID
    `);
    return;
  }
  
  webhook.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NotionWebhook;