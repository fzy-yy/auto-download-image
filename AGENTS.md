# Auto Download Image - Obsidian Plugin

## 项目概述

这是一个用于 Obsidian 笔记应用的插件，主要功能是自动检测笔记中的网络图片链接，将这些图片下载到本地文件夹中，并使用相对路径替换原来的网络链接。

### 主要功能

- 自动检测 Markdown 笔记中的网络图片链接（支持 `![](http://...)` 和 `![](https://...)` 格式）
- 下载网络图片到本地（使用防反爬请求头）
- 支持三种图片保存位置：
  - 保存在笔记同级目录下的文件夹（可自定义文件夹名）
  - 保存在库根目录下的指定文件夹（可自定义文件夹名）
  - 与 Obsidian 附件文件夹保持一致
- 支持自定义图片命名格式（支持 `{notename}`、`{date}`、`{time}` 占位符）
- 支持绝对路径和相对路径（便于笔记库迁移）
- 自动创建目标文件夹（如果不存在）
- 下载间隔控制（每张图片间隔 1.5 秒）
- 完善的错误处理和用户提示
- 下载前确认对话框，显示将要处理的图片数量和列表
- 防止重复处理的状态管理
- 路径安全清理和验证
- 多语言支持（中文/英文自动切换）
- 输入验证和错误分类

### 技术栈

- **语言**: TypeScript
- **目标平台**: Obsidian (Desktop only)
- **构建工具**: esbuild
- **包管理器**: npm
- **依赖**: Obsidian API
- **开发工具**: TypeScript ESLint, EditorConfig
- **CI/CD**: GitHub Actions

## 详细项目结构

```
auto-download-image/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI/CD 工作流（构建、测试、发布）
│       └── lint.yml                  # 代码质量检查工作流
├── src/                                # 源代码目录
│   ├── main.ts                         # 插件主类和核心逻辑
│   ├── settings.ts                     # 插件设置管理和设置页面
│   ├── types.ts                        # TypeScript 类型定义
│   ├── confirm-modal.ts                # 确认对话框组件
│   ├── image-detector.ts               # 图片链接检测器
│   ├── image-downloader.ts             # 图片下载器
│   ├── path-resolver.ts                # 路径解析器
│   ├── naming-formatter.ts             # 命名格式化器
│   ├── utils.ts                        # 工具函数集合
│   ├── error-handler.ts                # 错误处理器
│   ├── notifier.ts                     # 通知管理器
│   └── validator.ts                    # 输入验证器
├── .editorconfig                       # 编辑器配置，统一代码风格
├── .gitignore                          # Git 忽略规则文件
├── .npmrc                              # npm 配置文件
├── AGENTS.md                           # 项目文档（本文件）
├── README.md                           # 项目说明文档
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

### 5. path-resolver.ts - 路径解析器

**文件作用**: 根据不同的保存位置类型解析图片保存路径。

#### 定义的类

##### PathResolver 类

- **作用**: 解析图片保存路径，确保文件夹存在，计算相对路径

##### 类属性

- `private vault: Vault` - Obsidian Vault 实例
- `private app: App` - Obsidian App 实例
- `private saveLocationType: ImageSaveLocationType` - 图片保存位置类型
- `private noteFolderName: string` - 笔记同级目录下的文件夹名称
- `private vaultFolderName: string` - 库根目录下的文件夹名称
- `private linkPathType: ImageLinkPathType` - 图片链接路径类型

##### 类方法

###### constructor(app, vault, saveLocationType, noteFolderName, vaultFolderName, linkPathType)

- **参数**:
  - `app: App` - Obsidian App 实例
  - `vault: Vault` - Obsidian Vault 实例
  - `saveLocationType: ImageSaveLocationType` - 图片保存位置类型
  - `noteFolderName: string` - 笔记同级目录下的文件夹名称
  - `vaultFolderName: string` - 库根目录下的文件夹名称
  - `linkPathType: ImageLinkPathType` - 图片链接路径类型
- **作用**: 初始化路径解析器

###### resolveFolderPath(noteFile)

- **参数**:
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<string>` - 图片保存的文件夹路径
- **作用**: 根据保存位置类型解析文件夹路径
- **功能**:
  - 根据配置选择不同的解析方式
  - 支持三种保存位置类型
  - 返回文件夹路径

###### resolveNoteFolderPath(noteFile)

- **参数**:
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<string>` - 文件夹路径
- **作用**: 解析笔记同级目录下的文件夹路径
- **功能**:
  - 获取笔记文件所在目录
  - 构建文件夹路径
  - 返回完整路径

###### resolveVaultFolderPath()

- **返回值**: `Promise<string>` - 文件夹路径
- **作用**: 解析库根目录下的文件夹路径
- **功能**:
  - 直接返回库根目录下的文件夹名称

###### resolveObsidianAttachmentPath()

- **返回值**: `Promise<string>` - 文件夹路径
- **作用**: 解析 Obsidian 附件文件夹路径
- **功能**:
  - 读取 Obsidian 配置
  - 获取附件文件夹路径
  - 处理特殊情况（如 "/" 表示笔记同级目录）
  - 返回文件夹路径

###### ensureFolderExists(folderPath)

- **参数**:
  - `folderPath: string` - 文件夹的完整路径
- **返回值**: `Promise<void>`
- **作用**: 确保文件夹存在
- **功能**:
  - 检查文件夹是否已存在
  - 如果不存在则创建
  - 处理竞态条件和并发创建
  - 完善的错误处理

###### resolveImageLinkPath(noteFile, imagePath)

- **参数**:
  - `noteFile: TFile` - 当前笔记文件对象
  - `imagePath: string` - 图片文件的完整路径
- **返回值**: `string` - 图片链接路径（绝对路径或相对路径）
- **作用**: 解析图片链接路径
- **功能**:
  - 根据配置选择绝对路径或相对路径
  - 计算相对路径层级
  - 处理不同层级的目录关系

---

### 6. naming-formatter.ts - 命名格式化器

**文件作用**: 定义类型、默认设置和提供文件名格式化功能。

#### 定义的枚举和接口

##### ImageSaveLocationType 枚举

- `NOTE_FOLDER` - 保存在笔记同级目录下的文件夹
- `VAULT_FOLDER` - 保存在库根目录下的指定文件夹
- `OBSIDIAN_ATTACHMENT` - 与 Obsidian 附件文件夹保持一致

##### ImageLinkPathType 枚举

- `ABSOLUTE` - 使用绝对路径
- `RELATIVE` - 使用相对路径

##### AutoDownloadImageSettings 接口

- `imageSaveLocationType: ImageSaveLocationType` - 图片保存位置类型
- `noteFolderName: string` - 笔记同级目录下的文件夹名称
- `vaultFolderName: string` - 库根目录下的文件夹名称
- `namingFormat: string` - 图片命名格式
- `imageLinkPathType: ImageLinkPathType` - 图片链接路径类型

##### DEFAULT_SETTINGS 常量

- 默认配置对象，包含所有设置的默认值

#### 定义的类

##### NamingFormatter 类

- **作用**: 格式化图片文件名

##### 类方法

###### formatFileName(format, noteFile)

- **参数**:
  - `format: string` - 命名格式字符串
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `string` - 格式化后的文件名（不含扩展名）
- **作用**: 根据用户配置生成文件名
- **功能**:
  - 获取当前日期时间
  - 替换占位符为实际值
  - 清理文件名中的非法字符
  - 返回格式化后的文件名

##### 类方法（私有）

###### getNoteName(noteFile)

- **参数**: `noteFile: TFile` - 笔记文件对象
- **返回值**: `string` - 笔记名称
- **作用**: 获取不含扩展名的文件名

###### getFormattedDate(date)

- **参数**: `date: Date` - 日期对象
- **返回值**: `string` - 格式化的日期字符串（YYYY-MM-DD）
- **作用**: 格式化日期

###### getFormattedTime(date)

- **参数**: `date: Date` - 日期对象
- **返回值**: `string` - 格式化的时间字符串（HH-MM-SS）
- **作用**: 格式化时间

###### getPaddedMonth(date)

- **参数**: `date: Date` - 日期对象
- **返回值**: `string` - 补零的月份字符串（01-12）
- **作用**: 获取补零月份

###### getPaddedDay(date)

- **参数**: `date: Date` - 日期对象
- **返回值**: `string` - 补零的日期字符串（01-31）
- **作用**: 获取补零日期

###### getPaddedHour(date)

- **参数**: `date: Date` - 日期对象
- **返回值**: `string` - 补零的小时字符串（00-23）
- **作用**: 获取补零小时

###### getPaddedMinute(date)

- **参数**: `date: Date` - 日期对象
- **返回值**: `string` - 补零的分钟字符串（00-59）
- **作用**: 获取补零分钟

###### getPaddedSecond(date)

- **参数**: `date: Date` - 日期对象
- **返回值**: `string` - 补零的秒数字符串（00-59）
- **作用**: 获取补零秒数

---

### 7. utils.ts - 工具函数集合

**文件作用**: 提供各种辅助工具方法。

#### 定义的类

##### ImageUtils 类

- **作用**: 提供静态工具方法

##### 类方法

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

###### sanitizePath(path)（已迁移到 Validator，保留此方法以保持向后兼容）

- **参数**: `path: string` - 要清理的路径
- **返回值**: `string` - 清理后的有效路径
- **作用**: 清理和验证路径，防止路径遍历攻击

###### sanitizeFolderName(name)（已迁移到 Validator，保留此方法以保持向后兼容）

- **参数**: `name: string` - 要清理的文件夹名称
- **返回值**: `string` - 清理后的有效文件夹名称
- **作用**: 清理文件夹名称

---

### 8. error-handler.ts - 错误处理器

**文件作用**: 统一的错误处理、日志记录和用户提示管理。

#### 定义的枚举和类

##### ErrorType 枚举

- `NETWORK_ERROR` - 网络请求错误
- `FILE_ERROR` - 文件操作错误
- `PERMISSION_ERROR` - 权限错误
- `URL_ERROR` - URL 格式错误
- `UNKNOWN_ERROR` - 其他未知错误

##### PluginError 类

- **作用**: 自定义错误类，包含详细的错误信息
- **属性**:
  - `errorType: ErrorType` - 错误类型
  - `originalError?: Error` - 原始错误对象
  - `context?: Record<string, unknown>` - 错误上下文信息

##### ErrorHandler 类

- **作用**: 处理错误并显示用户友好的提示

##### 类方法

###### handle(error, showMessage)

- **参数**:
  - `error: unknown` - 错误对象
  - `showMessage: boolean` - 是否显示通知消息
- **返回值**: `void`
- **作用**: 处理错误并显示用户友好的提示
- **功能**:
  - 标准化错误对象
  - 在控制台打印详细的错误日志
  - 显示用户友好的错误通知

###### normalizeError(error)

- **参数**:
  - `error: unknown` - 原始错误对象
- **返回值**: `PluginError` - 标准化的错误对象
- **作用**: 标准化错误对象

###### determineErrorType(message)

- **参数**:
  - `message: string` - 错误消息
- **返回值**: `ErrorType` - 错误类型
- **作用**: 根据错误消息确定错误类型

###### logError(error)

- **参数**:
  - `error: PluginError` - 错误对象
- **返回值**: `void`
- **作用**: 在控制台打印错误日志

###### showNotice(error)

- **参数**:
  - `error: PluginError` - 错误对象
- **返回值**: `void`
- **作用**: 显示用户友好的错误通知

###### wrap(operation, context, showMessage)

- **参数**:
  - `operation: () => Promise<T>` - 异步操作函数
  - `context?: string` - 操作上下文
  - `showMessage: boolean` - 是否显示错误通知
- **返回值**: `Promise<T | null>` - 操作结果
- **作用**: 包装异步操作，自动处理错误

---

### 9. notifier.ts - 通知管理器

**文件作用**: 统一管理所有用户通知，提供分级通知功能。

#### 定义的枚举和类

##### NoticeLevel 枚举

- `INFO` - 信息级别
- `SUCCESS` - 成功级别
- `WARNING` - 警告级别
- `ERROR` - 错误级别

##### Notifier 类

- **作用**: 显示各种用户通知

##### 类方法

###### info(message, duration)

- **参数**:
  - `message: string` - 通知消息
  - `duration: number` - 显示时长（毫秒）
- **作用**: 显示信息通知

###### success(message, duration)

- **参数**:
  - `message: string` - 通知消息
  - `duration: number` - 显示时长（毫秒）
- **作用**: 显示成功通知

###### warning(message, duration)

- **参数**:
  - `message: string` - 通知消息
  - `duration: number` - 显示时长（毫秒）
- **作用**: 显示警告通知

###### error(message, duration)

- **参数**:
  - `message: string` - 通知消息
  - `duration: number` - 显示时长（毫秒）
- **作用**: 显示错误通知

###### showProgress(total, current, description)

- **参数**:
  - `total: number` - 总数量
  - `current: number` - 当前数量
  - `description: string` - 操作描述
- **作用**: 显示处理进度通知

###### showProcessingResult(successCount, failureCount)

- **参数**:
  - `successCount: number` - 成功数量
  - `failureCount: number` - 失败数量
- **作用**: 显示处理完成通知

###### showProcessing(count)

- **参数**:
  - `count: number` - 处理的数量
- **作用**: 显示正在处理的通知

###### showNoImagesFound()

- **作用**: 显示未找到图片的通知

###### showAlreadyProcessing()

- **作用**: 显示正在处理的通知（防止重复处理）

###### showCannotGetFile()

- **作用**: 显示无法获取文件的通知

###### showNotInMarkdownView()

- **作用**: 显示不在 Markdown 视图的通知

###### showDownloadFailure(url)

- **参数**:
  - `url: string` - 失败的图片 URL
- **作用**: 显示下载失败的通知

###### showCreateFolderFailure()

- **作用**: 显示创建文件夹失败的通知

---

### 10. validator.ts - 验证器

**文件作用**: 统一的输入验证和安全检查。

#### 定义的接口

##### ValidationResult 接口

- `valid: boolean` - 是否验证通过
- `errorMessage?: string` - 错误消息

#### 定义的类

##### Validator 类

- **作用**: 提供各种输入验证和安全检查

##### 类方法

###### validateUrl(url)

- **参数**:
  - `url: string` - 要验证的 URL
- **返回值**: `ValidationResult` - 验证结果
- **作用**: 验证 URL 格式

###### validateFileName(fileName)

- **参数**:
  - `fileName: string` - 要验证的文件名
- **返回值**: `ValidationResult` - 验证结果
- **作用**: 验证文件名

###### validateFolderName(folderName)

- **参数**:
  - `folderName: string` - 要验证的文件夹名称
- **返回值**: `ValidationResult` - 验证结果
- **作用**: 验证文件夹名称

###### validatePathSafety(path)

- **参数**:
  - `path: string` - 要验证的路径
- **返回值**: `ValidationResult` - 验证结果
- **作用**: 验证路径安全性

###### validateNoteFile(file)

- **参数**:
  - `file: TFile | null` - 要验证的文件对象
- **返回值**: `ValidationResult` - 验证结果
- **作用**: 验证笔记文件

###### validateNamingFormat(format)

- **参数**:
  - `format: string` - 命名格式字符串
- **返回值**: `ValidationResult` - 验证结果
- **作用**: 验证命名格式

###### sanitizePath(path)

- **参数**:
  - `path: string` - 要清理的路径
- **返回值**: `string` - 清理后的安全路径
- **作用**: 清理和验证路径

###### sanitizeFolderName(name)

- **参数**:
  - `name: string` - 要清理的文件夹名称
- **返回值**: `string` - 清理后的安全文件夹名称
- **作用**: 清理文件夹名称

---

### 11. main.ts - 插件主类

**文件作用**: 插件的核心逻辑，协调各个模块的工作。

#### 定义的类

##### AutoDownloadImagePlugin 类

- **继承**: `Plugin` (Obsidian 基类)
- **作用**: 插件主类，管理插件生命周期和核心功能

##### 类属性

- `settings: AutoDownloadImageSettings` - 插件的设置对象，存储用户配置
- `private imageDetector: ImageDetector` - 图片检测器实例
- `private imageDownloader: ImageDownloader` - 图片下载器实例
- `private pathResolver: PathResolver` - 路径解析器实例
- `private isProcessing: boolean` - 处理状态标志，防止重复处理

##### 类方法

###### onload()

- **返回值**: `Promise<void>`
- **作用**: 插件加载时的初始化方法
- **功能**:
  - 加载用户设置
  - 初始化各个处理器实例
  - 添加功能区图标
  - 注册命令
  - 添加设置选项卡
  - 错误处理

###### onunload()

- **返回值**: `void`
- **作用**: 插件卸载时的清理方法

###### loadSettings()

- **返回值**: `Promise<void>`
- **作用**: 从磁盘加载插件设置
- **功能**:
  - 合并默认设置和用户设置
  - 验证设置有效性
  - 错误处理

###### validateSettings()

- **返回值**: `void`
- **作用**: 验证设置的有效性

###### saveSettings()

- **返回值**: `Promise<void>`
- **作用**: 保存插件设置到磁盘

###### updatePathResolver(settings)

- **参数**: `settings: AutoDownloadImageSettings` - 新的设置对象
- **返回值**: `void`
- **作用**: 更新路径解析器

###### processCurrentNoteWithConfirmation(editor)

- **参数**:
  - `editor: Editor` - Obsidian 的编辑器实例
- **返回值**: `Promise<void>`
- **作用**: 处理当前笔记中所有网络图片（带确认对话框）
- **功能**:
  - 检查处理状态
  - 检测网络图片
  - 验证文件有效性
  - 显示确认对话框

###### processImageLinks(editor, imageLinks, noteFile)

- **参数**:
  - `editor: Editor` - Obsidian 的编辑器实例
  - `imageLinks: ImageLink[]` - 要处理的图片链接列表
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<void>`
- **作用**: 处理图片链接
- **功能**:
  - 设置处理状态
  - 显示开始通知
  - 调用下载替换方法
  - 显示结果通知
  - 错误处理

###### downloadAndReplaceImages(editor, imageLinks, noteFile)

- **参数**:
  - `editor: Editor` - Obsidian 的编辑器实例
  - `imageLinks: ImageLink[]` - 要处理的图片链接列表
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<ProcessingResult>` - 处理结果
- **作用**: 下载并替换所有图片
- **功能**:
  - 从后往前处理图片链接
  - 验证 URL 有效性
  - 延迟控制
  - 错误处理

###### downloadAndSaveImage(url, noteFile)

- **参数**:
  - `url: string` - 图片 URL 地址
  - `noteFile: TFile` - 当前笔记文件对象
- **返回值**: `Promise<string | null>` - 图片路径或 null
- **作用**: 下载网络图片并保存到本地
- **功能**:
  - 验证 URL
  - 下载图片数据
  - 验证二进制数据
  - 获取 MIME 类型
  - 生成文件名
  - 验证文件名和路径
  - 保存图片

###### downloadImages()

- **返回值**: `void`
- **作用**: 下载图片的入口方法

---

### 12. settings.ts - 设置管理

**文件作用**: 管理插件设置并提供设置页面 UI。

#### 定义的枚举和常量

##### Language 类型

- `zh` - 中文
- `en` - 英文

##### Translations 接口

- 包含所有设置项的翻译文本

##### zhTranslations 常量

- 所有设置项的中文翻译

##### enTranslations 常量

- 所有设置项的英文翻译

#### 定义的类

##### AutoDownloadImageSettingTab 类

- **继承**: `PluginSettingTab`
- **作用**: 设置选项卡

##### 类属性

- `plugin: AutoDownloadImagePlugin` - 插件实例
- `private currentLanguage: Language` - 当前语言

##### 类方法

###### constructor(app, plugin)

- **参数**:
  - `app: App` - Obsidian 应用实例
  - `plugin: AutoDownloadImagePlugin` - 插件实例
- **作用**: 初始化设置选项卡
- **功能**:
  - 调用父类构造函数
  - 保存插件实例
  - 检测语言

###### detectLanguage()

- **返回值**: `Language`
- **作用**: 检测当前语言
- **功能**:
  - 使用 getLanguage() 函数
  - 判断是否为中文

###### getTranslations()

- **返回值**: `Translations`
- **作用**: 获取翻译文本

###### display()

- **返回值**: `void`
- **作用**: 显示设置页面
- **功能**:
  - 清空容器
  - 创建标题
  - 创建各设置项

###### createImageSaveLocationSetting(containerEl, t)

- **参数**:
  - `containerEl: HTMLElement` - 容器元素
  - `t: Translations` - 翻译文本
- **作用**: 创建图片保存位置设置项

###### createImageLinkPathTypeSetting(containerEl, t)

- **参数**:
  - `containerEl: HTMLElement` - 容器元素
  - `t: Translations` - 翻译文本
- **作用**: 创建图片链接路径类型设置项

###### createNamingFormatSetting(containerEl, t)

- **参数**:
  - `containerEl: HTMLElement` - 容器元素
  - `t: Translations` - 翻译文本
- **作用**: 创建图片命名格式设置项

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
6. 在目标位置创建文件夹
7. 保存图片文件

### 替换策略

- **从后往前处理**：为了避免前面替换导致后面的位置偏移，采用从后往前的顺序处理图片链接
- 使用 `editor.offsetToPos()` 将偏移量转换为编辑器位置
- 使用 `editor.replaceRange()` 替换原始链接

### 防反爬措施

- User-Agent: 模拟 Chrome 浏览器
- Accept: 支持多种图片格式
- Accept-Language: 支持中文
- Referer: 动态设置来源域名
- 下载间隔：每张图片间隔 1.5 秒

### 状态管理

- 使用 `isProcessing` 标志防止重复处理
- 在确认对话框中添加取消回调，确保状态一致性
- 使用 `finally` 块确保无论成功或失败都能重置状态

### 安全措施

- 路径清理：使用 `sanitizePath()` 方法移除非法字符和防止路径遍历
- 文件名清理：移除 Windows 系统不允许的字符
- 输入验证：所有用户输入都经过验证
- 文件名冲突：使用时间戳和随机字符串避免冲突

### 错误处理

- **错误分类**：网络错误、文件错误、权限错误、URL 错误、未知错误
- **错误日志**：在控制台打印详细的错误信息（类型、消息、堆栈、上下文）
- **用户提示**：显示简洁易懂的错误消息
- **错误包装**：使用 `wrap()` 方法自动处理异步操作的错误

### 多语言支持

- 使用 Obsidian 的 `getLanguage()` 函数检测语言
- 支持中文（简体和繁体）和英文
- 翻译文本存储在 `zhTranslations` 和 `enTranslations` 常量中
- 动态切换界面语言

## 构建和运行

### 前置要求

- Node.js 18.x 或更高版本
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
- 使用 `ErrorHandler` 类处理错误
- 使用 `Notifier` 类显示用户通知
- 使用 `console.error` 记录错误详情

### 验证和安全

- 所有外部输入必须经过 `Validator` 类验证
- 使用 `sanitizePath()` 和 `sanitizeFolderName()` 清理路径
- 防止路径遍历攻击
- 防止重复处理

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
5. 使用 `Validator` 类验证所有输入
6. 使用 `ErrorHandler` 类处理错误
7. 使用 `Notifier` 类显示通知
