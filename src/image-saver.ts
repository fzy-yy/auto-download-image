// 导入 Obsidian 核心类型和类
import { TFile, Vault } from "obsidian";

// 图片保存器类，负责将图片保存到本地
export class ImageSaver {
	// Obsidian Vault 实例
	private vault: Vault;
	// 图片保存路径
	private savePath: string;

	// 构造函数，初始化图片保存器
	// 参数: vault - Obsidian Vault 实例
	// 参数: savePath - 图片保存路径
	constructor(vault: Vault, savePath: string) {
		// 保存 Vault 实例
		this.vault = vault;
		// 保存图片保存路径
		this.savePath = savePath;
	}

	// 保存图片到文件的方法
	// 参数: noteFile - 当前笔记文件对象
	// 参数: arrayBuffer - 图片的二进制数据
	// 参数: fileName - 要保存的文件名
	// 返回值: Promise<string> - 图片的相对路径
	async saveImageToFile(
		noteFile: TFile,
		arrayBuffer: ArrayBuffer,
		fileName: string,
	): Promise<string> {
		// 获取笔记文件所在的目录对象
		const noteDir = noteFile.parent;

		// 检查是否成功获取到笔记所在目录
		if (!noteDir) {
			// 如果获取失败，抛出错误
			throw new Error("无法获取笔记所在的目录");
		}

		// 构建文件夹的完整路径：笔记目录 + 保存路径
		const folderPath = `${noteDir.path}/${this.savePath}`;

		// 确保目标文件夹存在
		await this.ensureFolderExists(folderPath);

		// 构建图片文件的完整路径：文件夹路径 + 文件名
		const fullPath = `${folderPath}/${fileName}`;
		// 将 ArrayBuffer 转换为 Uint8Array
		const uint8Array = new Uint8Array(arrayBuffer);
		// 使用 Vault API 将二进制数据写入文件，需要传入 ArrayBuffer
		await this.vault.createBinary(fullPath, uint8Array.buffer);

		// 返回图片的相对路径（用于替换网络链接）
		return fullPath;
	}

	// 确保文件夹存在的方法
	// 参数: folderPath - 文件夹的完整路径
	private async ensureFolderExists(folderPath: string): Promise<void> {
		// 检查该文件夹是否已经存在于 Vault 中
		const existingFolder = this.vault.getAbstractFileByPath(folderPath);
		// 如果文件夹不存在
		if (!existingFolder) {
			// 使用 try-catch 捕获创建文件夹时的异常
			try {
				// 创建文件夹
				await this.vault.createFolder(folderPath);
			} catch (error) {
				// 记录创建文件夹失败的错误
				console.error("创建文件夹失败", error);
				// 抛出错误，终止后续操作
				throw new Error("创建图片保存文件夹失败");
			}
		}
	}
}
