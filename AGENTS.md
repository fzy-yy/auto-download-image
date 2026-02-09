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
- 下载前确认对话框，显示将要处理的图片数量和列表
- 防止重复处理的状态管理
- 路径安全清理和验证

### 技术栈
- **语言**: TypeScript
- **目标平台**: Obsidian (Desktop only)
- **构建工具**: esbuild
- **包管理器**: npm
- **依赖**: Obsidian API
- **开发工具**: TypeScript ESLint, EditorConfig

## 详细项目结构

```
auto-download-image/
├── .github/
│   └── workflows/
│       └── lint.yml                    # GitHub Actions CI 配置，用于自动化代码检查
├── src/                                # 源代码目录
│   ├── main.ts                         # 插件主类和核心逻辑
│   ├── settings.ts                     # 插件设置管理和设置页面
│   ├── types.ts                        # TypeScript 类型定义
│   ├── confirm-modal.ts                # 确认对话框组件
│   ├── image-detector.ts               # 图片链接检测器
│   ├── image-downloader.ts             # 图片下载器
│   ├── image-saver.ts                  # 图片保存器
│   └── utils.ts                        # 工具函数集合
├── .editorconfig                       # 编辑器配置，统一代码风格
├── .gitignore                          # Git 忽略规则文件
├── .npmrc                              # npm 配置文件
├── esbuild.config.mjs                  # esbuild 构建配置
├── eslint.config.mts                   # ESLint 代码检查配置
├── manifest.json                       # Obsidian 插件清单文件
├── package.json                        # npm 项目配置和依赖管理
├── styles.css                          # 插件样式文件
├── tsconfig.json                       # TypeScript 编译配置
├── version-bump.mjs                    # 版本号自动更新脚本
└── versions.json                       # 版本历史记录文件
```

## 源代码文件详细说明

### 1. types.ts - 类型定义文件

**文件作用**: 定义插件中使用的所有 TypeScript 接口和类型，确保类型安全。

#### 定义的类型和接口

##### ImageLink 接口
- **作用**: 表示笔记中检测到的单个网络图片链接
- **属性**:
  - `url: string` - 图片的完整 URL 地址
  - `startPos: number` - 图片链接在笔记内容中的起始位置（字符偏移量）
  - `endPos: number` - 图片链接在笔记内容中的结束位置（字符偏移量）

##### ProcessingResult 接口
- **作用**: 表示图片处理的结果统计
- **属性**:
  - `successCount: number` - 成功下载的图片数量
  - `failureCount: number` - 下载失败的图片数量

---

### 2. confirm-modal.ts - 确认对话框组件

**文件作用**: 提供一个用户确认对话框，在下载图片前显示将要处理的图片信息。

#### 定义的类

##### ImageDownloadConfirmModal 类
- **继承**: `Modal` (Obsidian 基类)
- **作用**: 创建和管理图片下载确认对话框

##### 类属性
- `private imageLinks: ImageLink[]` - 要处理的图片链接列表
- `private onConfirm: () => void` - 用户点击确认后的回调函数
- `private onCancel: () => void` - 用户取消或关闭对话框时的回调函数
- `private confirmed: boolean` - 标志，表示是否已经确认（默认为 false）

##### 类方法

###### constructor(app, imageLinks, onConfirm, onCancel?)
- **参数**:
  - `app: App` - Obsidian 应用实例
  - `imageLinks: ImageLink[]` - 要处理的图片链接列表
  - `onConfirm: () => void` - 用户点击确认后的回调函数
  - `onCancel?: () => void` - 用户取消时的回调函数（可选）
- **作用**: 初始化确认对话框，保存传入的参数

###### onOpen()
- **返回值**: `void`
- **作用**: 构建对话框的 UI 内容
- **功能**:
  - 创建对话框标题 "确认下载网络图片"
  - 显示将要处理的图片数量
  - 创建可滚动的图片链接列表
  - 创建取消和确认按钮

###### onClose()
- **返回值**: `void`
- **作用**: 清理对话框内容并执行取消回调
- **功能**:
  - 清空对话框内容元素
  - 如果用户未确认，调用取消回调

---

### 3. image-detector.ts - 图片链接检测器

**文件作用**: 从笔记内容中检测网络图片链接。

#### 定义的类

##### ImageDetector 类
- **作用**: 检测 Markdown 格式中的网络图片链接

##### 类方法

###### detectNetworkImages(content)
- **参数**:
  - `content: string` - 笔记的完整文本内容
- **返回值**: `ImageLink[]` - 检测到的所有网络图片链接的数组
- **作用**: 使用正则表达式检测笔记中的所有网络图片链接
- **功能**:
  - 使用正则表达式 `/!\[([^\]]*)?\]\((https?:\/\/[^)]+)\)/g` 匹配图片链接
  - 遍历所有匹配项
  - 提取 URL、起始位置和结束位置
  - 返回 ImageLink 对象数组

##### 方法内部变量
- `results: ImageLink[]` - 存储检测到的图片链接
- `regex: RegExp` - 正则表达式，用于匹配 Markdown 图片语法
- `match: RegExpExecArray | null` - 正则匹配结果

---

### 4. image-downloader.ts - 图片下载器

**文件作用**: 负责从网络下载图片数据。

#### 定义的类

##### ImageDownloader 类
- **作用**: 下载网络图片并获取图片的 MIME 类型

##### 类方法

###### fetchImageData(url)
- **参数**:
  - `url: string` - 要下载的图片 URL 地址
- **返回值**: `Promise<ArrayBuffer>` - 图片的二进制数据
- **作用**: 使用 Obsidian 的 requestUrl API 下载图片
- **功能**:
  - 提取 referer 用于 HTTP 请求头
  - 构建请求头（User-Agent、Accept、Referer 等）
  - 发送 GET 请求下载图片
  - 检查 HTTP 状态码
  - 返回 ArrayBuffer 二进制数据

###### getImageMimeType(url)
- **参数**:
  - `url: string` - 图片的 URL 地址
- **返回值**: `Promise<string>` - 图片的 MIME 类型
- **作用**: 获取图片的 MIME 类型
- **功能**:
  - 使用 HEAD 请求获取响应头
  - 从响应头中提取 Content-Type
  - 如果失败返回空字符串

###### buildRequestHeaders(referer)
- **参数**:
  - `referer: string` - HTTP 请求的 Referer 头
- **返回值**: `Record<string, string>` - 请求头对象
- **作用**: 构建防反爬的 HTTP 请求头
- **功能**:
  - 设置 User-Agent 模拟 Chrome 浏览器
  - 设置 Accept 支持多种图片格式
  - 设置 Accept-Language 支持中文
  - 设置 Referer 告知服务器请求来源

###### extractReferer(url)
- **参数**:
  - `url: string` - 图片的 URL 地址
- **返回值**: `string` - HTTP 请求的 Referer 头
- **作用**: 从 URL 中提取 referer
- **功能**:
  - 尝试使用 URL 构造函数解析 URL
  - 提取 URL 的 origin 作为 referer
  - 如果 URL 不标准，使用字符串分割作为 fallback

---

### 5. image-saver.ts - 图片保存器

**文件作用**: 将下载的图片保存到本地文件系统。

#### 定义的类

##### ImageSaver 类
- **作用**: 将图片数据保存到 Obsidian Vault 中

##### 类属性
- `private vault: Vault` - Obsidian Vault 实例
- `private savePath: string` - 图片保存路径

##### 类方法

###### constructor(vault, savePath)
- **参数**:
  - `vault: Vault` - Obsidian Vault 实例
  - `savePath: string` - 图片保存路径
- **作用**: 初始化图片保存器

###### saveImageToFile(noteFile, arrayBuffer, fileName)
- **参数**:
  - `noteFile: TFile` - 当前笔记文件对象
  - `arrayBuffer: ArrayBuffer` - 图片的二进制数据
  - `fileName: string` - 要保存的文件名
- **返回值**: `Promise<string>` - 图片的相对路径
- **作用**: 保存图片到本地文件
- **功能**:
  - 获取笔记文件所在的目录对象
  - 构建文件夹的完整路径
  - 确保目标文件夹存在
  - 构建图片文件的完整路径
  - 将 ArrayBuffer 转换为 Uint8Array
  - 使用 Vault API 保存二进制文件
  - 返回图片的相对路径

###### ensureFolderExists(folderPath)
- **参数**:
  - `folderPath: string` - 文件夹的完整路径
- **返回值**: `Promise<void>`
- **作用**: 确保文件夹存在，不存在则创建
- **功能**:
  - 检查文件夹是否已存在
  - 如果不存在，创建文件夹
  - 捕获并处理创建失败的情况

---

### 6. utils.ts - 工具函数集合

**文件作用**: 提供各种辅助工具函数。

#### 定义的类

##### ImageUtils 类
- **作用**: 提供静态工具方法

##### 类方法

###### sanitizePath(path)
- **参数**:
  - `path: string` - 要清理的路径
- **返回值**: `string` - 清理后的有效路径
- **作用**: 清理和验证路径，防止路径遍历攻击
- **功能**:
  - 移除路径开头和结尾的空白字符
  - 替换 Windows 系统不允许的字符为下划线
  - 替换连续的斜杠为单个斜杠
  - 移除路径开头的 . 或 ..，防止路径遍历攻击
  - 如果路径为空，使用默认值 "assets"

###### getImageExtension(url, mimeType)
- **参数**:
  - `url: string` - 图片的 URL 地址
  - `mimeType: string` - 图片的 MIME 类型
- **返回值**: `string` - 图片文件的扩展名（如 png、jpg 等）
- **作用**: 获取图片文件的扩展名
- **功能**:
  - 定义支持的图片扩展名列表
  - 首先尝试从 MIME 类型中提取扩展名
  - 如果无法从 MIME 类型获取，尝试从 URL 中提取
  - 如果都无法确定，默认返回 "png" 扩展名
  - 将 "jpeg" 统一转换为 "jpg"

###### generateFileName(ext, namingFormat)
- **参数**:
  - `ext: string` - 图片文件的扩展名
  - `namingFormat: string` - 命名格式字符串
- **返回值**: `string` - 生成的完整文件名（包括扩展名）
- **作用**: 根据用户配置生成文件名
- **功能**:
  - 获取当前时间戳（毫秒）
  - 生成一个 10 位的随机字符串（使用 36 进制）
  - 使用用户配置的命名格式，替换占位符为实际值
  - 替换 {timestamp} 为时间戳
  - 替换 {random} 为随机字符串
  - 清理文件名中的非法字符
  - 返回完整的文件名（基础名称 + 扩展名）

###### delay(ms)
- **参数**:
  - `ms: number` - 延迟的毫秒数
- **返回值**: `Promise<void>` - 一个 Promise 对象，在指定时间后 resolve
- **作用**: 延迟执行的辅助方法
- **功能**:
  - 创建一个 Promise
  - 在指定时间后调用 resolve

###### replaceImageLink(editor, imageLink, localPath)
- **参数**:
  - `editor: Editor` - Obsidian 的编辑器实例
  - `imageLink: ImageLink` - 要替换的图片链接对象
  - `localPath: string` - 本地图片的相对路径
- **返回值**: `void`
- **作用**: 替换单个图片链接
- **功能**:
  - 将字符偏移量转换为编辑器的位置对象（起始位置）
  - 将字符偏移量转换为编辑器的位置对象（结束位置）
  - 使用编辑器的 replaceRange 方法替换网络链接为本地相对路径

---

### 7. settings.ts - 设置管理和设置页面

**文件作用**: 管理插件设置并提供设置页面 UI。

#### 定义的接口和常量

##### AutoDownloadImageSettings 接口
- **作用**: 定义插件设置的数据结构
- **属性**:
  - `imageSavePath: string` - 图片保存路径，相对于笔记所在目录（如 "assets" 或 "images"）
  - `namingFormat: string` - 图片命名格式，支持占位符（如 "{timestamp}" 或 "{random}"）

##### DEFAULT_SETTINGS 常量
- **类型**: `AutoDownloadImageSettings`
- **作用**: 定义默认设置，在用户未配置时使用
- **值**:
  - `imageSavePath: "assets"` - 默认保存到 "assets" 文件夹
  - `namingFormat: "{timestamp}"` - 默认使用时间戳命名

#### 定义的类

##### AutoDownloadImageSettingTab 类
- **继承**: `PluginSettingTab` (Obsidian 基类)
- **作用**: 在 Obsidian 的设置页面中显示和管理插件的配置选项

##### 类属性
- `plugin: AutoDownloadImagePlugin` - 插件实例的引用，用于访问和修改设置

##### 类方法

###### constructor(app, plugin)
- **参数**:
  - `app: App` - Obsidian 应用实例
  - `plugin: AutoDownloadImagePlugin` - 插件实例
- **作用**: 初始化设置选项卡

###### display()
- **返回值**: `void`
- **作用**: 显示设置页面的方法，当用户打开插件设置时调用
- **功能**:
  - 清空容器元素
  - 使用 Setting 组件创建标题
  - 创建图片保存路径设置项
  - 创建图片命名格式设置项
  - 绑定事件处理器，监听设置变更

---

### 8. main.ts - 插件主类

**文件作用**: 插件的核心逻辑，协调各个模块的工作。

#### 定义的类

##### AutoDownloadImagePlugin 类
- **继承**: `Plugin` (Obsidian 基类)
- **作用**: 插件主类，管理插件生命周期和核心功能

##### 类属性
- `settings: AutoDownloadImageSettings` - 插件的设置对象，存储用户配置
- `private imageDetector: ImageDetector` - 图片检测器实例
- `private imageDownloader: ImageDownloader` - 图片下载器实例
- `private imageSaver: ImageSaver` - 图片保存器实例
- `private isProcessing: boolean` - 处理状态标志，防止重复处理（默认为 false）

##### 类方法

###### onload()
- **返回值**: `Promise<void>`
- **作用**: 插件加载时的初始化方法，在插件启用时自动调用
- **功能**:
  - 从磁盘加载用户的设置配置
  - 初始化各个处理器实例
  - 在左侧功能区添加图片图标
  - 注册命令到命令面板
  - 添加设置选项卡到设置页面

###### onunload()
- **返回值**: `void`
- **作用**: 插件卸载时的清理方法，在插件禁用时自动调用
- **功能**: 当前插件无需特殊的清理操作

###### loadSettings()
- **返回值**: `Promise<void>`
- **作用**: 从磁盘加载插件设置
- **功能**:
  - 使用 Object.assign 合并默认设置和用户保存的设置
  - 确保设置对象总是有完整的配置

###### saveSettings()
- **返回值**: `Promise<void>`
- **作用**: 保存插件设置到磁盘
- **功能**: 将当前的设置对象保存到磁盘

###### updateImageSaverPath(newPath)
- **参数**:
  - `newPath: string` - 新的图片保存路径
- **返回值**: `void`
- **作用**: 更新图片保存器路径的公共方法
- **功能**: 重新创建 ImageSaver 实例，使用新的保存路径

###### processCurrentNoteWithConfirmation(editor)
- **参数**:
  - `editor: Editor` - Obsidian 的编辑器实例
- **返回值**: `Promise<void>`
- **作用**: 处理当前笔记中所有网络图片的入口方法（带确认对话框）
- **功能**:
  - 检查是否正在处理中，防止重复处理
  - 获取编辑器中的完整笔记内容
  - 使用图片检测器检测笔记中的所有网络图片链接
  - 如果没有检测到图片，显示通知并返回
  - 获取当前活动文件
  - 如果无法获取当前文件，显示错误通知并返回
  - 创建并显示确认对话框

###### processImageLinks(editor, imageLinks, noteFile)
- **参数**:
  - `editor: Editor` - Obsidian 的编辑器实例
  - `imageLinks: ImageLink[]` - 要处理的图片链接列表
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<void>`
- **作用**: 处理图片链接的核心方法
- **功能**:
  - 设置处理状态为正在处理
  - 显示通知，告知用户开始处理
  - 处理所有图片链接并获取结果
  - 显示处理完成的通知
  - 捕获并记录处理过程中的错误
  - 无论成功或失败，都要重置处理状态

###### downloadAndReplaceImages(editor, imageLinks, noteFile)
- **参数**:
  - `editor: Editor` - Obsidian 的编辑器实例
  - `imageLinks: ImageLink[]` - 要处理的图片链接列表
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<ProcessingResult>` - 处理结果，包含成功和失败的数量
- **作用**: 下载并替换所有图片的方法
- **功能**:
  - 初始化成功和失败的计数器
  - 从后往前遍历所有图片链接，避免前面替换导致后面位置偏移
  - 延迟 1.5 秒，避免频繁请求被反爬机制拦截
  - 下载图片并保存到本地
  - 如果下载成功，替换笔记中的网络链接为本地相对路径
  - 捕获并记录单个图片下载时的错误
  - 返回处理结果

###### downloadAndSaveImage(url, noteFile)
- **参数**:
  - `url: string` - 要下载的图片 URL 地址
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<string | null>` - 成功时返回图片的相对路径，失败时返回 null
- **作用**: 下载网络图片并保存到本地的异步方法
- **功能**:
  - 使用图片下载器获取图片的二进制数据
  - 使用图片下载器获取图片的 MIME 类型
  - 根据图片 URL 和 MIME 类型获取文件扩展名
  - 根据用户配置的命名格式和扩展名生成文件名
  - 使用图片保存器保存图片到本地并返回相对路径
  - 捕获并记录下载或保存过程中的错误

###### downloadImages()
- **返回值**: `void`
- **作用**: 下载图片的入口方法，通过功能区图标调用
- **功能**:
  - 获取当前活动的 Markdown 视图
  - 检查是否成功获取到视图以及编辑器
  - 调用处理当前笔记的方法（带确认对话框）
  - 如果不在 Markdown 视图中，显示提示通知

---

## 核心实现说明

### 图片检测
使用正则表达式 `/!\[([^\]]*)?\]\((https?:\/\/[^)]+)\)/g` 检测 Markdown 中的网络图片链接。

### 下载流程
1. 使用 `requestUrl` API 下载图片
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

### 状态管理
- 使用 `isProcessing` 标志防止重复处理
- 在确认对话框中添加取消回调，确保状态一致性
- 使用 `finally` 块确保无论成功或失败都能重置状态

### 安全措施
- 路径清理：使用 `sanitizePath()` 方法移除非法字符和防止路径遍历
- 文件名清理：移除 Windows 系统不允许的字符
- 文件名冲突：使用 10 位随机字符串大幅降低冲突概率

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

3. **生产构建**
   ```bash
   npm run build
   ```

4. **运行 Lint 检查**
   ```bash
   npm run lint
   ```

5. **版本升级**
   ```bash
   npm run version
   ```

### 在 Obsidian 中测试

1. 将构建后的文件复制到 Obsidian 的插件目录
2. 在 Obsidian 设置中启用插件
3. 使用命令面板或功能区图标下载图片

## 开发约定

### 代码风格
- 使用 **Tab** 缩进，缩进大小为 4
- 严格遵循 TypeScript 严格模式
- 使用 ES6+ 语法
- 所有异步操作使用 `async/await`

### 命名约定
- 类名：PascalCase
- 方法名：camelCase
- 私有方法：使用 `private` 关键字
- 常量：UPPER_SNAKE_CASE
- 接口：PascalCase

### 错误处理
- 所有异步操作必须包含 try-catch
- 使用 `Notice` 向用户显示重要信息
- 使用 `console.error` 记录错误详情

## 已知问题和注意事项

1. **桌面端专用**: 此插件仅支持桌面版 Obsidian
2. **URL 兼容性**: 对于非标准 URL，代码使用了 fallback 机制
3. **文件名清理**: 自动清理文件名中的非法字符
4. **文件夹创建**: 如果文件夹创建失败，会抛出错误并中断处理
5. **大文件处理**: 对于大尺寸图片，下载可能需要较长时间

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