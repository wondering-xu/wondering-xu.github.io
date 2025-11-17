#!/bin/bash

# Notion Flow 自动发布脚本
# 用于设置和启动Notion自动发布系统

set -e

echo "🚀 Notion Flow 自动发布系统设置"
echo "================================"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 需要安装Node.js"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 需要安装npm"
    exit 1
fi

echo "✅ Node.js和npm已安装"

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  环境变量文件不存在，创建模板..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件并配置以下变量："
    echo "   - NOTION_TOKEN: Notion API token"
    echo "   - NOTION_DATABASE_ID: Notion数据库ID"
    echo "   - WEBHOOK_SECRET: Webhook签名密钥"
    echo ""
    echo "📖 详细说明请查看: NOTION_INTEGRATION.md"
    echo ""
    read -p "按Enter键继续..."
fi

# 测试Notion连接
echo "🔗 测试Notion连接..."
if npm run sync-notion -- --test; then
    echo "✅ Notion连接成功"
else
    echo "❌ Notion连接失败，请检查配置"
    exit 1
fi

# 选择运行模式
echo ""
echo "请选择运行模式："
echo "1) 手动同步一次"
echo "2) 启动定时自动同步"
echo "3) 启动Webhook服务器"
echo "4) 全部启动（推荐）"
echo ""
read -p "请输入选择 (1-4): " choice

case $choice in
    1)
        echo "🔄 执行手动同步..."
        npm run sync-notion
        ;;
    2)
        echo "⏰ 启动定时同步..."
        npm run auto-sync
        ;;
    3)
        echo "🌐 启动Webhook服务器..."
        npm run webhook
        ;;
    4)
        echo "🚀 启动完整系统..."
        
        # 启动定时同步（后台）
        echo "⏰ 启动定时同步（后台）..."
        npm run auto-sync &
        SYNC_PID=$!
        
        # 启动Webhook服务器（后台）
        echo "🌐 启动Webhook服务器（后台）..."
        npm run webhook &
        WEBHOOK_PID=$!
        
        # 执行一次初始同步
        echo "🔄 执行初始同步..."
        npm run sync-notion
        
        echo ""
        echo "✅ 系统启动完成！"
        echo "定时同步进程ID: $SYNC_PID"
        echo "Webhook服务器进程ID: $WEBHOOK_PID"
        echo ""
        echo "使用 'kill $SYNC_PID $WEBHOOK_PID' 停止服务"
        echo "或使用 Ctrl+C 停止当前脚本"
        
        # 等待用户中断
        trap 'echo "🛑 停止所有服务..."; kill $SYNC_PID $WEBHOOK_PID 2>/dev/null; exit 0' INT
        wait
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 设置完成！"