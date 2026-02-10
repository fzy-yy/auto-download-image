// 导入 Obsidian 核心类型和类
import { App, Modal, getLanguage } from "obsidian";
// 导入图片链接接口
import { ImageLink } from "./types";

// 语言类型定义
type Language = "zh" | "en";

// 多语言文本接口
interface Translations {
  title: string;
  message: string;
  cancel: string;
  confirm: string;
}

// 中文翻译
const zhTranslations: Translations = {
  title: "确认下载网络图片",
  message: "即将处理 {count} 张网络图片，是否继续？",
  cancel: "取消",
  confirm: "确认",
};

// 英文翻译
const enTranslations: Translations = {
  title: "Confirm Download Network Images",
  message: "About to process {count} network images, continue?",
  cancel: "Cancel",
  confirm: "Confirm",
};

// 图片下载确认对话框类，继承自 Obsidian 的 Modal 基类
export class ImageDownloadConfirmModal extends Modal {
  // 要处理的图片链接列表
  private imageLinks: ImageLink[];
  // 用户点击确认后的回调函数
  private onConfirm: () => void;
  // 用户取消或关闭对话框时的回调函数
  private onCancel: () => void;
  // 标志，表示是否已经确认
  private confirmed: boolean = false;
  // 当前语言
  private currentLanguage: Language;

  // 构造函数，初始化确认对话框
  // 参数: app - Obsidian 应用实例
  // 参数: imageLinks - 要处理的图片链接列表
  // 参数: onConfirm - 用户点击确认后的回调函数
  constructor(
    app: App,
    imageLinks: ImageLink[],
    onConfirm: () => void,
    onCancel?: () => void,
  ) {
    // 调用父类构造函数，传入应用实例
    super(app);
    // 保存图片链接列表
    this.imageLinks = imageLinks;
    // 保存确认回调函数
    this.onConfirm = onConfirm;
    // 保存取消回调函数（可选）
    this.onCancel = onCancel || (() => {});
    // 检测当前语言
    this.currentLanguage = this.detectLanguage();
  }

  // 检测当前语言
  private detectLanguage(): Language {
    const language = getLanguage();
    // 检测是否为中文（简体或繁体）
    if (language === "zh" || language === "zh-CN" || language === "zh-TW") {
      return "zh";
    }
    // 默认使用英文
    return "en";
  }

  // 获取翻译文本
  private getTranslations(): Translations {
    return this.currentLanguage === "zh" ? zhTranslations : enTranslations;
  }

  // 显示对话框时的方法，构建对话框内容
  onOpen() {
    // 获取对话框的内容元素
    const { contentEl } = this;
    // 获取翻译文本
    const t = this.getTranslations();

    // 设置对话框标题
    contentEl.createEl("h2", { text: t.title });

    // 显示将要处理的图片数量
    contentEl.createEl("p", {
      text: t.message.replace("{count}", String(this.imageLinks.length)),
    });

    // 创建一个容器，用于显示图片链接列表
    const listContainer = contentEl.createDiv({
      cls: "image-links-container",
    });

    // 创建图片链接列表
    const ul = listContainer.createEl("ul", {
      cls: "image-links-list",
    });

    // 遍历所有图片链接，创建列表项
    for (const imageLink of this.imageLinks) {
      const li = ul.createEl("li", {
        cls: "image-link-item",
      });
      // 显示图片 URL
      li.createEl("code", { text: imageLink.url });
    }

    // 创建按钮容器
    const buttonContainer = contentEl.createDiv({
      cls: "button-container",
    });

    // 创建取消按钮
    const cancelButton = buttonContainer.createEl("button", {
      text: t.cancel,
      cls: "mod-cta",
    });
    cancelButton.addEventListener("click", () => {
      // 确保标志为 false
      this.confirmed = false;
      // 点击取消按钮时关闭对话框
      this.close();
    });

    // 创建确认按钮
    const confirmButton = buttonContainer.createEl("button", {
      text: t.confirm,
      cls: "mod-cta",
    });
    confirmButton.addEventListener("click", () => {
      // 设置确认标志为 true
      this.confirmed = true;
      // 点击确认按钮时关闭对话框并执行回调
      this.close();
      this.onConfirm();
    });
  }

  // 关闭对话框时的清理方法
  onClose() {
    // 清空对话框内容，释放内存
    const { contentEl } = this;
    contentEl.empty();
    // 只有在用户未确认的情况下才调用取消回调
    if (!this.confirmed) {
      this.onCancel();
    }
  }
}
