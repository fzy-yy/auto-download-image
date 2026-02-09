// 导入 Obsidian 核心类型和类
import { Editor } from "obsidian";
// 导入图片链接接口
import { ImageLink } from "./types";

// 工具函数类，提供各种辅助方法
export class ImageUtils {
	// 清理和验证路径的方法
	// 参数: path - 要清理的路径
	// 返回值: string - 清理后的有效路径
	static sanitizePath(path: string): string {
		// 移除路径开头和结尾的空白字符
		let cleanedPath = path.trim();
		// 替换 Windows 系统不允许的字符为下划线
		cleanedPath = cleanedPath.replace(/[<>:"|?*]/g, "_");
		// 替换连续的斜杠为单个斜杠
		cleanedPath = cleanedPath.replace(/\/+/g, "/");
		// 替换连续的反斜杠为单个反斜杠
		cleanedPath = cleanedPath.replace(/\\+/g, "\\");
		// 移除路径开头的 . 或 ..，防止路径遍历攻击
		cleanedPath = cleanedPath.replace(/^(\.\/|\.\.\/|\.\\|\.\.\\)+/, "");
		// 如果路径为空，使用默认值
		return cleanedPath || "assets";
	}

	// 获取图片文件的扩展名的方法
	// 参数: url - 图片的 URL 地址
	// 参数: mimeType - 图片的 MIME 类型（从响应头的 Content-Type 获取）
	// 返回值: string - 图片文件的扩展名（如 png、jpg 等）
	static getImageExtension(url: string, mimeType: string): string {
		// 定义支持的图片扩展名列表
		const supportedExtensions = [
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"bmp",
			"svg",
		];

		// 首先尝试从 MIME 类型中提取扩展名
		if (mimeType && mimeType.startsWith("image/")) {
			// 将 MIME 类型按 "/" 分割，取第二部分作为扩展名
			const mimeExt = mimeType.split("/")[1];
			// 检查扩展名是否在支持的格式列表中
			if (mimeExt && supportedExtensions.includes(mimeExt)) {
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
			if (supportedExtensions.includes(ext)) {
				// 如果扩展名是 "jpeg"，统一转换为 "jpg"
				return ext === "jpeg" ? "jpg" : ext;
			}
		}

		// 如果都无法确定，默认返回 "png" 扩展名
		return "png";
	}

	// 根据用户配置生成文件名的方法
	// 参数: ext - 图片文件的扩展名
	// 参数: namingFormat - 命名格式字符串
	// 返回值: string - 生成的完整文件名（包括扩展名）
	static generateFileName(ext: string, namingFormat: string): string {
		// 获取当前时间戳（毫秒）
		const timestamp = Date.now();
		// 生成一个 10 位的随机字符串（使用 36 进制），确保在高并发下也能唯一
		const random = Math.random().toString(36).substring(2, 12);

		// 使用用户配置的命名格式，替换占位符为实际值
		let name = namingFormat
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
	static delay(ms: number): Promise<void> {
		// 创建一个 Promise，在指定时间后调用 resolve
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// 替换单个图片链接的方法
	// 参数: editor - Obsidian 的编辑器实例
	// 参数: imageLink - 要替换的图片链接对象
	// 参数: localPath - 本地图片的相对路径
	static replaceImageLink(
		editor: Editor,
		imageLink: ImageLink,
		localPath: string,
	): void {
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
	}
}
