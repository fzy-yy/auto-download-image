// 导入 Obsidian 核心类型和类
import { Editor, MarkdownView, Plugin, TFile } from "obsidian";
// 导入设置相关的类型和类
import { AutoDownloadImageSettingTab } from "./settings";
// 导入类型定义
import {
  AutoDownloadImageSettings,
  DEFAULT_SETTINGS,
} from "./naming-formatter";
// 导入类型定义
import { ImageLink, ProcessingResult } from "./types";
// 导入确认对话框
import { ImageDownloadConfirmModal } from "./confirm-modal";
// 导入图片检测器
import { ImageDetector } from "./image-detector";
// 导入图片下载器
import { ImageDownloader } from "./image-downloader";
// 导入路径解析器
import { PathResolver } from "./path-resolver";
// 导入命名格式化器
import { NamingFormatter } from "./naming-formatter";
// 导入工具函数
import { ImageUtils } from "./utils";
// 导入错误处理器
import { ErrorHandler, ErrorType, PluginError } from "./error-handler";
// 导入通知管理器
import { Notifier } from "./notifier";
// 导入验证器
import { Validator } from "./validator";

// 插件主类，继承自 Obsidian 的 Plugin 基类
export default class AutoDownloadImagePlugin extends Plugin {
  // 插件的设置对象，存储用户配置
  settings: AutoDownloadImageSettings;
  // 图片检测器实例
  private imageDetector: ImageDetector;
  // 图片下载器实例
  private imageDownloader: ImageDownloader;
  // 路径解析器实例
  private pathResolver: PathResolver;
  // 处理状态标志，防止重复处理
  private isProcessing: boolean = false;

  // 插件加载时的初始化方法，在插件启用时自动调用
  async onload() {
    try {
      // 从磁盘加载用户的设置配置
      await this.loadSettings();

      // 初始化各个处理器实例
      this.imageDetector = new ImageDetector();
      this.imageDownloader = new ImageDownloader();
      this.pathResolver = new PathResolver(
        this.app,
        this.app.vault,
        this.settings.imageSaveLocationType,
        this.settings.noteFolderName,
        this.settings.vaultFolderName,
        this.settings.imageLinkPathType,
      );

      // 在左侧功能区添加一个图片图标，点击时触发 downloadImages 方法
      this.addRibbonIcon(
        "image", // 图标类型
        "Auto download image", // 图标的提示文本
        (evt: MouseEvent) => {
          // 图标点击事件处理器
          this.downloadImages(); // 调用下载图片的方法
        },
      );

      // 注册一个命令，可以在命令面板中通过 "Download and replace network images" 触发
      this.addCommand({
        id: "download-images", // 命令的唯一标识符
        name: "Download and replace network images", // 命令的显示名称
        editorCallback: (editor: Editor, view: MarkdownView) => {
          // 命令执行时的回调函数，接收编辑器和视图参数
          void this.processCurrentNoteWithConfirmation(editor); // 处理当前笔记中的网络图片（带确认）
        },
      });

      // 在 Obsidian 的设置页面中添加本插件的设置选项卡
      void this.addSettingTab(new AutoDownloadImageSettingTab(this.app, this));
    } catch (error) {
      // 处理插件加载时的错误
      ErrorHandler.handle(error, true);
    }
  }

  // 插件卸载时的清理方法，在插件禁用时自动调用
  onunload() {
    // 清理处理状态
    this.isProcessing = false;
  }

  // 从磁盘加载插件设置的方法
  async loadSettings() {
    try {
      // 加载用户保存的设置
      const savedSettings =
        (await this.loadData()) as Partial<AutoDownloadImageSettings>;

      // 使用 Object.assign 合并默认设置和用户保存的设置，确保设置对象总是有完整的配置
      this.settings = Object.assign(
        {}, // 创建一个空对象作为目标
        DEFAULT_SETTINGS, // 复制默认设置到目标对象
        savedSettings, // 加载用户保存的设置并覆盖默认值
      );

      // 验证设置
      this.validateSettings();
    } catch (error) {
      // 如果加载失败，使用默认设置
      console.error("加载设置失败，使用默认设置", error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  // 验证设置的有效性
  private validateSettings(): void {
    // 验证命名格式
    const namingValidation = Validator.validateNamingFormat(
      this.settings.namingFormat,
    );
    if (!namingValidation.valid) {
      console.warn("命名格式无效，使用默认格式", namingValidation.errorMessage);
      this.settings.namingFormat = DEFAULT_SETTINGS.namingFormat;
    }

    // 验证文件夹名称
    const noteFolderValidation = Validator.validateFolderName(
      this.settings.noteFolderName,
    );
    if (!noteFolderValidation.valid) {
      console.warn(
        "笔记文件夹名称无效，使用默认名称",
        noteFolderValidation.errorMessage,
      );
      this.settings.noteFolderName = DEFAULT_SETTINGS.noteFolderName;
    }

    const vaultFolderValidation = Validator.validateFolderName(
      this.settings.vaultFolderName,
    );
    if (!vaultFolderValidation.valid) {
      console.warn(
        "库文件夹名称无效，使用默认名称",
        vaultFolderValidation.errorMessage,
      );
      this.settings.vaultFolderName = DEFAULT_SETTINGS.vaultFolderName;
    }
  }

  // 保存插件设置到磁盘的方法
  async saveSettings() {
    try {
      // 将当前的设置对象保存到磁盘
      await this.saveData(this.settings);
    } catch (error) {
      // 处理保存设置时的错误
      ErrorHandler.handle(error, true);
    }
  }

  // 更新路径解析器的公共方法
  // 参数: settings - 新的设置对象
  // 返回值: void - 无返回值
  updatePathResolver(settings: AutoDownloadImageSettings): void {
    try {
      // 重新创建 PathResolver 实例，使用新的设置
      this.pathResolver = new PathResolver(
        this.app,
        this.app.vault,
        settings.imageSaveLocationType,
        settings.noteFolderName,
        settings.vaultFolderName,
        settings.imageLinkPathType,
      );
    } catch (error) {
      // 处理更新路径解析器时的错误
      ErrorHandler.handle(error, true);
    }
  }

  // 处理当前笔记中所有网络图片的入口方法（带确认对话框）
  // 参数: editor - Obsidian 的编辑器实例，用于获取和修改笔记内容
  // 返回值: Promise<void> - 异步方法，无返回值
  private async processCurrentNoteWithConfirmation(
    editor: Editor,
  ): Promise<void> {
    // 检查是否正在处理中，防止重复处理
    if (this.isProcessing) {
      Notifier.showAlreadyProcessing();
      return;
    }

    // 获取编辑器中的完整笔记内容（文本）
    const content = editor.getValue();

    // 验证内容是否为空
    if (!content || content.trim().length === 0) {
      Notifier.showNoImagesFound();
      return;
    }

    // 使用图片检测器检测笔记中的所有网络图片链接
    const imageLinks = this.imageDetector.detectNetworkImages(content);

    // 如果没有检测到任何网络图片链接，显示通知并提前返回
    if (imageLinks.length === 0) {
      Notifier.showNoImagesFound();
      return;
    }

    // 获取当前活动文件（即正在编辑的笔记文件）
    const activeFile = this.app.workspace.getActiveFile();

    // 验证文件是否有效
    if (!activeFile) {
      Notifier.showCannotGetFile();
      return;
    }

    const fileValidation = Validator.validateNoteFile(activeFile);
    if (!fileValidation.valid) {
      Notifier.error(fileValidation.errorMessage || "文件无效");
      return;
    }

    // 创建并显示确认对话框
    new ImageDownloadConfirmModal(
      this.app,
      imageLinks,
      () => {
        // 用户点击确认后，执行图片处理
        void this.processImageLinks(editor, imageLinks, activeFile);
      },
      () => {
        // 用户取消或关闭对话框时，重置处理状态
        this.isProcessing = false;
      },
    ).open();
  }

  // 处理图片链接的核心方法
  // 参数: editor - Obsidian 的编辑器实例
  // 参数: imageLinks - 要处理的图片链接列表
  // 参数: noteFile - 当前笔记文件对象
  // 返回值: Promise<void> - 异步方法，无返回值
  private async processImageLinks(
    editor: Editor,
    imageLinks: ImageLink[],
    noteFile: TFile,
  ): Promise<void> {
    // 设置处理状态为正在处理
    this.isProcessing = true;

    // 显示通知，告知用户开始处理
    Notifier.showProcessing(imageLinks.length);

    // 使用 try-catch 捕获处理过程中可能出现的异常
    try {
      // 处理所有图片链接并获取结果
      const result = await this.downloadAndReplaceImages(
        editor,
        imageLinks,
        noteFile,
      );

      // 显示处理结果通知
      Notifier.showProcessingResult(result.successCount, result.failureCount);
    } catch (error) {
      // 捕获并记录整个处理过程中的未预期错误
      ErrorHandler.handle(error, true);
    } finally {
      // 无论成功或失败，都要重置处理状态
      this.isProcessing = false;
    }
  }

  // 下载并替换所有图片的方法
  // 参数: editor - Obsidian 的编辑器实例
  // 参数: imageLinks - 要处理的图片链接列表
  // 参数: noteFile - 当前笔记文件对象
  // 返回值: Promise<ProcessingResult> - 处理结果，包含成功和失败的数量
  private async downloadAndReplaceImages(
    editor: Editor,
    imageLinks: ImageLink[],
    noteFile: TFile,
  ): Promise<ProcessingResult> {
    // 初始化成功和失败的计数器
    let successCount = 0; // 成功下载的图片数量
    let failureCount = 0; // 下载失败的图片数量

    // 验证图片链接列表是否为空
    if (!imageLinks || imageLinks.length === 0) {
      return { successCount, failureCount };
    }

    // 从后往前遍历所有图片链接，避免前面替换导致后面位置偏移
    for (let i = imageLinks.length - 1; i >= 0; i--) {
      // 获取当前处理的图片链接对象（使用非空断言运算符）
      const imageLink = imageLinks[i]!;

      // 使用 try-catch 捕获单个图片下载时的异常，确保一张图片失败不影响其他图片
      try {
        // 验证 URL 是否有效
        const urlValidation = Validator.validateUrl(imageLink.url);
        if (!urlValidation.valid) {
          console.warn(
            `无效的图片 URL: ${imageLink.url}`,
            urlValidation.errorMessage,
          );
          failureCount++;
          continue;
        }

        // 延迟 1.5 秒，避免频繁请求被反爬机制拦截
        await ImageUtils.delay(1500);

        // 下载图片并保存到本地，返回保存后的相对路径
        const localPath = await this.downloadAndSaveImage(
          imageLink.url,
          noteFile,
        );

        // 如果下载成功（返回了本地路径）
        if (localPath) {
          // 替换笔记中的网络链接为本地相对路径
          ImageUtils.replaceImageLink(editor, imageLink, localPath);
          // 成功计数加 1
          successCount++;
        } else {
          // 如果下载失败，失败计数加 1
          failureCount++;
        }
      } catch (error) {
        // 捕获并记录单个图片下载时的错误
        console.error(`下载图片失败: ${imageLink.url}`, error);
        // 显示失败通知给用户
        Notifier.showDownloadFailure(imageLink.url);
        // 失败计数加 1
        failureCount++;
      }
    }

    // 返回处理结果
    return { successCount, failureCount };
  }

  // 下载网络图片并保存到本地的异步方法
  // 参数: url - 要下载的图片 URL 地址
  // 参数: noteFile - 当前笔记文件对象，用于确定保存路径
  // 返回值: Promise<string | null> - 成功时返回图片的相对路径，失败时返回 null
  private async downloadAndSaveImage(
    url: string,
    noteFile: TFile,
  ): Promise<string | null> {
    try {
      // 验证 URL
      const urlValidation = Validator.validateUrl(url);
      if (!urlValidation.valid) {
        throw new PluginError(
          urlValidation.errorMessage || "无效的 URL",
          ErrorType.UNKNOWN_ERROR,
        );
      }

      // 使用图片下载器获取图片的二进制数据
      const arrayBuffer = await this.imageDownloader.fetchImageData(url);

      // 验证二进制数据是否为空
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new PluginError("下载的图片数据为空", ErrorType.UNKNOWN_ERROR);
      }

      // 使用图片下载器获取图片的 MIME 类型
      const mimeType = await this.imageDownloader.getImageMimeType(url);

      // 根据图片 URL 和 MIME 类型获取文件扩展名
      const ext = ImageUtils.getImageExtension(url, mimeType);

      // 根据用户配置的命名格式生成文件名（不含扩展名）
      const baseFileName = NamingFormatter.formatFileName(
        this.settings.namingFormat,
        noteFile,
      );
      // 组合文件名和扩展名
      const fileName = `${baseFileName}.${ext}`;

      // 验证文件名
      const fileNameValidation = Validator.validateFileName(fileName);
      if (!fileNameValidation.valid) {
        throw new PluginError(
          fileNameValidation.errorMessage || "无效的文件名",
          ErrorType.UNKNOWN_ERROR,
        );
      }

      // 使用路径解析器解析图片保存路径
      const folderPath = await this.pathResolver.resolveFolderPath(noteFile);

      // 验证路径安全性
      const pathValidation = Validator.validatePathSafety(folderPath);
      if (!pathValidation.valid) {
        throw new PluginError(
          pathValidation.errorMessage || "无效的路径",
          ErrorType.UNKNOWN_ERROR,
        );
      }

      // 确保目标文件夹存在
      await this.pathResolver.ensureFolderExists(folderPath);

      // 构建图片文件的完整路径：文件夹路径 + 文件名
      const fullPath = `${folderPath}/${fileName}`;

      // 将 ArrayBuffer 转换为 Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);
      // 使用 Vault API 将二进制数据写入文件，需要传入 ArrayBuffer
      await this.app.vault.createBinary(fullPath, uint8Array.buffer);

      // 根据用户设置返回绝对路径或相对路径
      const linkPath = this.pathResolver.resolveImageLinkPath(
        noteFile,
        fullPath,
      );

      // 返回图片的路径（用于替换网络链接）
      return linkPath;
    } catch (error) {
      // 捕获并记录下载或保存过程中的错误
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`下载图片失败: ${url}`, error);
      // 如果错误信息中包含"already exists"，说明文件夹或文件已存在，可以忽略
      if (errorMessage.includes("already exists")) {
        console.debug("文件夹或文件已存在，跳过");
        return null;
      }
      // 返回 null 表示下载失败
      return null;
    }
  }

  // 下载图片的入口方法，通过功能区图标调用
  private downloadImages(): void {
    // 获取当前活动的 Markdown 视图
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    // 检查是否成功获取到视图以及编辑器
    if (activeView && activeView.editor) {
      // 调用处理当前笔记的方法（带确认对话框）
      void this.processCurrentNoteWithConfirmation(activeView.editor);
    } else {
      // 如果不在 Markdown 视图中，显示提示通知
      Notifier.showNotInMarkdownView();
    }
  }
}
