// 定义网络图片链接的接口，包含图片 URL 和在笔记中的起始、结束位置
export interface ImageLink {
	// 图片的完整 URL 地址
	url: string;
	// 图片链接在笔记内容中的起始位置（字符偏移量）
	startPos: number;
	// 图片链接在笔记内容中的结束位置（字符偏移量）
	endPos: number;
}

// 定义图片处理结果的接口
export interface ProcessingResult {
	// 成功下载的图片数量
	successCount: number;
	// 下载失败的图片数量
	failureCount: number;
}
