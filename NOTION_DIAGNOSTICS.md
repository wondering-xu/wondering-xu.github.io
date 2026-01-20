# Notion API 连接诊断指南

## 概述

此诊断工具用于测试和验证 Notion API 连接是否正常工作。它会检查以下内容：

1. ✓ NOTION_TOKEN 是否有效
2. ✓ NOTION_DATABASE_ID 是否正确
3. ✓ 是否能成功连接到 Notion API
4. ✓ 是否能查询到指定数据库
5. ✓ 数据库中有多少条记录
6. ✓ 所有字段的确切名称和类型
7. ✓ 所有记录的状态值

## 文件说明

### 1. `scripts/test-notion.js`

**目的**: 本地运行的 Notion 连接测试脚本

**功能**:
- 验证环境变量设置
- 初始化 Notion 客户端
- 测试 API 连接
- 查询数据库信息
- 分析字段结构
- 列出所有记录

**用法**:

```bash
# 确保已安装依赖
npm install

# 设置环境变量
export NOTION_TOKEN="your_token_here"
export NOTION_DATABASE_ID="your_db_id_here"

# 运行诊断
npm run test-notion

# 或直接运行
node scripts/test-notion.js
```

**输出**:
- 环境变量检查
- Notion API 连接状态
- 数据库信息
- 字段列表和类型
- 所有记录摘要
- 状态分布统计

### 2. `.github/workflows/test-notion.yml`

**目的**: GitHub Actions 工作流，用于在 CI/CD 环境中运行诊断

**触发方式**:
- 手动触发 (workflow_dispatch)
- 推送到 `test-notion-connection-diagnostics` 分支

**使用方法**:

1. 登录 GitHub
2. 前往你的仓库
3. 点击 "Actions" 标签
4. 在左侧选择 "Test Notion Connection"
5. 点击 "Run workflow" 按钮
6. 选择分支（确保选择 `test-notion-connection-diagnostics`）
7. 点击绿色的 "Run workflow" 按钮

**查看结果**:
1. 工作流运行后，点击对应的工作流实例
2. 点击 "test" 任务
3. 展开以下步骤查看详细输出：
   - "Test Notion Connection" - 主诊断输出
   - "Check GitHub Secrets" - Secrets 检查结果

## 诊断步骤

### Step 1: 验证本地环境

```bash
cd /home/engine/project

# 检查 .env 文件
cat .env

# 确保有以下内容:
# NOTION_TOKEN=...
# NOTION_DATABASE_ID=...
```

### Step 2: 运行本地诊断

```bash
# 如果有 .env 文件，直接运行
npm run test-notion

# 或者临时设置环境变量
NOTION_TOKEN="your_token" NOTION_DATABASE_ID="your_db_id" npm run test-notion
```

### Step 3: 在 GitHub Actions 中运行

1. 确保 `NOTION_TOKEN` 和 `NOTION_DATABASE_ID` 已添加到 GitHub Secrets
2. 推送代码到 `test-notion-connection-diagnostics` 分支
3. 或在 GitHub Actions 中手动触发工作流

### Step 4: 分析输出结果

诊断工具会输出以下信息：

```
==========================================================
🔍 Notion API 连接诊断工具
==========================================================

📋 第一步: 检查环境变量
----------------------------------------------------------
✓ NOTION_TOKEN 已设置 (长度: 48 字符)
  前缀: secret_...
✓ NOTION_DATABASE_ID 已设置: abcd1234...

📋 第二步: 初始化 Notion 客户端
----------------------------------------------------------
✓ Notion 客户端已初始化

📋 第三步: 测试基本连接 (查询用户信息)
----------------------------------------------------------
✓ 成功连接到 Notion API
  用户类型: bot
  用户 ID: abc-def-ghi

📋 第四步: 查询数据库信息
----------------------------------------------------------
✓ 成功连接到数据库
  数据库标题: My Blog
  数据库创建时间: 2024-01-01T00:00:00.000Z

📋 第五步: 数据库字段结构
----------------------------------------------------------
字段列表:
  - Title
    类型: title
  - Content
    类型: rich_text
  - Status
    类型: status
    状态选项: Draft, Published, Archived
  - Date
    类型: date

... (更多输出)
```

## 常见问题排查

### ❌ NOTION_TOKEN 未设置

**原因**:
- .env 文件不存在或不包含该变量
- GitHub Secrets 未配置

**解决方案**:
1. 创建 .env 文件：`cp .env.example .env`
2. 从 Notion 获取 API 密钥
3. 添加到 .env: `NOTION_TOKEN=secret_...`
4. 在 GitHub 添加 Secret

### ❌ NOTION_DATABASE_ID 未设置

**原因**:
- 数据库 ID 未配置
- ID 格式不正确

**解决方案**:
1. 在 Notion 中打开数据库
2. 复制 URL 中的 database ID
3. 添加到 .env: `NOTION_DATABASE_ID=abc123...`

### ❌ 认证错误 (unauthorized)

**原因**:
- NOTION_TOKEN 无效或已过期
- Token 没有数据库访问权限

**解决方案**:
1. 重新创建 Notion API 集成
2. 生成新的 API Token
3. 为集成添加数据库访问权限
4. 更新 .env 和 GitHub Secrets

### ❌ 数据库未找到 (not_found)

**原因**:
- NOTION_DATABASE_ID 不正确
- 集成没有访问该数据库的权限

**解决方案**:
1. 验证数据库 ID 的正确性
2. 在 Notion 中确认集成有访问权限
3. 重新获取正确的数据库 ID

### ❌ 网络错误 (ENOTFOUND)

**原因**:
- 网络连接问题
- DNS 解析失败

**解决方案**:
1. 检查网络连接
2. 检查防火墙设置
3. 尝试 ping notion.so 验证连接

## 获取精准的字段信息

诊断工具会输出所有字段的精准信息。当修复同步脚本时，使用以下信息：

### 字段名称
从 "数据库字段结构" 部分获取确切的字段名称，例如：
- `Title` (不是 `标题`)
- `Published Status` (不是 `Status`)
- `Article Date` (不是 `Date`)

### 字段类型
确认字段的确切类型：
- `title` - 标题字段
- `rich_text` - 富文本字段
- `select` - 单选字段
- `status` - 状态字段
- `date` - 日期字段
- `checkbox` - 复选框字段
- `multi_select` - 多选字段

### 状态值
从 "所有记录摘要" 部分找到确切的状态值，例如：
- `Published` (不是 `已发布`)
- `Draft` (不是 `草稿`)
- `Ready to Publish` (不是 `待发布`)

## 后续步骤

根据诊断结果，可能需要：

1. **更新同步脚本** (`scripts/notion-sync.js`)
   - 使用正确的字段名称
   - 调整状态过滤条件

2. **修复工作流** (`.github/workflows/notion-sync.yml`)
   - 确保环境变量正确传递
   - 验证密钥配置

3. **更新文档**
   - 记录确切的字段名称
   - 更新状态值信息

## 相关文档

- [NOTION_INTEGRATION.md](./NOTION_INTEGRATION.md) - Notion 集成完整指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南
- [QUICK_START.md](./QUICK_START.md) - 快速开始指南
- [DIAGNOSIS_AND_FIXES.md](./DIAGNOSIS_AND_FIXES.md) - 诊断和修复报告

## 需要帮助？

如果诊断工具无法帮助解决问题，请检查以下内容：

1. Notion API Token 的有效性
2. 数据库 ID 的正确性
3. 网络连接
4. 防火墙和代理设置
5. GitHub Actions 的日志输出

诊断工具会提供详细的错误信息，帮助定位具体问题所在。
