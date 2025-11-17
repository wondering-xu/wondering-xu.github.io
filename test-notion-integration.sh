#!/bin/bash

# Notion Flow 集成测试脚本

set -e

echo "🧪 Notion Flow 集成测试"
echo "======================"

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请先运行: ./setup-notion.sh"
    exit 1
fi

echo "✅ 环境变量文件存在"

# 测试1: Notion连接
echo ""
echo "📡 测试1: Notion连接测试"
echo "------------------------"
if npm run sync-notion -- --test; then
    echo "✅ 通过: Notion连接成功"
else
    echo "❌ 失败: Notion连接失败"
    exit 1
fi

# 测试2: 同步文章
echo ""
echo "📝 测试2: 文章同步测试"
echo "----------------------"
echo "确保Notion数据库中有状态为'Published'的文章..."
read -p "按Enter键继续..."

if npm run sync-notion; then
    echo "✅ 通过: 文章同步成功"
else
    echo "❌ 失败: 文章同步失败"
    exit 1
fi

# 测试3: 检查生成的文件
echo ""
echo "📁 测试3: 文件生成检查"
echo "----------------------"
POST_COUNT=$(find source/_posts -name "*.md" -type f | wc -l)
if [ $POST_COUNT -gt 0 ]; then
    echo "✅ 通过: 找到 $POST_COUNT 篇文章"
    
    # 显示最新文件
    LATEST_FILE=$(find source/_posts -name "*.md" -type f -exec ls -lt {} + | head -n 1 | awk '{print $NF}')
    echo "最新文章: $LATEST_FILE"
    
    # 显示文件内容预览
    echo "内容预览:"
    head -n 10 "$LATEST_FILE"
    echo "..."
else
    echo "❌ 失败: 没有找到文章文件"
    exit 1
fi

# 测试4: 网站构建
echo ""
echo "🔨 测试4: 网站构建测试"
echo "----------------------"
if npm run clean && npm run build; then
    echo "✅ 通过: 网站构建成功"
else
    echo "❌ 失败: 网站构建失败"
    exit 1
fi

# 测试5: 检查输出
echo ""
echo "🌐 测试5: 输出文件检查"
echo "----------------------"
if [ -d "public" ] && [ "$(find public -name "*.html" -type f | wc -l)" -gt 0 ]; then
    echo "✅ 通过: 静态文件生成成功"
    HTML_COUNT=$(find public -name "*.html" -type f | wc -l)
    echo "生成了 $HTML_COUNT 个HTML文件"
else
    echo "❌ 失败: 静态文件生成失败"
    exit 1
fi

# 测试6: 本地服务器启动（可选）
echo ""
echo "🚀 测试6: 本地服务器测试"
echo "----------------------"
read -p "是否启动本地服务器进行预览测试? (y/N): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    echo "启动本地服务器..."
    echo "访问 http://localhost:4000 查看网站"
    echo "按 Ctrl+C 停止服务器"
    npm run server
fi

echo ""
echo "🎉 所有测试通过！"
echo "=================="
echo "Notion Flow 集成工作正常"
echo ""
echo "下一步:"
echo "1. 在Notion中创建新文章"
echo "2. 设置状态为'Published'"
echo "3. 运行 'npm run sync-notion' 同步"
echo "4. 或启动自动同步: 'npm run auto-sync'"