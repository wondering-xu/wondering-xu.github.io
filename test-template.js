const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// 模拟Hexo的page和config对象
const mockConfig = {
  title: '废土世界',
  author: '废废',
  language: 'zh-CN'
};

const mockPage = {
  title: 'Hello World',
  background: '/assets/img/bg-post.webp',
  content: '<p>Test content</p>',
  path: '/2025/08/05/hello-world/'
};

// 测试layout模板
const layoutPath = path.join(__dirname, 'themes/wasteland/layout/layout.ejs');
const layoutTemplate = fs.readFileSync(layoutPath, 'utf8');

// 设置EJS变量
const page = mockPage;
const config = mockConfig;
const body = '<div class="row"><div class="col-12 pt-lg-3 mb-4 px-4 portfolio-content">Test content</div></div>';

try {
  const renderedHtml = ejs.render(layoutTemplate, { page, config, body });
  console.log('Template rendering successful!');
  console.log('First 500 characters:');
  console.log(renderedHtml.substring(0, 500));
} catch (error) {
  console.error('Template rendering failed:', error);
}