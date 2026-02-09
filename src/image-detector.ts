// 导入图片链接接口
import { ImageLink } from "./types";

// 图片检测器类，负责从笔记内容中检测网络图片链接
export class ImageDetector {
	// 检测笔记内容中所有网络图片链接的方法
	// 参数: content - 笔记的完整文本内容
	// 返回值: ImageLink[] - 检测到的所有网络图片链接的数组
	detectNetworkImages(content: string): ImageLink[] {
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
}
