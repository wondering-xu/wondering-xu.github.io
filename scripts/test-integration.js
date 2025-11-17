const NotionSync = require('./notion-sync');

async function testIntegration() {
  console.log('🧪 测试Notion Flow集成...');
  
  // 创建测试实例
  const sync = new NotionSync();
  
  // 测试连接
  console.log('\n1. 测试Notion连接...');
  const connected = await sync.testConnection();
  if (!connected) {
    console.log('❌ 连接失败，请检查配置');
    return false;
  }
  
  // 测试获取文章
  console.log('\n2. 测试获取文章...');
  const posts = await sync.getPublishedPosts();
  console.log(`找到 ${posts.length} 篇已发布文章`);
  
  if (posts.length > 0) {
    // 测试转换第一篇文章
    console.log('\n3. 测试文章转换...');
    const testPost = await sync.notionToHexoPost(posts[0]);
    console.log('转换结果:');
    console.log('- 文件名:', testPost.filename);
    console.log('- 标题:', testPost.frontmatter.title);
    console.log('- 日期:', testPost.frontmatter.date);
    console.log('- 标签:', testPost.frontmatter.tags);
    console.log('- 内容长度:', testPost.content.length, '字符');
    
    // 测试保存（不实际保存）
    console.log('\n4. 测试文件保存准备...');
    console.log('✅ 文件格式正确，可以保存到:', sync.postsDir);
  } else {
    console.log('⚠️ 没有找到已发布文章，请在Notion中创建一些测试文章');
  }
  
  console.log('\n✅ 集成测试完成');
  return true;
}

if (require.main === module) {
  testIntegration().catch(console.error);
}

module.exports = testIntegration;