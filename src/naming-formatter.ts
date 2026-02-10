// 导入 Obsidian 核心类型
import { TFile } from "obsidian";

// 图片保存位置类型枚举
export enum ImageSaveLocationType {
  // 保存在笔记同级目录下的文件夹
  NOTE_FOLDER = "noteFolder",
  // 保存在库根目录下的指定文件夹
  VAULT_FOLDER = "vaultFolder",
  // 与 Obsidian 附件文件夹保持一致
  OBSIDIAN_ATTACHMENT = "obsidianAttachment",
}

// 图片链接路径类型枚举
export enum ImageLinkPathType {
  // 使用绝对路径（从根目录出发）
  ABSOLUTE = "absolute",
  // 使用相对路径（笔记位置相对于图片文件夹的位置）
  RELATIVE = "relative",
}

// 插件设置的接口，描述所有可配置的选项
export interface AutoDownloadImageSettings {
  // 图片保存位置类型
  imageSaveLocationType: ImageSaveLocationType;
  // 当类型为 NOTE_FOLDER 时，笔记同级目录下的文件夹名称
  noteFolderName: string;
  // 当类型为 VAULT_FOLDER 时，库根目录下的文件夹名称
  vaultFolderName: string;
  // 图片命名格式，支持占位符
  namingFormat: string;
  // 图片链接路径类型
  imageLinkPathType: ImageLinkPathType;
}

// 定义默认设置对象，在用户未配置时使用
export const DEFAULT_SETTINGS: AutoDownloadImageSettings = {
  // 默认保存在笔记同级目录下的文件夹
  imageSaveLocationType: ImageSaveLocationType.NOTE_FOLDER,
  // 默认文件夹名称为 "assets"
  noteFolderName: "assets",
  // 默认文件夹名称为 "attachments"
  vaultFolderName: "attachments",
  // 默认使用笔记名称_日期_时间格式
  namingFormat: "{notename}_{date}_{time}",
  // 默认使用相对路径
  imageLinkPathType: ImageLinkPathType.RELATIVE,
};

// 图片命名格式化器类
export class NamingFormatter {
  // 格式化文件名的方法
  // 参数: format - 命名格式字符串
  // 参数: noteFile - 当前笔记文件对象
  // 返回值: string - 格式化后的文件名（不含扩展名）
  static formatFileName(format: string, noteFile: TFile): string {
    // 获取当前日期时间
    const now = new Date();

    // 替换占位符为实际值
    let fileName = format
      .replace(/{notename}/g, this.getNoteName(noteFile)) // 替换 {notename} 为笔记名称
      .replace(/{date}/g, this.getFormattedDate(now)) // 替换 {date} 为日期
      .replace(/{time}/g, this.getFormattedTime(now)); // 替换 {time} 为时间

    // 清理文件名中的非法字符
    fileName = fileName.replace(/[<>:"/\\|?*]/g, "_");

    // 返回格式化后的文件名
    return fileName;
  }

  // 获取笔记名称的方法（不含扩展名）
  // 参数: noteFile - 笔记文件对象
  // 返回值: string - 笔记名称
  private static getNoteName(noteFile: TFile): string {
    // 返回不含扩展名的文件名
    return noteFile.basename;
  }

  // 获取格式化日期的方法（YYYY-MM-DD）
  // 参数: date - 日期对象
  // 返回值: string - 格式化的日期字符串
  private static getFormattedDate(date: Date): string {
    // 返回 YYYY-MM-DD 格式的日期
    return `${date.getFullYear()}-${this.getPaddedMonth(date)}-${this.getPaddedDay(date)}`;
  }

  // 获取格式化时间的方法（HH-MM-SS）
  // 参数: date - 日期对象
  // 返回值: string - 格式化的时间字符串
  private static getFormattedTime(date: Date): string {
    // 返回 HH-MM-SS 格式的时间
    return `${this.getPaddedHour(date)}-${this.getPaddedMinute(date)}-${this.getPaddedSecond(date)}`;
  }

  // 获取补零月份的方法（01-12）
  // 参数: date - 日期对象
  // 返回值: string - 补零的月份字符串
  private static getPaddedMonth(date: Date): string {
    // 获取月份并补零
    return (date.getMonth() + 1).toString().padStart(2, "0");
  }

  // 获取补零日期的方法（01-31）
  // 参数: date - 日期对象
  // 返回值: string - 补零的日期字符串
  private static getPaddedDay(date: Date): string {
    // 获取日期并补零
    return date.getDate().toString().padStart(2, "0");
  }

  // 获取补零小时的方法（00-23）
  // 参数: date - 日期对象
  // 返回值: string - 补零的小时字符串
  private static getPaddedHour(date: Date): string {
    // 获取小时并补零
    return date.getHours().toString().padStart(2, "0");
  }

  // 获取补零分钟的方法（00-59）
  // 参数: date - 日期对象
  // 返回值: string - 补零的分钟字符串
  private static getPaddedMinute(date: Date): string {
    // 获取分钟并补零
    return date.getMinutes().toString().padStart(2, "0");
  }

  // 获取补零秒数的方法（00-59）
  // 参数: date - 日期对象
  // 返回值: string - 补零的秒数字符串
  private static getPaddedSecond(date: Date): string {
    // 获取秒数并补零
    return date.getSeconds().toString().padStart(2, "0");
  }

  // 生成随机字符串的方法
  // 参数: length - 随机字符串的长度
  // 返回值: string - 随机字符串
  private static getRandomString(length: number): string {
    // 生成指定长度的随机字符串（使用 36 进制）
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }
}
