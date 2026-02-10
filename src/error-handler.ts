// 导入 Obsidian 的 Notice 类
import { Notice } from "obsidian";

// 错误类型枚举
export enum ErrorType {
	// 网络请求错误
	NETWORK_ERROR = "network_error",
	// 文件操作错误
	FILE_ERROR = "file_error",
	// 权限错误
	PERMISSION_ERROR = "permission_error",
	// URL 格式错误
	URL_ERROR = "url_error",
	// 其他未知错误
	UNKNOWN_ERROR = "unknown_error",
}

// 自定义错误类
export class PluginError extends Error {
	// 错误类型
	errorType: ErrorType;
	// 原始错误
	originalError?: Error;
	// 错误上下文信息
	context?: Record<string, unknown>;

	// 构造函数
	// 参数: message - 错误消息
	// 参数: errorType - 错误类型
	// 参数: originalError - 原始错误对象
	// 参数: context - 错误上下文信息
	constructor(
		message: string,
		errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
		originalError?: Error,
		context?: Record<string, unknown>,
	) {
		super(message);
		this.name = "PluginError";
		this.errorType = errorType;
		this.originalError = originalError;
		this.context = context;
	}
}

// 错误处理器类
export class ErrorHandler {
	// 处理错误并显示用户友好的提示
	// 参数: error - 错误对象
	// 参数: showMessage - 是否显示通知消息
	static handle(error: unknown, showMessage: boolean = true): void {
		// 将错误转换为 PluginError
		const pluginError = this.normalizeError(error);

		// 在控制台打印详细的错误日志
		this.logError(pluginError);

		// 如果需要显示通知，显示用户友好的错误消息
		if (showMessage) {
			this.showNotice(pluginError);
		}
	}

	// 标准化错误对象
	// 参数: error - 原始错误对象
	// 返回值: PluginError - 标准化的错误对象
	private static normalizeError(error: unknown): PluginError {
		// 如果已经是 PluginError，直接返回
		if (error instanceof PluginError) {
			return error;
		}

		// 如果是标准 Error 对象
		if (error instanceof Error) {
			// 根据错误消息判断错误类型
			const errorType = this.determineErrorType(error.message);
			return new PluginError(error.message, errorType, error);
		}

		// 如果是字符串
		if (typeof error === "string") {
			const errorType = this.determineErrorType(error);
			return new PluginError(error, errorType);
		}

		// 其他情况，返回未知错误
		return new PluginError(
			"发生未知错误",
			ErrorType.UNKNOWN_ERROR,
			undefined,
		);
	}

	// 根据错误消息确定错误类型
	// 参数: message - 错误消息
	// 返回值: ErrorType - 错误类型
	private static determineErrorType(message: string): ErrorType {
		const lowerMessage = message.toLowerCase();

		// 检查是否是网络错误
		if (
			lowerMessage.includes("network") ||
			lowerMessage.includes("fetch") ||
			lowerMessage.includes("http") ||
			lowerMessage.includes("timeout") ||
			lowerMessage.includes("enotfound")
		) {
			return ErrorType.NETWORK_ERROR;
		}

		// 检查是否是文件操作错误
		if (
			lowerMessage.includes("enoent") ||
			lowerMessage.includes("eacces") ||
			lowerMessage.includes("file") ||
			lowerMessage.includes("folder")
		) {
			return ErrorType.FILE_ERROR;
		}

		// 检查是否是权限错误
		if (
			lowerMessage.includes("permission") ||
			lowerMessage.includes("unauthorized") ||
			lowerMessage.includes("forbidden")
		) {
			return ErrorType.PERMISSION_ERROR;
		}

		// 检查是否是 URL 格式错误
		if (
			lowerMessage.includes("invalid url") ||
			lowerMessage.includes("malformed") ||
			lowerMessage.includes("url")
		) {
			return ErrorType.URL_ERROR;
		}

		// 默认返回未知错误
		return ErrorType.UNKNOWN_ERROR;
	}

	// 在控制台打印错误日志
	// 参数: error - 错误对象
	private static logError(error: PluginError): void {
		// 打印错误类型和消息
		console.error(
			`[Auto Download Image] ${error.errorType}: ${error.message}`,
		);

		// 如果有原始错误，打印原始错误堆栈
		if (error.originalError) {
			console.error("原始错误:", error.originalError);
		}

		// 如果有上下文信息，打印上下文
		if (error.context) {
			console.error("错误上下文:", error.context);
		}
	}

	// 显示用户友好的错误通知
	// 参数: error - 错误对象
	private static showNotice(error: PluginError): void {
		// 根据错误类型生成用户友好的消息
		let userMessage = "";

		switch (error.errorType) {
			case ErrorType.NETWORK_ERROR:
				userMessage = "网络错误，请检查网络连接";
				break;
			case ErrorType.FILE_ERROR:
				userMessage = "文件操作失败，请检查文件权限";
				break;
			case ErrorType.PERMISSION_ERROR:
				userMessage = "权限不足，无法执行操作";
				break;
			case ErrorType.URL_ERROR:
				userMessage = "图片链接格式错误";
				break;
			default:
				userMessage = "操作失败，请查看控制台了解详情";
		}

		// 显示通知
		new Notice(userMessage);
	}

	// 包装异步操作，自动处理错误
	// 参数: operation - 异步操作函数
	// 参数: context - 操作上下文
	// 参数: showMessage - 是否显示错误通知
	// 返回值: Promise<T> - 操作结果
	static async wrap<T>(
		operation: () => Promise<T>,
		context?: string,
		showMessage: boolean = true,
	): Promise<T | null> {
		try {
			return await operation();
		} catch (error) {
			// 添加上下文信息
			if (context) {
				(error as PluginError).context = { context };
			}
			this.handle(error, showMessage);
			return null;
		}
	}
}
