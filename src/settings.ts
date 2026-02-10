// 导入 Obsidian 核心类型：App（应用实例）、PluginSettingTab（插件设置选项卡基类）、Setting（设置组件）、DropdownComponent
import {
  App,
  DropdownComponent,
  PluginSettingTab,
  Setting,
  getLanguage,
} from "obsidian";
// 导入插件主类，用于类型引用
import AutoDownloadImagePlugin from "./main";
// 导入类型定义
import {
  AutoDownloadImageSettings,
  DEFAULT_SETTINGS,
  ImageLinkPathType,
  ImageSaveLocationType,
} from "./naming-formatter";
// 导入工具函数
import { Validator } from "./validator";

// 语言类型定义
type Language = "zh" | "en";

// 多语言文本接口
interface Translations {
  heading: string;
  imageSaveLocation: string;
  imageSaveLocationDesc: string;
  noteFolder: string;
  noteFolderDesc: string;
  vaultFolder: string;
  vaultFolderDesc: string;
  obsidianAttachmentFolder: string;
  obsidianAttachmentFolderDesc: string;
  sameAsNoteFolder: string;
  attachmentsDefault: string;
  imageLinkPathType: string;
  imageLinkPathTypeDesc: string;
  absolutePath: string;
  relativePath: string;
  imageNamingFormat: string;
  imageNamingFormatDesc: string;
  namingPlaceholder: string;
}

// 中文翻译
const zhTranslations: Translations = {
  heading: "自动下载图片设置",
  imageSaveLocation: "图片保存位置",
  imageSaveLocationDesc: "选择图片保存的位置",
  noteFolder: "笔记文件夹名称",
  noteFolderDesc: "笔记目录下的子文件夹名称",
  vaultFolder: "库文件夹名称",
  vaultFolderDesc: "库根目录下的文件夹名称",
  obsidianAttachmentFolder: "Obsidian 附件文件夹",
  obsidianAttachmentFolderDesc: "图片将保存到与 Obsidian 附件设置相同的文件夹",
  sameAsNoteFolder: "与笔记相同",
  attachmentsDefault: "attachments（默认）",
  imageLinkPathType: "图片链接路径类型",
  imageLinkPathTypeDesc: "选择使用绝对路径还是相对路径",
  absolutePath: "绝对路径（从库根目录）",
  relativePath: "相对路径（从笔记位置）",
  imageNamingFormat: "图片命名格式",
  imageNamingFormatDesc: "自定义下载图片的命名格式",
  namingPlaceholder: "{notename}_{date}_{time}",
};

// 英文翻译
const enTranslations: Translations = {
  heading: "Auto download image settings",
  imageSaveLocation: "Image save location",
  imageSaveLocationDesc: "Choose where to save downloaded images",
  noteFolder: "Note folder name",
  noteFolderDesc: "Name of the subfolder in the note's directory",
  vaultFolder: "Vault folder name",
  vaultFolderDesc: "Name of the folder in the vault root",
  obsidianAttachmentFolder: "Obsidian attachment folder",
  obsidianAttachmentFolderDesc:
    "Images will be saved to the same folder as configured in Obsidian's attachment settings",
  sameAsNoteFolder: "Same as note folder",
  attachmentsDefault: "attachments (default)",
  imageLinkPathType: "Image link path type",
  imageLinkPathTypeDesc:
    "Choose whether to use absolute paths or relative paths for image links",
  absolutePath: "Absolute path (from vault root)",
  relativePath: "Relative path (from note location)",
  imageNamingFormat: "Image naming format",
  imageNamingFormatDesc: "Customize the naming format for downloaded images",
  namingPlaceholder: "{notename}_{date}_{time}",
};

// 插件设置选项卡类，继承自 Obsidian 的 PluginSettingTab
// 该类负责在 Obsidian 的设置页面中显示和管理插件的配置选项
export class AutoDownloadImageSettingTab extends PluginSettingTab {
  // 插件实例的引用，用于访问和修改设置
  plugin: AutoDownloadImagePlugin;
  // 当前语言
  private currentLanguage: Language;

  // 构造函数，初始化设置选项卡
  // 参数: app - Obsidian 应用实例
  // 参数: plugin - 插件实例
  constructor(app: App, plugin: AutoDownloadImagePlugin) {
    // 调用父类构造函数，传入应用实例
    super(app, plugin);
    // 保存插件实例的引用
    this.plugin = plugin;
    // 检测并设置当前语言
    this.currentLanguage = this.detectLanguage();
  }

  // 检测当前语言的方法
  // 返回值: Language - 当前语言类型
  private detectLanguage(): Language {
    // 使用 Obsidian 的 getLanguage() 函数获取当前语言
    const language = getLanguage();

    // 如果语言设置为中文（包括简体中文和繁体中文），返回 "zh"
    if (language === "zh" || language === "zh-TW") {
      return "zh";
    }
    // 其他情况返回 "en"
    return "en";
  }

  // 获取翻译文本的方法
  // 返回值: Translations - 当前语言的翻译文本
  private getTranslations(): Translations {
    // 根据当前语言返回对应的翻译
    return this.currentLanguage === "zh" ? zhTranslations : enTranslations;
  }

  // 显示设置页面的方法，当用户打开插件设置时调用
  // 该方法负责构建设置页面的 UI 组件并绑定事件处理器
  display(): void {
    // 从设置选项卡中获取容器元素
    const { containerEl } = this;

    // 清空容器元素，确保设置页面是干净的
    containerEl.empty();

    // 获取当前语言的翻译文本
    const t = this.getTranslations();

    // 使用 Setting 组件创建标题
    new Setting(containerEl).setHeading().setName(t.heading);

    // 创建图片保存位置设置项
    this.createImageSaveLocationSetting(containerEl, t);

    // 创建图片链接路径类型设置项
    this.createImageLinkPathTypeSetting(containerEl, t);

    // 创建图片命名格式设置项
    this.createNamingFormatSetting(containerEl, t);
  }

  // 创建图片保存位置设置项的方法
  // 参数: containerEl - 设置页面的容器元素
  // 参数: t - 翻译文本对象
  private createImageSaveLocationSetting(
    containerEl: HTMLElement,
    t: Translations,
  ): void {
    // 创建设置项容器
    new Setting(containerEl)
      .setName(t.imageSaveLocation) // 设置项的显示名称
      .setDesc(t.imageSaveLocationDesc) // 设置项的描述说明
      .addDropdown((dropdown: DropdownComponent) => {
        // 添加下拉选项：保存在笔记同级目录下的文件夹
        dropdown.addOption(
          ImageSaveLocationType.NOTE_FOLDER,
          this.currentLanguage === "zh"
            ? "笔记同级目录下的文件夹（可自定义子文件夹）"
            : "In note folder (custom subfolder)",
        );
        // 添加下拉选项：保存在库根目录下的指定文件夹
        dropdown.addOption(
          ImageSaveLocationType.VAULT_FOLDER,
          this.currentLanguage === "zh"
            ? "库根目录下的文件夹（可自定义文件夹名）"
            : "In vault folder (custom folder in vault root)",
        );
        // 添加下拉选项：与 Obsidian 附件文件夹保持一致
        dropdown.addOption(
          ImageSaveLocationType.OBSIDIAN_ATTACHMENT,
          this.currentLanguage === "zh"
            ? "与 Obsidian 附件文件夹保持一致"
            : "Same as Obsidian attachment folder",
        );
        // 设置下拉框的初始值
        dropdown.setValue(this.plugin.settings.imageSaveLocationType);
        // 添加值变化事件监听器
        dropdown.onChange(async (value: string) => {
          // 更新插件设置中的图片保存位置类型
          this.plugin.settings.imageSaveLocationType =
            value as ImageSaveLocationType;
          // 更新路径解析器，使设置立即生效
          this.plugin.updatePathResolver(this.plugin.settings);
          // 异步保存设置到磁盘
          await this.plugin.saveSettings();
          // 重新渲染设置页面，以显示/隐藏相关的设置项
          this.display();
        });
      });

    // 根据当前选择的保存位置类型，显示相应的配置选项
    const currentType = this.plugin.settings.imageSaveLocationType;

    // 如果选择了保存在笔记同级目录下的文件夹
    if (currentType === ImageSaveLocationType.NOTE_FOLDER) {
      // 创建笔记同级目录下的文件夹名称设置项
      new Setting(containerEl)
        .setName(t.noteFolder) // 设置项的显示名称
        .setDesc(t.noteFolderDesc) // 设置项的描述说明
        .addText((text) =>
          text // 添加文本输入框
            .setPlaceholder(this.currentLanguage === "zh" ? "Assets" : "Assets") // 设置输入框的占位符文本
            .setValue(this.plugin.settings.noteFolderName) // 设置输入框的初始值为当前配置
            .onChange(async (value: string) => {
              // 添加值变化事件监听器
              // 清理和验证文件夹名称，移除非法字符
              const cleanedName = Validator.sanitizeFolderName(value);
              // 更新插件设置中的文件夹名称
              this.plugin.settings.noteFolderName = cleanedName;
              // 更新路径解析器，使设置立即生效
              this.plugin.updatePathResolver(this.plugin.settings);
              // 异步保存设置到磁盘
              await this.plugin.saveSettings();
            }),
        );
    }

    // 如果选择了保存在库根目录下的指定文件夹
    if (currentType === ImageSaveLocationType.VAULT_FOLDER) {
      // 创建库根目录下的文件夹名称设置项
      new Setting(containerEl)
        .setName(t.vaultFolder) // 设置项的显示名称
        .setDesc(t.vaultFolderDesc) // 设置项的描述说明
        .addText((text) =>
          text // 添加文本输入框
            .setPlaceholder(
              this.currentLanguage === "zh" ? "Attachments" : "Attachments",
            ) // 设置输入框的占位符文本
            .setValue(this.plugin.settings.vaultFolderName) // 设置输入框的初始值为当前配置
            .onChange(async (value: string) => {
              // 添加值变化事件监听器
              // 清理和验证文件夹名称，移除非法字符
              const cleanedName = Validator.sanitizeFolderName(value);
              // 更新插件设置中的文件夹名称
              this.plugin.settings.vaultFolderName = cleanedName;
              // 更新路径解析器，使设置立即生效
              this.plugin.updatePathResolver(this.plugin.settings);
              // 异步保存设置到磁盘
              await this.plugin.saveSettings();
            }),
        );
    }

    // 如果选择了与 Obsidian 附件文件夹保持一致
    if (currentType === ImageSaveLocationType.OBSIDIAN_ATTACHMENT) {
      // 创建只读的文件夹名称显示项
      new Setting(containerEl)
        .setName(t.obsidianAttachmentFolder) // 设置项的显示名称
        .setDesc(t.obsidianAttachmentFolderDesc) // 设置项的描述说明
        .addText((text) => {
          // 设置输入框为只读
          text.setDisabled(true);
          // 尝试获取 Obsidian 配置的附件文件夹路径
          const vaultConfig = (
            this.app.vault as unknown as {
              config?: {
                attachmentFolderPath?: string;
              };
            }
          ).config;
          const attachmentFolderPath = vaultConfig?.attachmentFolderPath;

          // 如果配置了附件文件夹路径
          if (attachmentFolderPath) {
            // 如果路径是 "/"，显示 "Same as note folder"
            if (attachmentFolderPath === "/") {
              text.setValue(t.sameAsNoteFolder);
            } else {
              // 显示配置的附件文件夹路径
              text.setValue(attachmentFolderPath);
            }
          } else {
            // 如果没有配置，显示默认值
            text.setValue(t.attachmentsDefault);
          }
        });
    }
  }

  // 创建图片链接路径类型设置项的方法
  // 参数: containerEl - 设置页面的容器元素
  // 参数: t - 翻译文本对象
  private createImageLinkPathTypeSetting(
    containerEl: HTMLElement,
    t: Translations,
  ): void {
    // 创建设置项容器
    new Setting(containerEl)
      .setName(t.imageLinkPathType) // 设置项的显示名称
      .setDesc(t.imageLinkPathTypeDesc) // 设置项的描述说明
      .addDropdown((dropdown: DropdownComponent) => {
        // 添加下拉选项：使用绝对路径
        dropdown.addOption(ImageLinkPathType.ABSOLUTE, t.absolutePath);
        // 添加下拉选项：使用相对路径
        dropdown.addOption(ImageLinkPathType.RELATIVE, t.relativePath);
        // 设置下拉框的初始值
        dropdown.setValue(this.plugin.settings.imageLinkPathType);
        // 添加值变化事件监听器
        dropdown.onChange(async (value: string) => {
          // 更新插件设置中的图片链接路径类型
          this.plugin.settings.imageLinkPathType = value as ImageLinkPathType;
          // 更新路径解析器
          this.plugin.updatePathResolver(this.plugin.settings);
          // 异步保存设置到磁盘
          await this.plugin.saveSettings();
        });
      });
  }

  // 创建图片命名格式设置项的方法
  // 参数: containerEl - 设置页面的容器元素
  // 参数: t - 翻译文本对象
  private createNamingFormatSetting(
    containerEl: HTMLElement,
    t: Translations,
  ): void {
    // 创建设置项容器
    new Setting(containerEl)
      .setName(t.imageNamingFormat) // 设置项的显示名称
      .setDesc(t.imageNamingFormatDesc) // 设置项的描述说明
      .addText((text) =>
        text // 添加文本输入框
          .setPlaceholder(t.namingPlaceholder) // 设置输入框的占位符文本
          .setValue(this.plugin.settings.namingFormat) // 设置输入框的初始值为当前配置
          .onChange(async (value: string) => {
            // 添加值变化事件监听器
            // 更新插件设置中的命名格式
            this.plugin.settings.namingFormat = value;
            // 异步保存设置到磁盘
            await this.plugin.saveSettings();
          }),
      );
  }
}

// 导出默认设置和类型
export { DEFAULT_SETTINGS, ImageSaveLocationType };
export type { AutoDownloadImageSettings };
