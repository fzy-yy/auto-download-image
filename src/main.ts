// 导入 Obsidian 核心类型和类：Editor（编辑器）、MarkdownView（Markdown 视图）、Notice（通知提示）、Plugin（插件基类）、TFile（文件类型）、requestUrl（网络请求函数）
import {
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	TFile,
	requestUrl,
} from "obsidian";
// 导入设置相关的类型和类：AutoDownloadImageSettingTab（设置选项卡）、DEFAULT_SETTINGS（默认设置）、AutoDownloadImageSettings（设置接口）
import {
	AutoDownloadImageSettingTab,
	AutoDownloadImageSettings,
	DEFAULT_SETTINGS,
} from "./settings";

// 定义网络图片链接的接口，包含图片 URL 和在笔记中的起始、结束位置
interface ImageLink {
	// 图片的完整 URL 地址
	url: string;
	// 图片链接在笔记内容中的起始位置（字符偏移量）
	startPos: number;
	// 图片链接在笔记内容中的结束位置（字符偏移量）
	endPos: number;
}

// 插件主类，继承自 Obsidian 的 Plugin 基类
export default class AutoDownloadImagePlugin extends Plugin {
	// 插件的设置对象，存储用户配置的图片保存路径和命名格式
	settings: AutoDownloadImageSettings;

	// 插件加载时的初始化方法，在插件启用时自动调用
	async onload() {
		// 从磁盘加载用户的设置配置
		await this.loadSettings();

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
				void this.processCurrentNote(editor); // 处理当前笔记中的网络图片
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

	// 处理当前笔记中所有网络图片的核心方法
	// 参数: editor - Obsidian 的编辑器实例，用于获取和修改笔记内容
	// 返回值: Promise<void> - 异步方法，无返回值
	private async processCurrentNote(editor: Editor): Promise<void> {
		// 获取编辑器中的完整笔记内容（文本）
		const content = editor.getValue();

		// 使用正则表达式检测笔记中的所有网络图片链接
		const imageLinks = this.detectNetworkImages(content);

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

		// 显示通知，告知用户发现了多少张网络图片，开始处理
		new Notice(`发现 ${imageLinks.length} 张网络图片，开始处理...`);

		// 使用 try-catch 捕获处理过程中可能出现的异常
		try {
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
					await this.delay(1500);

					// 下载图片并保存到本地，返回保存后的相对路径
					const localPath = await this.downloadAndSaveImage(
						imageLink.url, // 图片的 URL
						activeFile, // 当前笔记文件对象
					);

					// 如果下载成功（返回了本地路径）
					if (localPath) {
						// 将字符偏移量转换为编辑器的位置对象（起始位置）
						const startPos = editor.offsetToPos(imageLink.startPos);
						// 将字符偏移量转换为编辑器的位置对象（结束位置）
						const endPos = editor.offsetToPos(imageLink.endPos);
						// 使用编辑器的 replaceRange 方法替换网络链接为本地相对路径
						editor.replaceRange(
							`![](${localPath})`, // 替换为本地图片链接
							startPos, // 替换范围的起始位置
							endPos, // 替换范围的结束位置
						);
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

			// 如果至少有一张图片下载成功，显示处理完成的通知
			if (successCount > 0) {
				new Notice(
					`处理完成！成功下载 ${successCount} 张图片${failureCount > 0 ? `，失败 ${failureCount} 张` : ""}`,
				);
			}
		} catch (error) {
			// 捕获并记录整个处理过程中的未预期错误
			console.error("处理图片时发生错误", error);
			// 显示通用错误通知，提示用户查看控制台
			new Notice("处理图片时发生错误，请查看控制台");
		}
	}

	// 检测笔记内容中所有网络图片链接的方法
	// 参数: content - 笔记的完整文本内容
	// 返回值: ImageLink[] - 检测到的所有网络图片链接的数组
	private detectNetworkImages(content: string): ImageLink[] {
		// 创建空数组用于存储检测到的图片链接
		const results: ImageLink[] = [];
		// 定义正则表达式，匹配 Markdown 格式的网络图片链接：![alt](http://url) 或 ![alt](https://url)
		const regex = /!\[([^\]]*)?\]\((https?:\/\/[^)]+)\)/g;
		// 声明匹配结果的变量
		let match;

		// 使用 while 循环和正则表达式的 exec 方法，遍历所有匹配项
		while ((match = regex.exec(content)) !== null) {
			// 检查匹配结果中是否包含 URL（match[2]）
			if (match[2]) {
				// 将匹配到的图片链接信息添加到结果数组中
				results.push({
					url: match[2], // 提取的 URL（正则第二个捕获组）
					startPos: match.index, // 匹配到的起始位置
					endPos: match.index + match[0].length, // 匹配到的结束位置（起始位置 + 匹配文本长度）
				});
			}
		}

		// 返回所有检测到的图片链接数组
		return results;
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
			// 声明 referer 变量，用于存储 HTTP 请求的 Referer 头
			let referer: string;
			// 使用 try-catch 尝试使用 URL 构造函数解析 URL
			try {
				// 创建 URL 对象以提取 origin（协议 + 域名 + 端口）
				const urlObj = new URL(url);
				// 提取 URL 的 origin 作为 referer
				referer = urlObj.origin;
			} catch {
				// 如果 URL 不是标准格式，使用字符串分割作为 fallback
				const parts = url.split("/");
				// 检查分割后的数组是否至少有 3 个元素
				if (parts.length >= 3) {
					// 手动构建 referer：协议 + // + 域名
					referer = parts[0] + "//" + parts[2];
				} else {
					// 如果 URL 格式非常不规范，直接使用整个 URL 作为 referer
					referer = url;
				}
			}

			// 使用 Obsidian 的 requestUrl API 下载图片，配置请求方法和请求头
			const response = await requestUrl({
				url: url, // 请求的 URL
				method: "GET", // HTTP 请求方法
				headers: {
					// 请求头配置
					// 设置 User-Agent，模拟 Chrome 浏览器，避免被反爬
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					// 设置 Accept，表示接受多种图片格式
					Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
					// 设置 Accept-Language，支持中文
					"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
					// 设置 Referer，告知服务器请求来源
					Referer: referer,
				},
			});

			// 检查 HTTP 响应状态，如果不是 200-299，抛出错误
			if (response.status < 200 || response.status >= 300) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// 从响应中获取 ArrayBuffer（二进制数据）
			const arrayBuffer = response.arrayBuffer;
			// 将 ArrayBuffer 转换为 Uint8Array，这是保存二进制文件所需的格式
			const uint8Array = new Uint8Array(arrayBuffer);

			// 从响应头中获取 MIME 类型
			const mimeType = response.headers["content-type"] || "";
			// 根据图片 URL 和 MIME 类型获取文件扩展名
			const ext = this.getImageExtension(url, mimeType);
			// 根据用户配置的命名格式和扩展名生成文件名
			const fileName = this.generateFileName(ext);

			// 获取笔记文件所在的目录对象
			const noteDir = noteFile.parent;

			// 检查是否成功获取到笔记所在目录
			if (!noteDir) {
				// 如果获取失败，抛出错误
				throw new Error("无法获取笔记所在的目录");
			}

			// 从设置中获取用户配置的图片保存路径
			const savePath = this.settings.imageSavePath;
			// 构建文件夹的完整路径：笔记目录 + 保存路径
			const folderPath = `${noteDir.path}/${savePath}`;

			// 检查该文件夹是否已经存在于 Vault 中
			const existingFolder =
				this.app.vault.getAbstractFileByPath(folderPath);
			// 如果文件夹不存在
			if (!existingFolder) {
				// 使用 try-catch 捕获创建文件夹时的异常
				try {
					// 创建文件夹
					await this.app.vault.createFolder(folderPath);
				} catch (error) {
					// 记录创建文件夹失败的错误
					console.error("创建文件夹失败", error);
					// 抛出错误，终止后续操作
					throw new Error("创建图片保存文件夹失败");
				}
			}

			// 构建图片文件的完整路径：文件夹路径 + 文件名
			const fullPath = `${folderPath}/${fileName}`;
			// 使用 Vault API 将二进制数据写入文件，需要传入 ArrayBuffer
			await this.app.vault.createBinary(fullPath, uint8Array.buffer);

			// 返回图片的相对路径（用于替换网络链接）
			return fullPath;
		} catch (error) {
			// 捕获并记录下载或保存过程中的错误
			console.error(`下载图片失败: ${url}`, error);
			// 返回 null 表示下载失败
			return null;
		}
	}

	// 获取图片文件的扩展名的方法
	// 参数: url - 图片的 URL 地址
	// 参数: mimeType - 图片的 MIME 类型（从响应头的 Content-Type 获取）
	// 返回值: string - 图片文件的扩展名（如 png、jpg 等）
	private getImageExtension(url: string, mimeType: string): string {
		// 首先尝试从 MIME 类型中提取扩展名
		if (mimeType && mimeType.startsWith("image/")) {
			// 将 MIME 类型按 "/" 分割，取第二部分作为扩展名
			const mimeExt = mimeType.split("/")[1];
			// 检查扩展名是否在支持的格式列表中
			if (
				mimeExt &&
				["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(
					mimeExt,
				)
			) {
				// 如果扩展名是 "jpeg"，统一转换为 "jpg"
				return mimeExt === "jpeg" ? "jpg" : mimeExt;
			}
		}

		// 如果无法从 MIME 类型获取，尝试从 URL 中提取扩展名
		const urlExtMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
		// 检查正则是否匹配成功
		if (urlExtMatch && urlExtMatch[1]) {
			// 提取扩展名并转换为小写
			const ext = urlExtMatch[1].toLowerCase();
			// 检查扩展名是否在支持的格式列表中
			if (
				["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(
					ext,
				)
			) {
				// 如果扩展名是 "jpeg"，统一转换为 "jpg"
				return ext === "jpeg" ? "jpg" : ext;
			}
		}

		// 如果都无法确定，默认返回 "png" 扩展名
		return "png";
	}

	// 根据用户配置生成文件名的方法
	// 参数: ext - 图片文件的扩展名
	// 返回值: string - 生成的完整文件名（包括扩展名）
	private generateFileName(ext: string): string {
		// 获取当前时间戳（毫秒）
		const timestamp = Date.now();
		// 生成一个 6 位的随机字符串（使用 36 进制）
		const random = Math.random().toString(36).substring(2, 8);

		// 使用用户配置的命名格式，替换占位符为实际值
		let name = this.settings.namingFormat
			.replace("{timestamp}", timestamp.toString()) // 替换 {timestamp} 为时间戳
			.replace("{random}", random); // 替换 {random} 为随机字符串

		// 清理文件名中的非法字符，将 Windows 系统不允许的字符替换为下划线
		name = name.replace(/[<>:"/\\|?*]/g, "_");

		// 返回完整的文件名（基础名称 + 扩展名）
		return `${name}.${ext}`;
	}

	// 延迟执行的辅助方法
	// 参数: ms - 延迟的毫秒数
	// 返回值: Promise<void> - 一个 Promise 对象，在指定时间后 resolve
	private delay(ms: number): Promise<void> {
		// 创建一个 Promise，在指定时间后调用 resolve
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// 下载图片的入口方法，通过功能区图标调用
	private downloadImages(): void {
		// 获取当前活动的 Markdown 视图
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 检查是否成功获取到视图以及编辑器
		if (activeView && activeView.editor) {
			// 调用处理当前笔记的方法
			void this.processCurrentNote(activeView.editor);
		} else {
			// 如果不在 Markdown 视图中，显示提示通知
			new Notice("请在 Markdown 笔记中使用此功能");
		}
	}
}
