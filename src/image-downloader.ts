// 导入 Obsidian 核心类型和类
import { requestUrl } from "obsidian";

// 图片下载器类，负责下载网络图片
export class ImageDownloader {
  // 获取图片数据的异步方法
  // 参数: url - 要下载的图片 URL 地址
  // 返回值: Promise<ArrayBuffer> - 图片的二进制数据
  async fetchImageData(url: string): Promise<ArrayBuffer> {
    // 提取 referer 用于 HTTP 请求头
    const referer = this.extractReferer(url);

    // 使用 Obsidian 的 requestUrl API 下载图片，配置请求方法和请求头
    const response = await requestUrl({
      url: url, // 请求的 URL
      method: "GET", // HTTP 请求方法
      headers: this.buildRequestHeaders(referer), // 构建请求头
    });

    // 检查 HTTP 响应状态，如果不是 200-299，抛出错误
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 从响应中获取 ArrayBuffer（二进制数据）
    return response.arrayBuffer;
  }

  // 获取图片 MIME 类型的异步方法
  // 参数: url - 图片的 URL 地址
  // 返回值: Promise<string> - 图片的 MIME 类型
  async getImageMimeType(url: string): Promise<string> {
    try {
      // 使用 HEAD 请求获取响应头
      const response = await requestUrl({
        url: url,
        method: "HEAD",
      });
      // 从响应头中获取 Content-Type
      return response.headers["content-type"] || "";
    } catch {
      // 如果 HEAD 请求失败，返回空字符串
      return "";
    }
  }

  // 构建请求头的方法
  // 参数: referer - HTTP 请求的 Referer 头
  // 返回值: Record<string, string> - 请求头对象
  private buildRequestHeaders(referer: string): Record<string, string> {
    // 返回配置好的请求头对象
    return {
      // 设置 User-Agent，模拟 Chrome 浏览器，避免被反爬
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      // 设置 Accept，表示接受多种图片格式
      Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      // 设置 Accept-Language，支持中文
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      // 设置 Referer，告知服务器请求来源
      Referer: referer,
    };
  }

  // 从 URL 中提取 referer 的方法
  // 参数: url - 图片的 URL 地址
  // 返回值: string - HTTP 请求的 Referer 头
  private extractReferer(url: string): string {
    // 使用 try-catch 尝试使用 URL 构造函数解析 URL
    try {
      // 创建 URL 对象以提取 origin（协议 + 域名 + 端口）
      const urlObj = new URL(url);
      // 提取 URL 的 origin 作为 referer
      return urlObj.origin;
    } catch {
      // 如果 URL 不是标准格式，使用字符串分割作为 fallback
      const parts = url.split("/");
      // 检查分割后的数组是否至少有 3 个元素
      if (parts.length >= 3) {
        // 手动构建 referer：协议 + // + 域名
        return parts[0] + "//" + parts[2];
      } else {
        // 如果 URL 格式非常不规范，直接使用整个 URL 作为 referer
        return url;
      }
    }
  }
}
