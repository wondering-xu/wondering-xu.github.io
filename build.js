#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { marked } = require('marked');

// 配置
const config = {
  title: '废土世界',
  author: '废废',
  language: 'zh-CN',
  url: 'https://wasteland.world'
};

// 主题路径
const themePath = path.join(__dirname, 'themes/wasteland');

// 读取布局模板
function loadTemplate(templateName) {
  const templateFile = path.join(themePath, 'layout', templateName + '.ejs');
  if (fs.existsSync(templateFile)) {
    return fs.readFileSync(templateFile, 'utf8');
  }
  return null;
}

// 渲染页面
function renderPage(templateName, page, body = '') {
  const template = loadTemplate(templateName);
  if (!template) {
    console.error(`Template ${templateName} not found`);
    return '';
  }

  return ejs.render(template, { 
    config, 
    page, 
    body,
    // Helper functions
    is_home: () => page.__index || (page.type === 'index' && !page.category && !page.tag),
    is_post: () => page.type === 'post' || page.layout === 'post',
    is_page: () => page.type === 'page' || page.layout === 'page',
    is_archive: () => page.type === 'archive' || page.layout === 'archive' || page.__archive,
    is_photos: () => page.path && page.path.indexOf('/photos/') === 0,
    is_guestbook: () => page.path && page.path.indexOf('/guestbook/') === 0,
    is_about: () => page.path && page.path.indexOf('/about/') === 0,
    is_search: () => page.path && page.path.indexOf('/search/') === 0,
    url_for: (p) => p
  });
}

// 读取markdown文件
function loadMarkdown(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (frontMatterMatch) {
    const frontMatter = frontMatterMatch[1];
    const markdownContent = frontMatterMatch[2];
    
    // 简单解析front matter
    const metadata = {};
    frontMatter.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        metadata[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return {
      ...metadata,
      content: marked(markdownContent)
    };
  }
  
  return {
    content: marked(content)
  };
}

// 创建输出目录
const outputDir = path.join(__dirname, 'public');
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// 复制静态资源
function copyStaticFiles() {
  const staticSource = path.join(themePath, 'source');
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
  
  if (fs.existsSync(staticSource)) {
    copyDir(staticSource, outputDir);
  }
}

// 生成首页
console.log('Generating homepage...');
const postsDir = path.join(__dirname, 'source/_posts');
const posts = [];

if (fs.existsSync(postsDir)) {
  const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  postFiles.forEach(file => {
    const postData = loadMarkdown(path.join(postsDir, file));
    if (postData) {
      posts.push({
        ...postData,
        path: file.replace('.md', '/'),
        title: postData.title || file.replace('.md', '')
      });
    }
  });
}

const homepageData = {
  title: '',
  path: '/',
  __index: true,
  posts: posts.sort((a, b) => new Date(b.date) - new Date(a.date))
};

// 首先渲染index内容
const indexContent = ejs.render(loadTemplate('index'), { 
  config, 
  page: homepageData,
  url_for: (p) => p
});

// 然后渲染完整页面
const homepageHtml = renderPage('layout', homepageData, indexContent);
fs.writeFileSync(path.join(outputDir, 'index.html'), homepageHtml);

// 生成文章页面
console.log('Generating posts...');
posts.forEach(post => {
  const postPageData = {
    ...post,
    type: 'post',
    layout: 'post'
  };
  
  const postBody = renderPage('post', postPageData, post.content);
  const postHtml = renderPage('layout', postPageData, postBody);
  
  const postDir = path.join(outputDir, post.path);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, 'index.html'), postHtml);
});

// 生成其他页面
const pages = [
  { path: 'about/index.md', title: 'about 废废', background: '/assets/img/bg-about.webp' },
  { path: 'photos/index.md', title: '摄影集', background: '/assets/img/bg-photos.webp' },
  { path: 'guestbook/index.md', title: '留言墙', background: '/assets/img/bg-guestbook.webp' },
  { path: 'search/index.md', title: '站内搜索', background: '/assets/img/bg-search.webp' },
  { path: 'archives/index.md', title: '归档', background: '/assets/img/bg-archives.webp', layout: 'archive' }
];

console.log('Generating pages...');
pages.forEach(pageConfig => {
  const pageData = loadMarkdown(path.join(__dirname, 'source', pageConfig.path));
  if (pageData) {
    const pageInfo = {
      ...pageData,
      ...pageConfig,
      type: 'page',
      layout: pageConfig.layout || 'page',
      path: '/' + pageConfig.path.replace('/index.md', '/')
    };
    
    const pageBody = renderPage(pageInfo.layout || 'page', pageInfo, pageData.content);
    const pageHtml = renderPage('layout', pageInfo, pageBody);
    
    const pageDir = path.join(outputDir, pageInfo.path);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml);
  }
});

// 复制静态文件
console.log('Copying static files...');
copyStaticFiles();

console.log('Site generated successfully in public/ directory!');