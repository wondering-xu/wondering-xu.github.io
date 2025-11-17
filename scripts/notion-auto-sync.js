const cron = require('node-cron');
const NotionSync = require('./notion-sync');
const { execSync } = require('child_process');

class NotionAutoSync {
  constructor() {
    this.sync = new NotionSync();
    this.intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES) || 5;
  }

  // Run sync and rebuild site
  async syncAndBuild() {
    console.log('🔄 开始自动同步...');
    
    try {
      // Sync posts from Notion
      const syncSuccess = await this.sync.syncAll();
      
      if (syncSuccess) {
        console.log('🔨 开始构建网站...');
        
        // Clean and rebuild Hexo site
        try {
          execSync('npm run clean', { stdio: 'inherit' });
          execSync('npm run build', { stdio: 'inherit' });
          console.log('✅ 网站构建完成');
        } catch (buildError) {
          console.error('❌ 网站构建失败:', buildError.message);
        }
      }
    } catch (error) {
      console.error('❌ 自动同步失败:', error.message);
    }
  }

  // Start scheduled sync
  startScheduler() {
    console.log(`⏰ 启动定时同步，每 ${this.intervalMinutes} 分钟执行一次`);
    
    // Schedule to run every N minutes
    const cronExpression = `*/${this.intervalMinutes} * * * *`;
    
    cron.schedule(cronExpression, async () => {
      await this.syncAndBuild();
    });
    
    console.log('✅ 定时同步已启动');
  }

  // Start once
  async startOnce() {
    await this.syncAndBuild();
  }
}

// CLI interface
async function main() {
  const autoSync = new NotionAutoSync();
  
  if (process.argv.includes('--once')) {
    await autoSync.startOnce();
  } else if (process.argv.includes('--help')) {
    console.log(`
使用方法:
  node notion-auto-sync.js [选项]

选项:
  --once     立即执行一次同步然后退出
  --help     显示帮助信息

环境变量:
  SYNC_INTERVAL_MINUTES    同步间隔(分钟) (默认: 5)
    `);
  } else {
    // Start scheduler
    autoSync.startScheduler();
    
    // Keep process running
    console.log('按 Ctrl+C 停止自动同步');
    process.on('SIGINT', () => {
      console.log('\n👋 自动同步已停止');
      process.exit(0);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NotionAutoSync;