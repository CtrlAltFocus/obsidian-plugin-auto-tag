import {Command, Plugin} from 'obsidian';
import {AutoTagPluginSettings, AutoTagSettingTab, DEFAULT_SETTINGS} from 'src/plugin/settings/settings';
import Logger from './Logger';
import {createCommandList} from './commands/commands';

export default class AutoTagPlugin extends Plugin {
	public settings: AutoTagPluginSettings;
	static Logger = Logger;

	async onload() {
		await this.loadSettings();

		await AutoTagPlugin.Logger.initialize(this.app, this.settings, this.manifest);
		await Logger.log("AutoTag Logger loaded");

		/***************************************
		 *    Initialize the commands
		 ***************************************/
		const commandList: Command[] = createCommandList(this.app, this.settings);
		commandList.forEach((command) => {
			this.addCommand(command);
		});

		/***************************************
		 *    Add the settings tab
		 ***************************************/
		this.addSettingTab(new AutoTagSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
