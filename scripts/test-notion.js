const { Client } = require('@notionhq/client');
require('dotenv').config();

async function testConnection() {
  console.log('='.repeat(60));
  console.log('🔍 Notion API 连接诊断工具');
  console.log('='.repeat(60));
  console.log();

  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  // Step 1: 检查环境变量
  console.log('📋 第一步: 检查环境变量');
  console.log('-'.repeat(60));
  
  if (token) {
    console.log(`✓ NOTION_TOKEN 已设置 (长度: ${token.length} 字符)`);
    console.log(`  前缀: ${token.substring(0, 10)}...`);
  } else {
    console.log('❌ NOTION_TOKEN 未设置');
  }

  if (dbId) {
    console.log(`✓ NOTION_DATABASE_ID 已设置: ${dbId}`);
  } else {
    console.log('❌ NOTION_DATABASE_ID 未设置');
  }
  console.log();

  if (!token || !dbId) {
    console.error('❌ 错误: 缺少必要的环境变量');
    console.error('请设置 NOTION_TOKEN 和 NOTION_DATABASE_ID');
    process.exit(1);
  }

  try {
    // Step 2: 初始化 Notion 客户端
    console.log('📋 第二步: 初始化 Notion 客户端');
    console.log('-'.repeat(60));
    
    const notion = new Client({ auth: token });
    console.log('✓ Notion 客户端已初始化');
    console.log();

    // Step 3: 测试基本连接
    console.log('📋 第三步: 测试基本连接 (查询用户信息)');
    console.log('-'.repeat(60));
    
    try {
      const user = await notion.users.me();
      console.log(`✓ 成功连接到 Notion API`);
      console.log(`  用户类型: ${user.type}`);
      console.log(`  用户 ID: ${user.id}`);
      console.log();
    } catch (userError) {
      console.warn('⚠ 无法获取用户信息 (这可能是正常的):');
      console.warn(`  ${userError.message}`);
      console.log();
    }

    // Step 4: 查询数据库信息
    console.log('📋 第四步: 查询数据库信息');
    console.log('-'.repeat(60));
    
    try {
      const database = await notion.databases.retrieve({ database_id: dbId });
      console.log(`✓ 成功连接到数据库`);
      console.log(`  数据库标题: ${database.title.map(t => t.plain_text).join('')}`);
      console.log(`  数据库创建时间: ${database.created_time}`);
      console.log();

      // 列出所有字段名称和类型
      console.log('📋 第五步: 数据库字段结构');
      console.log('-'.repeat(60));
      console.log('字段列表:');
      Object.entries(database.properties).forEach(([name, prop]) => {
        console.log(`  - ${name}`);
        console.log(`    类型: ${prop.type}`);
        if (prop.type === 'select' && prop.select && prop.select.options) {
          console.log(`    选项: ${prop.select.options.map(o => o.name).join(', ')}`);
        }
        if (prop.type === 'status' && prop.status && prop.status.options) {
          console.log(`    状态选项: ${prop.status.options.map(o => o.name).join(', ')}`);
        }
      });
      console.log();
    } catch (dbError) {
      console.error('❌ 无法连接到数据库:');
      console.error(`  错误: ${dbError.message}`);
      process.exit(1);
    }

    // Step 6: 查询数据库中的页面
    console.log('📋 第六步: 查询数据库中的记录');
    console.log('-'.repeat(60));
    
    const allPages = await notion.databases.query({
      database_id: dbId,
      page_size: 100
    });

    console.log(`✓ 成功查询数据库`);
    console.log(`  共找到 ${allPages.results.length} 条记录`);
    console.log();

    if (allPages.results.length === 0) {
      console.log('⚠ 数据库中没有任何记录');
      console.log();
    } else {
      // Step 7: 分析第一条记录的字段
      console.log('📋 第七步: 第一条记录的详细信息');
      console.log('-'.repeat(60));
      
      const firstPage = allPages.results[0];
      console.log('字段名称和值:');
      
      Object.entries(firstPage.properties).forEach(([name, prop]) => {
        console.log(`\n  ${name}:`);
        console.log(`    类型: ${prop.type}`);
        
        // 根据类型提取值
        let value = null;
        switch (prop.type) {
          case 'title':
            value = prop.title.map(t => t.plain_text).join('');
            break;
          case 'rich_text':
            value = prop.rich_text.map(t => t.plain_text).join('');
            break;
          case 'select':
            value = prop.select ? prop.select.name : null;
            break;
          case 'status':
            value = prop.status ? prop.status.name : null;
            break;
          case 'date':
            value = prop.date ? prop.date.start : null;
            break;
          case 'checkbox':
            value = prop.checkbox;
            break;
          case 'multi_select':
            value = prop.multi_select.map(s => s.name).join(', ');
            break;
          default:
            value = JSON.stringify(prop).substring(0, 100);
        }
        
        console.log(`    值: ${value}`);
      });
      console.log();

      // Step 8: 列出所有记录的摘要
      console.log('📋 第八步: 所有记录摘要');
      console.log('-'.repeat(60));
      console.log('记录列表:');
      
      allPages.results.forEach((page, index) => {
        const props = page.properties;
        let titleText = '未命名';
        let statusText = '';
        
        // 查找标题字段
        Object.entries(props).forEach(([name, prop]) => {
          if (prop.type === 'title' && prop.title.length > 0) {
            titleText = prop.title.map(t => t.plain_text).join('');
          }
          if (prop.type === 'status' && prop.status) {
            statusText = ` [${prop.status.name}]`;
          }
          if (prop.type === 'select' && prop.select) {
            statusText = ` [${prop.select.name}]`;
          }
        });
        
        console.log(`  ${index + 1}. ${titleText}${statusText}`);
      });
      console.log();

      // Step 9: 统计状态分布
      console.log('📋 第九步: 记录状态分析');
      console.log('-'.repeat(60));
      
      const statusMap = {};
      allPages.results.forEach(page => {
        Object.values(page.properties).forEach(prop => {
          if (prop.type === 'status' && prop.status) {
            const status = prop.status.name;
            statusMap[status] = (statusMap[status] || 0) + 1;
          }
          if (prop.type === 'select' && prop.select) {
            const status = prop.select.name;
            statusMap[status] = (statusMap[status] || 0) + 1;
          }
        });
      });

      if (Object.keys(statusMap).length > 0) {
        console.log('状态分布:');
        Object.entries(statusMap).forEach(([status, count]) => {
          console.log(`  - ${status}: ${count} 条`);
        });
      } else {
        console.log('⚠ 未找到状态字段信息');
      }
      console.log();
    }

    // Step 10: 总结
    console.log('📋 诊断结果总结');
    console.log('='.repeat(60));
    console.log('✅ Notion API 连接成功！');
    console.log(`✅ 数据库包含 ${allPages.results.length} 条记录`);
    console.log('✅ 所有诊断信息已收集');
    console.log();
    console.log('💡 建议:');
    console.log('  1. 检查上面的字段名称, 确保在代码中使用了正确的名称');
    console.log('  2. 检查状态值, 确保状态过滤逻辑正确');
    console.log('  3. 如果需要调整同步脚本, 请参考字段名称和类型信息');
    console.log();

  } catch (error) {
    console.error('❌ 诊断失败');
    console.error('='.repeat(60));
    console.error(`错误类型: ${error.name}`);
    console.error(`错误信息: ${error.message}`);
    console.error();
    
    if (error.status) {
      console.error(`HTTP 状态码: ${error.status}`);
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('⚠ 网络错误: 无法连接到 Notion API');
      console.error('  检查网络连接是否正常');
    } else if (error.message.includes('unauthorized')) {
      console.error('⚠ 认证错误: NOTION_TOKEN 可能无效');
      console.error('  请检查 NOTION_TOKEN 的有效性');
    } else if (error.message.includes('not_found')) {
      console.error('⚠ 数据库未找到: NOTION_DATABASE_ID 可能不正确');
      console.error('  请检查 NOTION_DATABASE_ID 的正确性');
    }
    
    console.error();
    console.error('完整错误堆栈:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
