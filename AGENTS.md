# Auto Download Image - Obsidian Plugin

## 项目概述

这是一个用于 Obsidian 笔记应用的插件，主要功能是自动检测笔记中的网络图片链接，将这些图片下载到本地文件夹中，并使用相对路径替换原来的网络链接。

### 主要功能
- 自动检测 Markdown 笔记中的网络图片链接（支持 `![](http://...)` 和 `![](https://...)` 格式）
- 下载网络图片到本地（使用防反爬请求头）
- 支持自定义图片保存路径（默认为 `assets` 文件夹）
- 支持自定义图片命名格式（支持 `{timestamp}` 和 `{random}` 占位符）
- 自动创建目标文件夹（如果不存在）
- 下载间隔控制（每张图片间隔 1.5 秒）
- 完善的错误处理和用户提示

### 技术栈
- **语言**: TypeScript
- **目标平台**: Obsidian (Desktop only)
- **构建工具**: esbuild
- **包管理器**: npm
- **依赖**: Obsidian API
- **开发工具**: TypeScript ESLint, EditorConfig

## 项目结构

```
auto-download-image/
├── .github/
│   └── workflows/
│       └── lint.yml          # GitHub Actions CI 配置
├── src/
│   ├── main.ts               # 插件主逻辑
│   └── settings.ts           # 设置页面和配置接口
├── .editorconfig             # 编辑器配置
├── .gitignore                # Git 忽略规则
├── .npmrc                    # npm 配置
├── esbuild.config.mjs        # esbuild 构建配置
├── eslint.config.mts         # ESLint 配置
├── manifest.json             # Obsidian 插件清单
├── package.json              # npm 项目配置
├── tsconfig.json             # TypeScript 编译配置
├── version-bump.mjs          # 版本号自动更新脚本
└── versions.json             # 版本历史记录
```

## 构建和运行

### 前置要求
- Node.js (建议使用 LTS 版本)
- npm

### 开发流程

1. **安装依赖**
   ```bash
   npm install
   ```

2. **开发模式（监听文件变化自动构建）**
   ```bash
   npm run dev
   ```
   这个命令会启动 esbuild 的 watch 模式，文件变化时自动重新构建。

3. **生产构建**
   ```bash
   npm run build
   ```
   这个命令会执行 TypeScript 类型检查，然后使用 esbuild 进行压缩构建。

4. **运行 Lint 检查**
   ```bash
   npm run lint
   ```
   使用 ESLint 检查代码规范。

5. **版本升级**
   ```bash
   npm run version
   ```
   这个命令会自动升级版本号，并更新 `manifest.json` 和 `versions.json`。

### 在 Obsidian 中测试

1. 将构建后的 `main.js`、`manifest.json`、`styles.css` 等文件复制到 Obsidian 的插件目录：
   ```
   <你的 Obsidian 库>/.obsidian/plugins/auto-download-image/
   ```

2. 在 Obsidian 设置中启用插件。

3. 使用方式：
   - **命令面板**: `Ctrl/Cmd + P` → 搜索 "Download and replace network images"
   - **功能区图标**: 点击左侧功能区中的图片图标
   - **设置页面**: 在插件设置中自定义保存路径和命名格式

## 开发约定

### 代码风格
- 使用 **Tab** 缩进，缩进大小为 4（参考 `.editorconfig`）
- 严格遵循 TypeScript 严格模式（参考 `tsconfig.json`）
- 使用 ES6+ 语法
- 所有异步操作使用 `async/await`

### TypeScript 配置
- `strictNullChecks`: 启用严格空值检查
- `noImplicitAny`: 禁止隐式 any 类型
- `noUncheckedIndexedAccess`: 索引访问需要进行空值检查
- `target`: ES6
- `module`: ESNext

### 命名约定
- 类名：PascalCase（如 `AutoDownloadImagePlugin`）
- 方法名：camelCase（如 `processCurrentNote`）
- 私有方法：使用 `private` 关键字
- 常量：UPPER_SNAKE_CASE（如 `DEFAULT_SETTINGS`）
- 接口：PascalCase（如 `MyPluginSettings`）

### Git 工作流
- 主分支：`main` 或 `master`
- 提交前必须通过 `npm run lint` 检查
- 使用 `npm run version` 管理版本号

### 错误处理
- 所有异步操作必须包含 try-catch
- 使用 `Notice` 向用户显示重要信息
- 使用 `console.error` 记录错误详情

### 文件操作
- 使用 Obsidian Vault API（`this.app.vault`）进行文件操作
- 相对路径使用 `/` 作为分隔符
- 检查文件夹是否存在后再创建

## 核心实现说明

### 图片检测
使用正则表达式 `/!\[([^\]]*)?\]\((https?:\/\/[^\)]+)\)/g` 检测 Markdown 中的网络图片链接。

### 下载流程
1. 使用 `fetch` API 下载图片
2. 设置防反爬请求头（User-Agent、Accept、Referer 等）
3. 从响应中获取图片二进制数据
4. 根据 URL 或 MIME 类型确定文件扩展名
5. 根据命名格式生成文件名
6. 在笔记所在目录下创建目标文件夹（如 `assets`）
7. 保存图片文件

### 替换策略
- **从后往前处理**：为了避免前面替换导致后面的位置偏移，采用从后往前的顺序处理图片链接
- 使用 `editor.offsetToPos()` 将偏移量转换为编辑器位置
- 使用 `editor.replaceRange()` 替换原始链接

### 防反爬措施
- User-Agent: 模拟 Chrome 浏览器
- Accept: 支持多种图片格式
- Accept-Language: 中文支持
- Referer: 动态设置来源域名
- 下载间隔：每张图片间隔 1.5 秒

## 已知问题和注意事项

1. **桌面端专用**: 此插件仅支持桌面版 Obsidian，不支持移动端。

2. **URL 兼容性**: 对于非标准 URL，代码使用了 fallback 机制提取 referer，但可能仍有边缘情况。

3. **文件名清理**: 自动清理文件名中的非法字符（`<>:"/\|?*`），但可能仍有其他操作系统的限制字符。

4. **文件夹创建**: 如果文件夹创建失败（如权限问题），会抛出错误并中断处理。

5. **大文件处理**: 对于大尺寸图片，下载可能需要较长时间。

## 扩展建议

1. **批量处理**: 支持一次性处理多个笔记文件
2. **重试机制**: 下载失败时支持自动重试
3. **进度显示**: 显示下载进度条
4. **自定义请求头**: 允许用户在设置中配置自定义请求头
5. **图片压缩**: 下载后自动压缩图片以节省空间
6. **元数据保留**: 保留图片的 EXIF 信息
7. **URL 白名单/黑名单**: 支持只处理特定域名的图片

## 维护者

- 作者: fzy-yy
- GitHub: https://github.com/fzy-yy
- 许可证: MIT

## 贡献指南

欢迎提交 Issue 和 Pull Request。在提交代码前，请确保：

1. 代码通过 `npm run lint` 检查
2. 添加适当的类型注解
3. 包含必要的错误处理
4. 遵循现有的代码风格和命名约定
5. 在 commit message 中清晰描述变更内容