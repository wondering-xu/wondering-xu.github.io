# 快速开始 - Notion 连接诊断

## 🎯 30 秒快速上手

### 选项 1️⃣: 在 GitHub Actions 中运行（推荐）

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 左侧选择 **Test Notion Connection**
4. 点击 **Run workflow** → 选择分支 → 点击绿色按钮
5. 等待完成，查看输出

### 选项 2️⃣: 在本地运行

```bash
cd /home/engine/project

# 确保环境变量已设置
export NOTION_TOKEN="your_token"
export NOTION_DATABASE_ID="your_db_id"

# 运行诊断
npm run test-notion
```

## 📋 输出快速解读

### ✅ 看到这些说明连接正常
```
✓ NOTION_TOKEN 已设置
✓ Notion 客户端已初始化
✓ 成功连接到 Notion API
✓ 成功连接到数据库
```

### ❌ 看到这些需要修复
| 错误 | 原因 | 解决 |
|-----|------|-----|
| `NOTION_TOKEN 未设置` | 环境变量缺失 | 添加 NOTION_TOKEN 到 .env |
| `unauthorized` | Token 无效 | 重新创建 Notion API Token |
| `not_found` | 数据库 ID 错误 | 验证 NOTION_DATABASE_ID |

## 🔑 必要的信息

诊断工具会输出：

1. **字段名称** - 从"数据库字段结构"部分获取
2. **状态值** - 从"记录状态分析"部分获取
3. **记录数** - 从"查询数据库中的记录"部分获取

## 📚 详细指南

- 完整说明：[NOTION_DIAGNOSTICS.md](./NOTION_DIAGNOSTICS.md)
- 快速参考：[TEST_NOTION_QUICK_GUIDE.md](./TEST_NOTION_QUICK_GUIDE.md)
- 工具总结：[DIAGNOSTIC_TOOLS_SUMMARY.md](./DIAGNOSTIC_TOOLS_SUMMARY.md)

## 💡 常见问题

**Q: 我在哪里可以找到 NOTION_TOKEN？**
A: 访问 https://www.notion.so/my-integrations 创建集成并复制 token

**Q: 我在哪里可以找到 NOTION_DATABASE_ID？**
A: 在 Notion 中打开博客数据库，从 URL 复制 ID（格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）

**Q: 诊断运行失败了怎么办？**
A: 查看错误信息，按照上表选择对应的解决方案，或阅读详细指南

**Q: 我可以多次运行诊断吗？**
A: 可以，诊断工具是非破坏性的，只读取信息不修改数据

## 🚀 后续步骤

1. ✅ 运行诊断工具
2. ✅ 确认 Notion 连接正常
3. ✅ 记录字段名称和状态值
4. ✅ 根据需要修复同步脚本
5. ✅ 验证修复效果

---

**需要帮助？** 查看 [TEST_NOTION_QUICK_GUIDE.md](./TEST_NOTION_QUICK_GUIDE.md) 的完整故障排查指南
