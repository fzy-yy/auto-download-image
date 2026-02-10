// 导入 Obsidian 核心类型
import { TFile } from "obsidian";

// 验证结果接口
export interface ValidationResult {
	// 是否验证通过
	valid: boolean;
	// 错误消息
	errorMessage?: string;
}

// 验证器类，负责各种输入验证和安全检查
export class Validator {
	// 验证 URL 格式
	// 参数: url - 要验证的 URL
	// 返回值: ValidationResult - 验证结果
	static validateUrl(url: string): ValidationResult {
		// 检查 URL 是否为空
		if (!url || url.trim().length === 0) {
			return {
				valid: false,
				errorMessage: "URL 不能为空",
			};
		}

		// 检查 URL 是否以 http:// 或 https:// 开头
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			return {
				valid: false,
				errorMessage: "URL 必须以 http:// 或 https:// 开头",
			};
		}

		// 尝试解析 URL
		try {
			new URL(url);
		} catch {
			return {
				valid: false,
				errorMessage: "URL 格式无效",
			};
		}

		// 验证通过
		return { valid: true };
	}

	// 验证文件名
	// 参数: fileName - 要验证的文件名
	// 返回值: ValidationResult - 验证结果
	static validateFileName(fileName: string): ValidationResult {
		// 检查文件名是否为空
		if (!fileName || fileName.trim().length === 0) {
			return {
				valid: false,
				errorMessage: "文件名不能为空",
			};
		}

		// 检查文件名长度
		if (fileName.length > 255) {
			return {
				valid: false,
				errorMessage: "文件名过长（最大 255 个字符）",
			};
		}

		// 检查是否包含非法字符（Windows 系统不允许的字符）
		// eslint-disable-next-line no-control-regex
		const invalidChars = /[<>:"|?*\x00-\x1F]/;
		if (invalidChars.test(fileName)) {
			return {
				valid: false,
				errorMessage: "文件名包含非法字符",
			};
		}

		// 检查是否为保留名称（Windows 保留名称）
		const reservedNames = [
			"CON",
			"PRN",
			"AUX",
			"NUL",
			"COM1",
			"COM2",
			"COM3",
			"COM4",
			"COM5",
			"COM6",
			"COM7",
			"COM8",
			"COM9",
			"LPT1",
			"LPT2",
			"LPT3",
			"LPT4",
			"LPT5",
			"LPT6",
			"LPT7",
			"LPT8",
			"LPT9",
		];
		const parts = fileName.split(".");
		const baseName = parts.length > 0 ? parts[0]!.toUpperCase() : "";
		if (reservedNames.includes(baseName)) {
			return {
				valid: false,
				errorMessage: "文件名使用了系统保留名称",
			};
		}

		// 验证通过
		return { valid: true };
	}

	// 验证文件夹名称
	// 参数: folderName - 要验证的文件夹名称
	// 返回值: ValidationResult - 验证结果
	static validateFolderName(folderName: string): ValidationResult {
		// 检查文件夹名称是否为空
		if (!folderName || folderName.trim().length === 0) {
			return {
				valid: false,
				errorMessage: "文件夹名称不能为空",
			};
		}

		// 检查文件夹名称长度
		if (folderName.length > 255) {
			return {
				valid: false,
				errorMessage: "文件夹名称过长（最大 255 个字符）",
			};
		}

		// 检查是否包含非法字符
		// eslint-disable-next-line no-control-regex
		const invalidChars = /[<>:"|?*\x00-\x1F]/;
		if (invalidChars.test(folderName)) {
			return {
				valid: false,
				errorMessage: "文件夹名称包含非法字符",
			};
		}

		// 检查是否包含路径遍历攻击字符
		if (
			folderName.includes("..") ||
			folderName.startsWith("/") ||
			folderName.startsWith("\\")
		) {
			return {
				valid: false,
				errorMessage: "文件夹名称包含无效字符",
			};
		}

		// 验证通过
		return { valid: true };
	}

	// 验证路径安全性
	// 参数: path - 要验证的路径
	// 返回值: ValidationResult - 验证结果
	static validatePathSafety(path: string): ValidationResult {
		// 检查路径是否为空
		if (!path || path.trim().length === 0) {
			return {
				valid: false,
				errorMessage: "路径不能为空",
			};
		}

		// 检查是否包含路径遍历攻击
		if (path.includes("../") || path.includes("..\\")) {
			return {
				valid: false,
				errorMessage: "路径包含不安全的遍历字符",
			};
		}

		// 检查是否以 . 或 .. 开头
		if (path.startsWith("./") || path.startsWith(".\\")) {
			return {
				valid: false,
				errorMessage: "路径不能以相对路径开头",
			};
		}

		// 验证通过
		return { valid: true };
	}

	// 验证笔记文件
	// 参数: file - 要验证的文件对象
	// 返回值: ValidationResult - 验证结果
	static validateNoteFile(file: TFile | null): ValidationResult {
		// 检查文件是否存在
		if (!file) {
			return {
				valid: false,
				errorMessage: "文件不存在",
			};
		}

		// 检查文件扩展名是否为 md
		if (!file.extension || file.extension.toLowerCase() !== "md") {
			return {
				valid: false,
				errorMessage: "文件不是 Markdown 笔记",
			};
		}

		// 检查文件是否在 Vault 中
		if (!file.path || file.path.length === 0) {
			return {
				valid: false,
				errorMessage: "文件路径无效",
			};
		}

		// 验证通过
		return { valid: true };
	}

	// 验证命名格式
	// 参数: format - 命名格式字符串
	// 返回值: ValidationResult - 验证结果
	static validateNamingFormat(format: string): ValidationResult {
		// 检查格式是否为空
		if (!format || format.trim().length === 0) {
			return {
				valid: false,
				errorMessage: "命名格式不能为空",
			};
		}

		// 检查格式长度
		if (format.length > 200) {
			return {
				valid: false,
				errorMessage: "命名格式过长（最大 200 个字符）",
			};
		}

		// 定义允许的占位符
		const allowedPlaceholders = ["{notename}", "{date}", "{time}"];

		// 提取所有占位符
		const placeholderRegex = /\{[^}]+\}/g;
		const placeholders = format.match(placeholderRegex);

		// 如果有占位符，检查是否都是允许的占位符
		if (placeholders) {
			for (const placeholder of placeholders) {
				if (!allowedPlaceholders.includes(placeholder)) {
					return {
						valid: false,
						errorMessage: `不支持的占位符: ${placeholder}`,
					};
				}
			}
		}

		// 验证通过
		return { valid: true };
	}

	// 清理和验证路径
	// 参数: path - 要清理的路径
	// 返回值: string - 清理后的安全路径
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

	// 清理文件夹名称
	// 参数: name - 要清理的文件夹名称
	// 返回值: string - 清理后的安全文件夹名称
	static sanitizeFolderName(name: string): string {
		// 移除开头和结尾的空白字符
		let cleanedName = name.trim();

		// 替换 Windows 系统不允许的字符为下划线（保留斜杠用于路径）
		cleanedName = cleanedName.replace(/[<>:"|?*]/g, "_");

		// 替换连续的斜杠为单个斜杠
		cleanedName = cleanedName.replace(/\/+/g, "/");

		// 替换连续的反斜杠为单个反斜杠
		cleanedName = cleanedName.replace(/\\+/g, "\\");

		// 如果名称为空，使用默认值
		return cleanedName || "assets";
	}
}
