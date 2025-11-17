const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class NotionSync {
  constructor() {
    this.notion = new Client({ auth: process.env.NOTION_TOKEN });
    this.databaseId = process.env.NOTION_DATABASE_ID;
    this.postsDir = process.env.POSTS_DIR || 'source/_posts';
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
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Status',
          select: {
            equals: 'Published'
          }
        },
        sorts: [
          {
            property: 'Published Date',
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
    
    // Extract title
    const title = properties.Title?.title?.[0]?.plain_text || 'Untitled';
    
    // Extract published date
    const publishedDate = properties['Published Date']?.date?.start || new Date().toISOString().split('T')[0];
    
    // Extract tags
    const tags = properties.Tags?.multi_select?.map(tag => tag.name) || [];
    
    // Extract cover image
    const cover = properties.Cover?.files?.[0]?.file?.url || properties.Cover?.files?.[0]?.external?.url || '';
    
    // Extract excerpt
    const excerpt = properties.Excerpt?.rich_text?.[0]?.plain_text || '';
    
    // Get page content
    const content = await this.getPageContent(page.id);
    
    // Generate frontmatter
    const frontmatter = {
      title: title,
      date: publishedDate,
      tags: tags,
      cover: cover,
      excerpt: excerpt
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
      default:
        return '';
    }
  }

  // Convert Notion rich text to Markdown
  richTextToMarkdown(richText) {
    if (!richText || richText.length === 0) return '';
    
    return richText.map(text => {
      let content = text.plain_text;
      
      if (text.annotations.bold) content = `**${content}**`;
      if (text.annotations.italic) content = `*${content}*`;
      if (text.annotations.strikethrough) content = `~~${content}~~`;
      if (text.annotations.underline) content = `<u>${content}</u>`;
      if (text.annotations.code) content = `\`${content}\``;
      
      if (text.href) content = `[${content}](${text.href})`;
      
      return content;
    }).join('');
  }

  // Generate filename from title and date
  generateFilename(title, date) {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    const dateObj = new Date(date);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    return `${dateStr}-${slug}.md`;
  }

  // Save post to file system
  async savePost(post) {
    const filePath = path.join(this.postsDir, post.filename);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.postsDir)) {
      fs.mkdirSync(this.postsDir, { recursive: true });
    }
    
    // Generate file content
    const frontmatterYaml = Object.entries(post.frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
        } else if (typeof value === 'string' && value.includes(':')) {
          return `${key}: "${value}"`;
        } else {
          return `${key}: ${value}`;
        }
      })
      .join('\n');
    
    const fileContent = `---\n${frontmatterYaml}\n---\n\n${post.content}`;
    
    try {
      fs.writeFileSync(filePath, fileContent, 'utf8');
      console.log(`✅ 文章已保存: ${post.filename}`);
      return true;
    } catch (error) {
      console.error(`❌ 保存文章失败 ${post.filename}:`, error.message);
      return false;
    }
  }

  // Sync all posts
  async syncAll() {
    console.log('🚀 开始同步Notion文章...');
    
    const isConnected = await this.testConnection();
    if (!isConnected) {
      return false;
    }
    
    const posts = await this.getPublishedPosts();
    console.log(`📝 找到 ${posts.length} 篇已发布文章`);
    
    let successCount = 0;
    for (const page of posts) {
      try {
        const post = await this.notionToHexoPost(page);
        const saved = await this.savePost(post);
        if (saved) successCount++;
      } catch (error) {
        console.error('同步文章失败:', error.message);
      }
    }
    
    console.log(`✨ 同步完成! 成功同步 ${successCount}/${posts.length} 篇文章`);
    return successCount === posts.length;
  }
}

// CLI interface
async function main() {
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
    await sync.syncAll();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NotionSync;