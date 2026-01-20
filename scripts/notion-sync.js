const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class NotionSync {
  constructor() {
    this.validateEnv();
    this.notion = new Client({ auth: process.env.NOTION_TOKEN });
    this.databaseId = process.env.NOTION_DATABASE_ID;
    this.postsDir = process.env.POSTS_DIR || 'source/_posts';
  }

  // Validate required environment variables
  validateEnv() {
    const required = ['NOTION_TOKEN', 'NOTION_DATABASE_ID'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      console.error('❌ 缺少必需的环境变量:');
      missing.forEach(env => {
        console.error(`   - ${env}`);
      });
      console.error('\n请在 .env 文件中配置这些变量或设置 GitHub Secrets');
      throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
    }
  }

  // Initialize Notion connection
  async testConnection() {
    try {
      const response = await this.notion.users.me();
      console.log('✅ Notion连接成功:', response.name);
      return true;
    } catch (error) {
      console.error('❌ Notion连接失败:', error.message);
      return false;
    }
  }

  // Get all published posts from Notion database
  async getPublishedPosts() {
    try {
      // Try to get database properties to find the correct property names
      const database = await this.notion.databases.retrieve({
        database_id: this.databaseId
      });
      
      let statusProperty = 'Status';
      let sortProperty = 'Published Date';
      
      // Try to find the actual property names (support both Chinese and English)
      for (const prop of Object.keys(database.properties)) {
        const propType = database.properties[prop].type;
        if (propType === 'select') {
          if (prop === 'Status' || prop === '状态') {
            statusProperty = prop;
          }
        }
        if (propType === 'date') {
          if (prop === 'Published Date' || prop === '发布日期') {
            sortProperty = prop;
          }
        }
      }
      
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          or: [
            {
              property: statusProperty,
              select: {
                equals: 'Published'
              }
            },
            {
              property: statusProperty,
              select: {
                equals: '已发布'
              }
            }
          ]
        },
        sorts: [
          {
            property: sortProperty,
            direction: 'descending'
          }
        ]
      });

      return response.results;
    } catch (error) {
      console.error('获取Notion文章失败:', error.message);
      return [];
    }
  }

  // Convert Notion page to Hexo post format
  async notionToHexoPost(page) {
    const properties = page.properties;
    
    // Try to extract title (support both Chinese and English field names)
    const title = this.getPropertyValue(properties, ['Title', '标题'], 'title') || 'Untitled';
    
    // Try to extract published date (support both Chinese and English field names)
    const publishedDate = this.getPropertyValue(properties, ['Published Date', '发布日期'], 'date') || new Date().toISOString().split('T')[0];
    
    // Try to extract tags (support both Chinese and English field names)
    const tags = this.getPropertyValue(properties, ['Tags', '标签'], 'multi_select') || [];
    
    // Try to extract cover image (support both Chinese and English field names)
    const cover = this.getPropertyValue(properties, ['Cover', '封面图', '封面'], 'files') || '';
    
    // Try to extract excerpt (support both Chinese and English field names)
    const excerpt = this.getPropertyValue(properties, ['Excerpt', '摘要'], 'text') || '';
    
    // Try to extract category (support both Chinese and English field names)
    const category = this.getPropertyValue(properties, ['Category', '分类'], 'select') || '';
    
    // Get page content
    const content = await this.getPageContent(page.id);
    
    // Generate frontmatter
    const frontmatter = {
      title: title,
      date: publishedDate,
      tags: tags,
      cover: cover,
      excerpt: excerpt,
      category: category
    };

    // Remove empty properties
    Object.keys(frontmatter).forEach(key => {
      if (!frontmatter[key] || (Array.isArray(frontmatter[key]) && frontmatter[key].length === 0)) {
        delete frontmatter[key];
      }
    });

    return {
      filename: this.generateFilename(title, publishedDate),
      frontmatter: frontmatter,
      content: content
    };
  }

  // Helper method to get property value with support for multiple field names
  getPropertyValue(properties, fieldNames, type) {
    for (const fieldName of fieldNames) {
      if (!properties[fieldName]) continue;
      
      const prop = properties[fieldName];
      
      switch (type) {
        case 'title':
          return prop.title?.[0]?.plain_text;
        case 'date':
          return prop.date?.start;
        case 'multi_select':
          return prop.multi_select?.map(item => item.name) || [];
        case 'select':
          return prop.select?.name;
        case 'files':
          return prop.files?.[0]?.file?.url || prop.files?.[0]?.external?.url || '';
        case 'text':
          return prop.rich_text?.[0]?.plain_text;
        default:
          return null;
      }
    }
    return null;
  }

  // Get page content as Markdown
  async getPageContent(pageId) {
    try {
      const blocks = await this.notion.blocks.children.list({
        block_id: pageId,
      });

      let content = '';
      for (const block of blocks.results) {
        content += this.blockToMarkdown(block) + '\n\n';
      }

      return content.trim();
    } catch (error) {
      console.error('获取页面内容失败:', error.message);
      return '';
    }
  }

  // Convert Notion block to Markdown
  blockToMarkdown(block) {
    switch (block.type) {
      case 'paragraph':
        return this.richTextToMarkdown(block.paragraph.rich_text);
      case 'heading_1':
        return '# ' + this.richTextToMarkdown(block.heading_1.rich_text);
      case 'heading_2':
        return '## ' + this.richTextToMarkdown(block.heading_2.rich_text);
      case 'heading_3':
        return '### ' + this.richTextToMarkdown(block.heading_3.rich_text);
      case 'bulleted_list_item':
        return '- ' + this.richTextToMarkdown(block.bulleted_list_item.rich_text);
      case 'numbered_list_item':
        return '1. ' + this.richTextToMarkdown(block.numbered_list_item.rich_text);
      case 'quote':
        return '> ' + this.richTextToMarkdown(block.quote.rich_text);
      case 'code':
        return '```' + (block.code.language || '') + '\n' + this.richTextToMarkdown(block.code.rich_text) + '\n```';
      case 'image':
        const imageUrl = block.image.file?.url || block.image.external?.url;
        return `![${block.image.caption?.[0]?.plain_text || ''}](${imageUrl})`;
      case 'divider':
        return '---';
      case 'callout':
        return this.richTextToMarkdown(block.callout.rich_text);
      case 'toggle':
        const toggleText = this.richTextToMarkdown(block.toggle.rich_text);
        return `<details><summary>${toggleText}</summary>\n\n</details>`;
      case 'table':
        return this.tableToMarkdown(block);
      case 'video':
        const videoUrl = block.video.file?.url || block.video.external?.url;
        return `🎥 视频: ${videoUrl}`;
      case 'file':
        const fileUrl = block.file.file?.url || block.file.external?.url;
        const fileName = block.file.name || '文件';
        return `📎 [${fileName}](${fileUrl})`;
      default:
        return '';
    }
  }

  // Convert Notion table to Markdown
  tableToMarkdown(block) {
    // 返回简单的表格占位符，因为 Notion 表格需要特殊处理
    return '| 表格内容 |\n| --- |\n| 请查看原始 Notion 页面以获取完整内容 |\n';
  }

  // Convert Notion rich text to Markdown
  richTextToMarkdown(richText) {
    if (!richText || richText.length === 0) return '';
    
    return richText.map(text => {
      let content = text.plain_text;
      
      if (text.annotations.code) {
        content = `\`${content}\``;
      } else {
        if (text.annotations.bold) content = `**${content}**`;
        if (text.annotations.italic) content = `*${content}*`;
        if (text.annotations.strikethrough) content = `~~${content}~~`;
        if (text.annotations.underline) content = `<u>${content}</u>`;
      }
      
      if (text.href) {
        content = `[${content}](${text.href})`;
      }
      
      return content;
    }).join('');
  }

  // Generate filename from title and date
  generateFilename(title, date) {
    // Convert title to slug: support both Chinese and English
    let slug = title
      .toLowerCase()
      .replace(/[^\w\s-\u4e00-\u9fff]/g, '') // Keep Chinese characters and English alphanumeric
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // If slug is empty or too short, use title hash
    if (!slug || slug.length === 0) {
      slug = 'article-' + Math.random().toString(36).substring(2, 8);
    }
    
    // Limit slug length to avoid too long filenames
    if (slug.length > 50) {
      slug = slug.substring(0, 50).replace(/-+$/, '');
    }
    
    // Parse date correctly
    let dateStr;
    if (typeof date === 'string') {
      // If date is already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        dateStr = date;
      } else {
        // Try to parse as ISO date
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toISOString().split('T')[0];
        } else {
          dateStr = new Date().toISOString().split('T')[0];
        }
      }
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    return `${dateStr}-${slug}.md`;
  }

  // Save post to file system
  async savePost(post) {
    let filePath = path.join(this.postsDir, post.filename);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.postsDir)) {
      fs.mkdirSync(this.postsDir, { recursive: true });
    }
    
    // Handle filename conflicts
    let finalFilename = post.filename;
    let counter = 0;
    while (fs.existsSync(filePath) && counter < 10) {
      counter++;
      const parts = post.filename.split('.');
      const name = parts.slice(0, -1).join('.');
      const ext = parts[parts.length - 1];
      finalFilename = `${name}-${counter}.${ext}`;
      filePath = path.join(this.postsDir, finalFilename);
    }
    
    // Generate file content with proper YAML formatting
    const frontmatterYaml = Object.entries(post.frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
        } else if (typeof value === 'string') {
          // Quote strings that contain special characters, but keep dates unquoted
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return `${key}: ${value}`;
          } else if (value.includes(':') || value.includes('"') || value.includes("'")) {
            return `${key}: "${value.replace(/"/g, '\\"')}"`;
          } else if (value.includes('\n')) {
            return `${key}: |\n${value.split('\n').map(line => '  ' + line).join('\n')}`;
          } else {
            return `${key}: ${value}`;
          }
        } else {
          return `${key}: ${value}`;
        }
      })
      .join('\n');
    
    const fileContent = `---\n${frontmatterYaml}\n---\n\n${post.content}`;
    
    try {
      fs.writeFileSync(filePath, fileContent, 'utf8');
      if (finalFilename !== post.filename) {
        console.log(`✅ 文章已保存: ${finalFilename} (原名冲突，已重命名)`);
      } else {
        console.log(`✅ 文章已保存: ${post.filename}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ 保存文章失败 ${post.filename}:`, error.message);
      return false;
    }
  }

  // Sync all posts
  async syncAll() {
    console.log('🚀 开始同步Notion文章...');
    console.log(`📁 配置的文章目录: ${this.postsDir}`);
    
    const isConnected = await this.testConnection();
    if (!isConnected) {
      console.error('❌ 无法连接到Notion，同步中止');
      return false;
    }
    
    let posts = [];
    try {
      posts = await this.getPublishedPosts();
      console.log(`📝 找到 ${posts.length} 篇已发布文章`);
    } catch (error) {
      console.error('❌ 获取文章失败:', error.message);
      return false;
    }
    
    if (posts.length === 0) {
      console.log('⚠️ 没有找到已发布的文章');
      return true;
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const page of posts) {
      try {
        const post = await this.notionToHexoPost(page);
        const saved = await this.savePost(post);
        if (saved) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error('❌ 同步文章失败:', error.message);
        failureCount++;
      }
    }
    
    console.log(`\n✨ 同步完成!`);
    console.log(`  ✅ 成功: ${successCount} 篇`);
    if (failureCount > 0) {
      console.log(`  ❌ 失败: ${failureCount} 篇`);
    }
    
    return failureCount === 0;
  }
}

// CLI interface
async function main() {
  try {
    const sync = new NotionSync();
    
    if (process.argv.includes('--test')) {
      await sync.testConnection();
    } else if (process.argv.includes('--help')) {
      console.log(`
使用方法:
  node notion-sync.js [选项]

选项:
  --test     测试Notion连接
  --help     显示帮助信息

环境变量:
  NOTION_TOKEN          Notion API token
  NOTION_DATABASE_ID    Notion数据库ID
  POSTS_DIR             文章保存目录 (默认: source/_posts)
      `);
    } else {
      const success = await sync.syncAll();
      if (!success) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('\n❌ 致命错误:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
}

module.exports = NotionSync;