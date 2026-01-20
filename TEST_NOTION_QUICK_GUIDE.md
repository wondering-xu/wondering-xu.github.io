# Notion 连接诊断快速指南

## 🚀 快速开始

### 在 GitHub Actions 中运行诊断（推荐）

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 在左侧找到 **"Test Notion Connection"** 工作流
4. 点击 **"Run workflow"** 按钮
5. 选择分支：`test-notion-connection-diagnostics`
6. 点击绿色的 **"Run workflow"** 按钮
7. 等待工作流完成（通常 1-2 分钟）
8. 查看详细的诊断输出

### 在本地运行诊断

```bash
# 1. 导航到项目目录
cd /home/engine/project

# 2. 安装依赖（如果未安装）
npm install

# 3. 确保 .env 文件包含必要的配置
# .env 应包含：
# NOTION_TOKEN=your_token_here
# NOTION_DATABASE_ID=your_db_id_here

# 4. 运行诊断
npm run test-notion
```

## 📊 诊断工具输出

诊断工具会按以下顺序输出信息：

### ✅ 通过诊断的迹象

```
✓ NOTION_TOKEN 已设置 (长度: 48 字符)
✓ NOTION_DATABASE_ID 已设置: abc123...
✓ Notion 客户端已初始化
✓ 成功连接到 Notion API
✓ 成功连接到数据库
✓ 数据库包含 5 条记录
```

### ❌ 诊断失败的迹象

| 错误信息 | 原因 | 解决方案 |
|---------|------|--------|
| `NOTION_TOKEN 未设置` | 环境变量缺失 | 在 .env 中添加 NOTION_TOKEN |
| `NOTION_DATABASE_ID 未设置` | 环境变量缺失 | 在 .env 中添加 NOTION_DATABASE_ID |
| `unauthorized` | Token 无效 | 重新创建 Notion API 集成 |
| `not_found` | 数据库 ID 错误 | 验证数据库 ID 的正确性 |
| `ENOTFOUND` | 网络连接问题 | 检查网络连接 |

## 🔍 从诊断输出中提取关键信息

### 1. 数据库字段名称

查找 **"数据库字段结构"** 部分：

```
字段列表:
  - Title              ← 字段名称
    类型: title
  - Description        ← 字段名称
    类型: rich_text
  - Status             ← 字段名称
    类型: status
    状态选项: Draft, Published, Archived
```

**注意**: 使用这些确切的字段名称在代码中，不要使用中文翻译。

### 2. 状态值

查找 **"记录状态分析"** 部分：

```
状态分布:
  - Draft: 2 条
  - Published: 3 条
  - Archived: 1 条
```

**注意**: 这些是确切的状态值，在代码中过滤状态时应使用这些值。

### 3. 记录数量

查找 **"查询数据库中的记录"** 部分：

```
✓ 成功查询数据库
  共找到 6 条记录
```

## 🛠️ 常见修复

### 如果诊断显示 NOTION_TOKEN 未设置

```bash
# 1. 检查 .env 文件是否存在
ls -la .env

# 2. 如果不存在，复制示例文件
cp .env.example .env

# 3. 编辑 .env 文件，添加你的 token
nano .env

# 添加以下内容：
# NOTION_TOKEN=secret_your_token_here
# NOTION_DATABASE_ID=your_database_id_here
```

### 如果诊断显示认证错误

```bash
# 1. 验证 token 的格式
echo $NOTION_TOKEN
# 应该看起来像：secret_abc123...

# 2. 在 Notion 中检查集成设置
# 访问 https://www.notion.so/my-integrations
# 确认集成被启用和连接

# 3. 重新创建 token 并更新 .env
```

### 如果诊断显示数据库不存在

```bash
# 1. 验证数据库 ID
echo $NOTION_DATABASE_ID

# 2. 在 Notion 中打开你的博客数据库
# 从 URL 中复制数据库 ID（格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）

# 3. 确保集成有访问该数据库的权限
# 在数据库中，邀请你的集成（用户）

# 4. 更新 .env 中的数据库 ID
```

## 📝 诊断清单

使用以下清单确保诊断完整：

- [ ] 环境变量已检查 (NOTION_TOKEN, NOTION_DATABASE_ID)
- [ ] Notion 客户端已成功初始化
- [ ] API 连接已测试
- [ ] 数据库已成功连接
- [ ] 字段名称已记录
- [ ] 状态值已记录
- [ ] 记录数量已确认

## 📚 相关文件

- `scripts/test-notion.js` - 诊断脚本
- `.github/workflows/test-notion.yml` - GitHub Actions 工作流
- `NOTION_DIAGNOSTICS.md` - 完整诊断指南
- `NOTION_INTEGRATION.md` - Notion 集成指南
- `.env.example` - 环境变量示例

## 💡 提示

1. **定期运行诊断** - 在修改配置或遇到问题时运行诊断
2. **保存输出** - 将诊断输出保存到文件，便于对比和参考
3. **检查日志** - GitHub Actions 日志包含完整的执行细节
4. **验证集成** - 定期检查 Notion 集成是否仍然有效

## 🆘 需要帮助？

如果诊断无法帮助解决问题：

1. 检查 GitHub Actions 的完整日志
2. 确认网络连接正常
3. 验证 Notion API Token 的有效性
4. 查阅 [Notion API 官方文档](https://developers.notion.com/)
5. 检查 `NOTION_DIAGNOSTICS.md` 中的详细故障排查指南
