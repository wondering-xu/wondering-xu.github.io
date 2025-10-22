# 废土世界静态站点

这是一个使用 Hexo 预渲染输出的静态作品集 / 博客站点。站内摄影集已经按“生活 / 旅行 / 随手拍 / 人像”分类，并针对旅行分类提供了欧洲、日本、新西兰、东南亚与国内五个子分区。

## 摄影集目录结构

所有图片资源统一放在 `assets/photos/` 下，不同分类各自拥有独立文件夹：

```
assets/
└── photos/
    ├── life/
    ├── travel/
    │   ├── europe/
    │   ├── japan/
    │   ├── new-zealand/
    │   ├── se-asia/
    │   └── china/
    ├── snaps/
    └── portraits/
```

> 📌 **提示**：`assets/photos/placeholder.svg` 为示例占位图，上传自己的作品后即可删除相册中的示例条目。

## 上传与维护照片

1. **整理图片尺寸与格式**
   - 推荐导出为 WebP（优先）或高质量 JPG。
   - 根据用途选择 2560 / 1920 / 1600 像素宽度，避免直传相机原图。
   - 可借助 ImageOptim、Squoosh 等工具做无损或有损压缩。

2. **放置到对应目录**
   - 将处理好的图片复制到目标分类目录，例如 `assets/photos/life/`、`assets/photos/travel/japan/` 等。
   - 建议使用命名规则：`YYYY-MM-location-description.webp`，便于回忆与检索。

3. **更新相册页面**
   - 打开对应的 `photos/<category>/index.html` 文件。
   - 在 `<!-- 在此追加图片 ... -->` 注释下复制现有的 `<figure>` 模板。
   - 修改 `href` 与 `src` 指向新增的图片，更新 `alt`、标题与补充说明。
   - 若使用的是旅行相册，请确保在旅行主页面与子页面中同步更新精选内容。

4. **校验展示效果**
   - 浏览器访问 `/photos/` 及对应子页面，确认图片懒加载正常、点击可打开灯箱。
   - 移动端查看是否存在裁切或文字溢出的情况。

## JavaScript 与样式

- `photos/photos.js` 提供轻量灯箱功能（支持键盘 `Esc` 关闭）。
- `css/styles.css` 中新增了相册网格与灯箱样式，覆盖浅色 / 深色模式。

## 后续扩展建议

- 若照片量级增加，可在 `assets/photos/<path>/` 下维护 `index.json`，通过前端脚本动态渲染，便于批量管理。
- 可搭配图像压缩工作流（如使用 Git hooks 或 CI 构建）自动压缩上传的原图。
