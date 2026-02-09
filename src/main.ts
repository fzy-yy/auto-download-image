// 导入 Obsidian 核心类型和类
import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";
// 导入设置相关的类型和类
import {
	AutoDownloadImageSettingTab,
	AutoDownloadImageSettings,
	DEFAULT_SETTINGS,
} from "./settings";
// 导入类型定义
import { ImageLink, ProcessingResult } from "./types";
// 导入确认对话框
import { ImageDownloadConfirmModal } from "./confirm-modal";
// 导入图片检测器
import { ImageDetector } from "./image-detector";
// 导入图片下载器
import { ImageDownloader } from "./image-downloader";
// 导入图片保存器
import { ImageSaver } from "./image-saver";
// 导入工具函数
import { ImageUtils } from "./utils";

// 插件主类，继承自 Obsidian 的 Plugin 基类
export default class AutoDownloadImagePlugin extends Plugin {
	// 插件的设置对象，存储用户配置的图片保存路径和命名格式
	settings: AutoDownloadImageSettings;
	// 图片检测器实例
	private imageDetector: ImageDetector;
	// 图片下载器实例
	private imageDownloader: ImageDownloader;
	// 图片保存器实例
	private imageSaver: ImageSaver;
	// 处理状态标志，防止重复处理
	private isProcessing: boolean = false;

	// 插件加载时的初始化方法，在插件启用时自动调用
	async onload() {
		// 从磁盘加载用户的设置配置
		await this.loadSettings();

		// 初始化各个处理器实例
		this.imageDetector = new ImageDetector();
		this.imageDownloader = new ImageDownloader();
		this.imageSaver = new ImageSaver(
			this.app.vault,
			this.settings.imageSavePath,
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
		void this.addSettingTab(
			new AutoDownloadImageSettingTab(this.app, this),
		);
	}

	// 插件卸载时的清理方法，在插件禁用时自动调用
	onunload() {
		// 当前插件无需特殊的清理操作
	}

	// 从磁盘加载插件设置的方法
	async loadSettings() {
		// 使用 Object.assign 合并默认设置和用户保存的设置，确保设置对象总是有完整的配置
		this.settings = Object.assign(
			{}, // 创建一个空对象作为目标
			DEFAULT_SETTINGS, // 复制默认设置到目标对象
			(await this.loadData()) as Partial<AutoDownloadImageSettings>, // 加载用户保存的设置并覆盖默认值
		);
	}

	// 保存插件设置到磁盘的方法
	async saveSettings() {
		// 将当前的设置对象保存到磁盘
		await this.saveData(this.settings);
	}

	// 更新图片保存器路径的公共方法
	// 参数: newPath - 新的图片保存路径
	// 返回值: void - 无返回值
	updateImageSaverPath(newPath: string): void {
		// 重新创建 ImageSaver 实例，使用新的保存路径
		this.imageSaver = new ImageSaver(this.app.vault, newPath);
	}

	// 处理当前笔记中所有网络图片的入口方法（带确认对话框）
	// 参数: editor - Obsidian 的编辑器实例，用于获取和修改笔记内容
	// 返回值: Promise<void> - 异步方法，无返回值
	private async processCurrentNoteWithConfirmation(
		editor: Editor,
	): Promise<void> {
		// 检查是否正在处理中，防止重复处理
		if (this.isProcessing) {
			new Notice("正在处理图片，请稍候...");
			return;
		}

		// 获取编辑器中的完整笔记内容（文本）
		const content = editor.getValue();

		// 使用图片检测器检测笔记中的所有网络图片链接
		const imageLinks = this.imageDetector.detectNetworkImages(content);

		// 如果没有检测到任何网络图片链接，显示通知并提前返回
		if (imageLinks.length === 0) {
			new Notice("当前笔记中未发现网络图片链接");
			return;
		}

		// 获取当前活动文件（即正在编辑的笔记文件）
		const activeFile = this.app.workspace.getActiveFile();
		// 如果无法获取当前文件，显示错误通知并提前返回
		if (!activeFile) {
			new Notice("无法获取当前文件");
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
		new Notice(`开始处理 ${imageLinks.length} 张网络图片...`);

		// 使用 try-catch 捕获处理过程中可能出现的异常
		try {
			// 处理所有图片链接并获取结果
			const result = await this.downloadAndReplaceImages(
				editor,
				imageLinks,
				noteFile,
			);

			// 如果至少有一张图片下载成功，显示处理完成的通知
			if (result.successCount > 0) {
				new Notice(
					`处理完成！成功下载 ${result.successCount} 张图片${result.failureCount > 0 ? `，失败 ${result.failureCount} 张` : ""}`,
				);
			} else if (result.failureCount > 0) {
				// 如果所有图片都下载失败，显示失败通知
				new Notice(`处理失败：${result.failureCount} 张图片下载失败`);
			}
		} catch (error) {
			// 捕获并记录整个处理过程中的未预期错误
			console.error("处理图片时发生错误", error);
			// 显示通用错误通知，提示用户查看控制台
			new Notice("处理图片时发生错误，请查看控制台");
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

		// 从后往前遍历所有图片链接，避免前面替换导致后面位置偏移
		for (let i = imageLinks.length - 1; i >= 0; i--) {
			// 获取当前处理的图片链接对象（使用非空断言运算符）
			const imageLink = imageLinks[i]!;
			// 使用 try-catch 捕获单个图片下载时的异常，确保一张图片失败不影响其他图片
			try {
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
				new Notice(`下载图片失败: ${imageLink.url}`);
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
		// 使用 try-catch 捕获下载和保存过程中的异常
		try {
			// 使用图片下载器获取图片的二进制数据
			const arrayBuffer = await this.imageDownloader.fetchImageData(url);
			// 使用图片下载器获取图片的 MIME 类型
			const mimeType = await this.imageDownloader.getImageMimeType(url);

			// 根据图片 URL 和 MIME 类型获取文件扩展名
			const ext = ImageUtils.getImageExtension(url, mimeType);
			// 根据用户配置的命名格式和扩展名生成文件名
			const fileName = ImageUtils.generateFileName(
				ext,
				this.settings.namingFormat,
			);

			// 使用图片保存器保存图片到本地并返回相对路径
			const localPath = await this.imageSaver.saveImageToFile(
				noteFile,
				arrayBuffer,
				fileName,
			);

			// 返回图片的相对路径（用于替换网络链接）
			return localPath;
		} catch (error) {
			// 捕获并记录下载或保存过程中的错误
			console.error(`下载图片失败: ${url}`, error);
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
			new Notice("请在 Markdown 笔记中使用此功能");
		}
	}
}
