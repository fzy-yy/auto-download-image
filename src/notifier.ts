// 导入 Obsidian 的 Notice 类
import { Notice } from "obsidian";

// 通知级别枚举
export enum NoticeLevel {
	// 信息级别
	INFO = "info",
	// 成功级别
	SUCCESS = "success",
	// 警告级别
	WARNING = "warning",
	// 错误级别
	ERROR = "error",
}

// 通知管理器类，负责显示各种用户通知
export class Notifier {
	// 显示信息通知
	// 参数: message - 通知消息
	// 参数: duration - 显示时长（毫秒），默认 3000ms
	static info(message: string, duration: number = 3000): void {
		new Notice(message, duration);
	}

	// 显示成功通知
	// 参数: message - 通知消息
	// 参数: duration - 显示时长（毫秒），默认 5000ms
	static success(message: string, duration: number = 5000): void {
		new Notice(message, duration);
	}

	// 显示警告通知
	// 参数: message - 通知消息
	// 参数: duration - 显示时长（毫秒），默认 4000ms
	static warning(message: string, duration: number = 4000): void {
		new Notice(message, duration);
	}

	// 显示错误通知
	// 参数: message - 通知消息
	// 参数: duration - 显示时长（毫秒），默认 6000ms
	static error(message: string, duration: number = 6000): void {
		new Notice(message, duration);
	}

	// 显示处理进度通知
	// 参数: total - 总数量
	// 参数: current - 当前数量
	// 参数: description - 操作描述
	static showProgress(
		total: number,
		current: number,
		description: string = "处理中",
	): void {
		const percentage = Math.round((current / total) * 100);
		const message = `${description}: ${current}/${total} (${percentage}%)`;
		new Notice(message, 2000);
	}

	// 显示处理完成通知
	// 参数: successCount - 成功数量
	// 参数: failureCount - 失败数量
	static showProcessingResult(
		successCount: number,
		failureCount: number,
	): void {
		// 如果全部成功
		if (failureCount === 0) {
			this.success(`处理完成！成功下载 ${successCount} 张图片`);
		}
		// 如果全部失败
		else if (successCount === 0) {
			this.error(`处理失败：${failureCount} 张图片下载失败`);
		}
		// 部分成功
		else {
			this.warning(
				`处理完成！成功 ${successCount} 张，失败 ${failureCount} 张`,
			);
		}
	}

	// 显示正在处理的通知
	// 参数: count - 处理的数量
	static showProcessing(count: number): void {
		this.info(`开始处理 ${count} 张网络图片...`);
	}

	// 显示未找到图片的通知
	static showNoImagesFound(): void {
		this.info("当前笔记中未发现网络图片链接");
	}

	// 显示正在处理的通知（防止重复处理）
	static showAlreadyProcessing(): void {
		this.warning("正在处理图片，请稍候...");
	}

	// 显示无法获取文件的通知
	static showCannotGetFile(): void {
		this.error("无法获取当前文件");
	}

	// 显示不在 Markdown 视图的通知
	static showNotInMarkdownView(): void {
		this.warning("请在 Markdown 笔记中使用此功能");
	}

	// 显示下载失败的通知
	// 参数: url - 失败的图片 URL
	static showDownloadFailure(url: string): void {
		this.error(`下载图片失败: ${url}`);
	}

	// 显示创建文件夹失败的通知
	static showCreateFolderFailure(): void {
		this.error("创建图片保存文件夹失败");
	}
}
