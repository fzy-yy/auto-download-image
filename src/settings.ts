// 导入 Obsidian 核心类型：App（应用实例）、PluginSettingTab（插件设置选项卡基类）、Setting（设置组件）、DropdownComponent
import { App, DropdownComponent, PluginSettingTab, Setting } from "obsidian";
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
import { ImageUtils } from "./utils";

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

		// 创建图片保存位置设置项
		this.createImageSaveLocationSetting(containerEl);

		// 创建图片链接路径类型设置项
		this.createImageLinkPathTypeSetting(containerEl);

		// 创建图片命名格式设置项
		this.createNamingFormatSetting(containerEl);
	}

	// 创建图片保存位置设置项的方法
	// 参数: containerEl - 设置页面的容器元素
	private createImageSaveLocationSetting(containerEl: HTMLElement): void {
		// 创建设置项容器
		new Setting(containerEl)
			.setName("Image save location") // 设置项的显示名称
			.setDesc("Choose where to save downloaded images") // 设置项的描述说明
			.addDropdown((dropdown: DropdownComponent) => {
				// 添加下拉选项：保存在笔记同级目录下的文件夹
				dropdown.addOption(
					ImageSaveLocationType.NOTE_FOLDER,
					"In note folder (custom subfolder)",
				);
				// 添加下拉选项：保存在库根目录下的指定文件夹
				dropdown.addOption(
					ImageSaveLocationType.VAULT_FOLDER,
					"In vault folder (custom folder in vault root)",
				);
				// 添加下拉选项：与 Obsidian 附件文件夹保持一致
				dropdown.addOption(
					ImageSaveLocationType.OBSIDIAN_ATTACHMENT,
					"Same as Obsidian attachment folder",
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
				.setName("Note folder name") // 设置项的显示名称
				.setDesc(
					"Name of the subfolder in the note's directory (e.g., 'assets', 'images')",
				) // 设置项的描述说明
				.addText((text) =>
					text // 添加文本输入框
						.setPlaceholder("Assets") // 设置输入框的占位符文本
						.setValue(this.plugin.settings.noteFolderName) // 设置输入框的初始值为当前配置
						.onChange(async (value: string) => {
							// 添加值变化事件监听器
							// 清理和验证文件夹名称，移除非法字符
							const cleanedName = ImageUtils.sanitizeFolderName(value);
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
				.setName("Vault folder name") // 设置项的显示名称
				.setDesc(
					"Name of the folder in the vault root (e.g., 'attachments', 'images')",
				) // 设置项的描述说明
				.addText((text) =>
					text // 添加文本输入框
						.setPlaceholder("Attachments") // 设置输入框的占位符文本
						.setValue(this.plugin.settings.vaultFolderName) // 设置输入框的初始值为当前配置
						.onChange(async (value: string) => {
							// 添加值变化事件监听器
							// 清理和验证文件夹名称，移除非法字符
							const cleanedName = ImageUtils.sanitizeFolderName(value);
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
			// 创建说明文本
			const descEl = containerEl.createEl("div", {
				cls: "setting-item-description",
			});
			// 设置说明文本内容
			descEl.textContent =
				"Images will be saved to the same folder as configured in Obsidian's attachment settings.";
		}
	}

	// 创建图片链接路径类型设置项的方法
	// 参数: containerEl - 设置页面的容器元素
	private createImageLinkPathTypeSetting(containerEl: HTMLElement): void {
		// 创建设置项容器
		new Setting(containerEl)
			.setName("Image link path type") // 设置项的显示名称
			.setDesc(
				"Choose whether to use absolute paths or relative paths for image links",
			) // 设置项的描述说明
			.addDropdown((dropdown: DropdownComponent) => {
				// 添加下拉选项：使用绝对路径
				dropdown.addOption(
					ImageLinkPathType.ABSOLUTE,
					"Absolute path (from vault root)",
				);
				// 添加下拉选项：使用相对路径
				dropdown.addOption(
					ImageLinkPathType.RELATIVE,
					"Relative path (from note location, portable)",
				);
				// 设置下拉框的初始值
				dropdown.setValue(this.plugin.settings.imageLinkPathType);
				// 添加值变化事件监听器
				dropdown.onChange(async (value: string) => {
					// 更新插件设置中的图片链接路径类型
					this.plugin.settings.imageLinkPathType =
						value as ImageLinkPathType;
					// 更新路径解析器
					this.plugin.updatePathResolver(this.plugin.settings);
					// 异步保存设置到磁盘
					await this.plugin.saveSettings();
				});
			});
	}

	// 创建图片命名格式设置项的方法
	// 参数: containerEl - 设置页面的容器元素
	private createNamingFormatSetting(containerEl: HTMLElement): void {
		// 创建设置项容器
		new Setting(containerEl)
			.setName("Image naming format") // 设置项的显示名称
			.setDesc("Customize the naming format for downloaded images") // 设置项的描述说明
			.addText((text) =>
				text // 添加文本输入框
					.setPlaceholder("{notename}_{date}_{time}") // 设置输入框的占位符文本
					.setValue(this.plugin.settings.namingFormat) // 设置输入框的初始值为当前配置
					.onChange(async (value: string) => {
						// 添加值变化事件监听器
						// 更新插件设置中的命名格式
						this.plugin.settings.namingFormat = value;
						// 异步保存设置到磁盘
						await this.plugin.saveSettings();
					}),
			);

		// 创建占位符说明文本
		const placeholderDesc = containerEl.createEl("div", {
			cls: "setting-item-description",
		});
		// 创建标题文本
		const strongEl = placeholderDesc.createEl("strong");
		strongEl.textContent = "Available placeholders:";

		// 创建占位符列表
		const placeholderList = containerEl.createEl("ul", {
			cls: "placeholder-list",
		});

		// 添加占位符列表项
		const placeholders = [
			{ name: "{notename}", desc: "Note name (without extension)" },
			{ name: "{notebasename}", desc: "Same as {notename}" },
			{ name: "{date}", desc: "Date in YYYY-MM-DD format" },
			{ name: "{time}", desc: "Time in HH-MM-SS format" },
			{ name: "{datetime}", desc: "Date and time in YYYY-MM-DD_HH-MM-SS format" },
			{ name: "{timestamp}", desc: "Unix timestamp (milliseconds)" },
			{ name: "{year}", desc: "Year (e.g., 2026)" },
			{ name: "{month}", desc: "Month with leading zero (01-12)" },
			{ name: "{day}", desc: "Day with leading zero (01-31)" },
			{ name: "{hour}", desc: "Hour with leading zero (00-23)" },
			{ name: "{minute}", desc: "Minute with leading zero (00-59)" },
			{ name: "{second}", desc: "Second with leading zero (00-59)" },
			{ name: "{random}", desc: "Random string (10 characters)" },
		];

		// 遍历占位符列表，创建列表项
		for (const placeholder of placeholders) {
			const li = placeholderList.createEl("li");
			// 使用安全的 DOM 方法创建内容
			const codeEl = li.createEl("code");
			codeEl.textContent = placeholder.name;
			li.appendText(`: ${placeholder.desc}`);
		}

		// 创建示例说明文本
		const exampleDesc = containerEl.createEl("div", {
			cls: "setting-item-description",
		});
		// 创建示例内容
		const exampleStrong = exampleDesc.createEl("strong");
		exampleStrong.textContent = "Example: ";
		const exampleCode = exampleDesc.createEl("code");
		exampleCode.textContent = "{notename}_{date}_{time}";
		exampleDesc.appendText(" → ");
		const exampleResultCode = exampleDesc.createEl("code");
		exampleResultCode.textContent = "Google搜索语法_2026-02-09_12-58-38.png";
	}
}

// 导出默认设置和类型
export { DEFAULT_SETTINGS };
export type { AutoDownloadImageSettings };
export { ImageSaveLocationType };