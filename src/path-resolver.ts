// 导入 Obsidian 核心类型
import { App, TFile, Vault } from "obsidian";
// 导入类型定义
import { ImageLinkPathType, ImageSaveLocationType } from "./naming-formatter";

// 路径解析器类，负责根据不同的保存位置类型解析图片保存路径
export class PathResolver {
  // Obsidian Vault 实例
  private vault: Vault;
  // Obsidian App 实例
  private app: App;
  // 图片保存位置类型
  private saveLocationType: ImageSaveLocationType;
  // 笔记同级目录下的文件夹名称
  private noteFolderName: string;
  // 库根目录下的文件夹名称
  private vaultFolderName: string;
  // 图片链接路径类型
  private linkPathType: ImageLinkPathType;

  // 构造函数，初始化路径解析器
  // 参数: app - Obsidian App 实例
  // 参数: vault - Obsidian Vault 实例
  // 参数: saveLocationType - 图片保存位置类型
  // 参数: noteFolderName - 笔记同级目录下的文件夹名称
  // 参数: vaultFolderName - 库根目录下的文件夹名称
  // 参数: linkPathType - 图片链接路径类型
  constructor(
    app: App,
    vault: Vault,
    saveLocationType: ImageSaveLocationType,
    noteFolderName: string,
    vaultFolderName: string,
    linkPathType: ImageLinkPathType,
  ) {
    // 保存 App 实例
    this.app = app;
    // 保存 Vault 实例
    this.vault = vault;
    // 保存图片保存位置类型
    this.saveLocationType = saveLocationType;
    // 保存笔记同级目录下的文件夹名称
    this.noteFolderName = noteFolderName;
    // 保存库根目录下的文件夹名称
    this.vaultFolderName = vaultFolderName;
    // 保存图片链接路径类型
    this.linkPathType = linkPathType;
  }

  // 解析图片保存路径的方法
  // 参数: noteFile - 当前笔记文件对象
  // 返回值: Promise<string> - 图片保存的文件夹路径
  async resolveFolderPath(noteFile: TFile): Promise<string> {
    // 根据保存位置类型选择不同的解析方式
    switch (this.saveLocationType) {
      case ImageSaveLocationType.NOTE_FOLDER:
        // 保存在笔记同级目录下的文件夹
        return this.resolveNoteFolderPath(noteFile);
      case ImageSaveLocationType.VAULT_FOLDER:
        // 保存在库根目录下的指定文件夹
        return this.resolveVaultFolderPath();
      case ImageSaveLocationType.OBSIDIAN_ATTACHMENT:
        // 与 Obsidian 附件文件夹保持一致
        return this.resolveObsidianAttachmentPath();
      default:
        // 默认情况，使用笔记同级目录
        return this.resolveNoteFolderPath(noteFile);
    }
  }

  // 解析笔记同级目录下的文件夹路径
  // 参数: noteFile - 当前笔记文件对象
  // 返回值: Promise<string> - 文件夹路径
  private async resolveNoteFolderPath(noteFile: TFile): Promise<string> {
    // 获取笔记文件所在的目录对象
    const noteDir = noteFile.parent;

    // 检查是否成功获取到笔记所在目录
    if (!noteDir) {
      // 如果获取失败，抛出错误
      throw new Error("无法获取笔记所在的目录");
    }

    // 构建文件夹的完整路径：笔记目录 + 文件夹名称
    const folderPath = `${noteDir.path}/${this.noteFolderName}`;

    // 返回文件夹路径
    return folderPath;
  }

  // 解析库根目录下的文件夹路径
  // 返回值: Promise<string> - 文件夹路径
  private async resolveVaultFolderPath(): Promise<string> {
    // 直接返回库根目录下的文件夹名称
    return this.vaultFolderName;
  }

  // 解析 Obsidian 附件文件夹路径
  // 返回值: Promise<string> - 文件夹路径
  private async resolveObsidianAttachmentPath(): Promise<string> {
    try {
      // 获取 Obsidian 配置中的附件文件夹路径
      // 使用类型断言访问 config 属性
      const vaultConfig = (
        this.vault as unknown as {
          config?: {
            attachmentFolderPath?: string;
          };
        }
      ).config;
      const attachmentFolderPath = vaultConfig?.attachmentFolderPath;

      // 检查附件文件夹路径是否存在
      if (!attachmentFolderPath) {
        // 如果不存在，使用默认值
        return "attachments";
      }

      // 如果是 "/"，表示保存到笔记同级目录
      if (attachmentFolderPath === "/") {
        // 返回笔记同级目录（实际路径会在 resolveFolderPath 中处理）
        return "/";
      }

      // 返回 Obsidian 配置的附件文件夹路径
      return attachmentFolderPath;
    } catch {
      // 如果访问配置失败，使用默认值
      return "attachments";
    }
  }

  // 确保文件夹存在的方法
  // 参数: folderPath - 文件夹的完整路径
  // 返回值: Promise<void>
  async ensureFolderExists(folderPath: string): Promise<void> {
    try {
      // 检查该文件夹是否已经存在于 Vault 中
      const existingFolder = this.vault.getAbstractFileByPath(folderPath);
      // 如果文件夹已存在，直接返回
      if (existingFolder) {
        return;
      }

      // 尝试创建文件夹
      await this.vault.createFolder(folderPath);
    } catch (error) {
      // 检查错误信息中是否包含"already exists"
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // 如果错误信息中包含"already exists"，说明文件夹已存在（可能是并发创建导致的），直接返回
      if (errorMessage.includes("already exists")) {
        console.debug("文件夹已存在（并发创建），继续处理");
        return;
      }

      // 如果创建失败，再次检查文件夹是否已经存在（可能由于竞态条件导致）
      const existingFolder = this.vault.getAbstractFileByPath(folderPath);
      if (existingFolder) {
        // 如果文件夹现在存在了，说明是竞态条件导致的错误，可以忽略
        console.debug("文件夹已存在，跳过创建");
        return;
      }

      // 如果文件夹确实不存在且创建失败，记录错误并抛出
      console.error("创建文件夹失败", error);
      // 抛出错误，终止后续操作
      throw new Error("创建图片保存文件夹失败");
    }
  }

  // 解析图片链接路径的方法
  // 参数: noteFile - 当前笔记文件对象
  // 参数: imagePath - 图片文件的完整路径
  // 返回值: string - 图片链接路径（绝对路径或相对路径）
  resolveImageLinkPath(noteFile: TFile, imagePath: string): string {
    // 如果用户选择使用绝对路径，直接返回完整路径
    if (this.linkPathType === ImageLinkPathType.ABSOLUTE) {
      return imagePath;
    }

    // 计算相对路径
    const notePath = noteFile.path;
    const noteDir = notePath.substring(0, notePath.lastIndexOf("/"));

    // 如果图片路径和笔记在同一目录，返回相对路径
    if (imagePath.startsWith(noteDir + "/")) {
      return imagePath.substring(noteDir.length + 1);
    }

    // 计算相对路径层级
    const noteParts = noteDir.split("/");
    const imageParts = imagePath.split("/");
    let relativePath = "";

    // 找到公共父目录
    let commonIndex = 0;
    while (
      commonIndex < noteParts.length &&
      commonIndex < imageParts.length &&
      noteParts[commonIndex] === imageParts[commonIndex]
    ) {
      commonIndex++;
    }

    // 添加向上跳转的层级
    for (let i = commonIndex; i < noteParts.length; i++) {
      relativePath += "../";
    }

    // 添加图片文件的相对路径
    relativePath += imageParts.slice(commonIndex).join("/");

    return relativePath;
  }
}
