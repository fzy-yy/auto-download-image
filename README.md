# Auto Download Image

[![CI/CD](https://github.com/fzy-yy/auto-download-image/workflows/CI/CD/badge.svg)](https://github.com/fzy-yy/auto-download-image/actions)
[![Code Quality Check](https://github.com/fzy-yy/auto-download-image/workflows/Code%20Quality%20Check/badge.svg)](https://github.com/fzy-yy/auto-download-image/actions)
[![License](https://img.shields.io/github/license/fzy-yy/auto-download-image)](LICENSE)

一个用于 Obsidian 的插件，自动检测笔记中的网络图片，下载到本地并使用自定义格式重命名，然后替换为本地相对路径。

## ✨ 功能特性

- 🔍 **自动检测**：自动识别 Markdown 格式的网络图片链接 `![](https://...)` 和 `![](http://...)`
- 📥 **批量下载**：一键下载所有网络图片到本地
- 📁 **灵活的保存位置**：
  - 保存在笔记同级目录下的文件夹（可自定义文件夹名）
  - 保存在库根目录下的指定文件夹
  - 与 Obsidian 附件文件夹保持一致
- 🏷️ **自定义命名**：支持占位符重命名图片（`{notename}`, `{date}`, `{time}`）
- 🔗 **路径类型选择**：支持绝对路径和相对路径（便于笔记库迁移）
- 🛡️ **防反爬机制**：设置请求头，避免被网站拦截
- ⏱️ **下载间隔**：每张图片设置下载间隔，避免频繁请求
- 🌍 **多语言支持**：根据 Obsidian 语言设置自动切换中文/英文界面
- ✅ **完善的错误处理**：详细的错误日志和用户友好的提示

## 📦 安装方法

1. 访问 [Releases 页面](https://github.com/fzy-yy/auto-download-image/releases)
2. 下载最新版本的 `main.js`、`manifest.json` 和 `styles.css` 文件
3. 将文件复制到 Obsidian 的插件目录：
   - Windows: `C:\Users\你的用户名\.obsidian\plugins\auto-download-image\`
   - macOS: `~/.obsidian/plugins/auto-download-image/`
   - Linux: `~/.obsidian/plugins/auto-download-image/`
4. 在 Obsidian 设置中启用插件

## 🚀 使用方法

### 基本使用

1. **通过功能区图标**
   - 点击左侧功能区的图片图标
   - 在确认对话框中查看将要处理的图片列表
   - 点击"确认"开始下载

2. **通过命令面板**
   - 按 `Ctrl/Cmd + P` 打开命令面板
   - 输入 "Download and replace network images"
   - 选择命令并执行

### 使用示例

在笔记中插入网络图片：

```markdown
![示例图片](https://webImage.png)
```

点击下载后，图片会被下载到本地并替换为：

```markdown
![](assets/notename_2026-02-10_14-30-45.png)
```

## ⚙️ 配置选项

在 Obsidian 设置中找到 "Auto download image" 选项卡进行配置：

### 1. 图片保存位置

选择图片保存的位置：

- **笔记文件夹**：保存在笔记同级目录下的文件夹（可自定义子文件夹名称）
- **库文件夹**：保存在库根目录下的指定文件夹（可自定义文件夹名）
- **Obsidian 附件文件夹**：与 Obsidian 附件设置保持一致

### 2. 图片链接路径类型

选择图片链接的路径类型：

- **绝对路径**：从库根目录开始的完整路径（如 `folder/image.png`）
- **相对路径**：从笔记位置开始的相对路径（如 `../folder/image.png`），便于笔记库迁移

### 3. 图片命名格式

自定义图片的命名格式，支持以下占位符：

- `{notename}` - 笔记名称（不含扩展名）
- `{date}` - 日期（YYYY-MM-DD 格式）
- `{time}` - 时间（HH-MM-SS 格式）

## ⚠️ 注意事项

- 本插件仅支持桌面版 Obsidian
- 下载大尺寸图片可能需要较长时间
- 某些网站可能有反爬机制，下载可能失败
- 请确保有足够的网络带宽和存储空间

## 📚 常见问题

### Q: 下载失败怎么办？

A: 检查以下几点：

1. 网络连接是否正常
2. 图片链接是否可访问
3. 是否被网站的反爬机制拦截
4. 查看控制台日志了解详细错误信息

### Q: 如何修改保存位置？

A: 在 Obsidian 设置中找到 "Auto download image" 选项卡，修改"图片保存位置"设置即可。

### Q: 支持哪些图片格式？

A: 支持 PNG、JPG、JPEG、GIF、WebP、BMP、SVG 等常见图片格式。

### Q: 如何批量处理多个笔记？

A: 目前需要逐个打开笔记进行处理。未来版本可能会支持批量处理功能。
