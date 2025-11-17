# Notion Flow 集成测试

这个目录包含用于测试Notion集成的示例和工具。

## 测试步骤

### 1. 测试Notion连接
```bash
npm run sync-notion -- --test
```

### 2. 创建测试文章
在Notion数据库中创建一篇测试文章，包含：
- 标题: "Notion集成测试文章"
- 状态: "Published"
- 发布日期: 今天
- 标签: ["测试", "Notion"]
- 内容: 一些示例内容

### 3. 同步测试
```bash
npm run sync-notion
```

### 4. 检查结果
查看 `source/_posts/` 目录中是否生成了对应的Markdown文件。

### 5. 构建测试
```bash
npm run clean && npm run build
```

### 6. 本地预览
```bash
npm run server
```
访问 http://localhost:4000 查看文章是否正确显示。

## 自动化测试脚本

```bash
# 运行完整测试流程
./test-notion-integration.sh
```