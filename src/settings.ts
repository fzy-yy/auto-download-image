// 导入 Obsidian 核心类型：App（应用实例）、PluginSettingTab（插件设置选项卡基类）、Setting（设置组件）
import { App, PluginSettingTab, Setting } from "obsidian";
// 导入插件主类，用于类型引用
import AutoDownloadImagePlugin from "./main";
// 导入工具函数
import { ImageUtils } from "./utils";

// 定义插件设置的接口，描述所有可配置的选项
export interface AutoDownloadImageSettings {
	// 图片保存路径，相对于笔记所在目录（如 "assets" 或 "images"）
	imageSavePath: string;
	// 图片命名格式，支持占位符（如 "{timestamp}" 或 "{random}"）
	namingFormat: string;
}

// 定义默认设置对象，在用户未配置时使用
export const DEFAULT_SETTINGS: AutoDownloadImageSettings = {
	// 默认保存到 "assets" 文件夹
	imageSavePath: "assets",
	// 默认使用时间戳命名
	namingFormat: "{timestamp}",
};

// 插件设置选项卡类，继承自 Obsidian 的 PluginSettingTab
// 该类负责在 Obsidian 的设置页面中显示和管理插件的配置选项
export class AutoDownloadImageSettingTab extends PluginSettingTab {
	// 插件实例的引用，用于访问和修改设置
	plugin: AutoDownloadImagePlugin;

	// 构造函数，初始化设置选项卡
	// 参数: app - Obsidian 应用实例
	// 参数: plugin - 插件实例
	constructor(app: App, plugin: AutoDownloadImagePlugin) {
		// 调用父类构造函数，传入应用实例
		super(app, plugin);
		// 保存插件实例的引用
		this.plugin = plugin;
	}

	// 显示设置页面的方法，当用户打开插件设置时调用
	// 该方法负责构建设置页面的 UI 组件并绑定事件处理器
	display(): void {
		// 从设置选项卡中获取容器元素
		const { containerEl } = this;

		// 清空容器元素，确保设置页面是干净的
		containerEl.empty();

		// 使用 Setting 组件创建标题
		new Setting(containerEl)
			.setHeading()
			.setName("Auto download image settings");

		// 创建第一个设置项：图片保存路径
		// 该设置项允许用户指定图片保存的相对路径
		new Setting(containerEl)
			.setName("Image save path") // 设置项的显示名称
			.setDesc(
				'Relative path to save images (e.g., "assets" or "images")',
			) // 设置项的描述说明
			.addText((text) =>
				text // 添加文本输入框
					.setPlaceholder("Assets") // 设置输入框的占位符文本
					.setValue(this.plugin.settings.imageSavePath) // 设置输入框的初始值为当前配置
					.onChange(async (value) => {
						// 添加值变化事件监听器
						// 清理和验证路径，移除非法字符
						const cleanedPath = ImageUtils.sanitizePath(value);
						// 更新插件设置中的图片保存路径
						this.plugin.settings.imageSavePath = cleanedPath;
						// 更新 imageSaver 的保存路径
						this.plugin.updateImageSaverPath(cleanedPath);
						// 异步保存设置到磁盘
						await this.plugin.saveSettings();
					}),
			);

		// 创建第二个设置项：图片命名格式
		// 该设置项允许用户自定义图片的命名格式
		new Setting(containerEl)
			.setName("Naming format") // 设置项的显示名称
			.setDesc(
				"Image naming format. Use {timestamp} for timestamp, {random} for random string",
			) // 设置项的描述说明
			.addText((text) =>
				text // 添加文本输入框
					.setPlaceholder("{timestamp}") // 设置输入框的占位符文本
					.setValue(this.plugin.settings.namingFormat) // 设置输入框的初始值为当前配置
					.onChange(async (value) => {
						// 添加值变化事件监听器
						// 更新插件设置中的命名格式
						this.plugin.settings.namingFormat = value;
						// 异步保存设置到磁盘
						await this.plugin.saveSettings();
					}),
			);
	}
}
