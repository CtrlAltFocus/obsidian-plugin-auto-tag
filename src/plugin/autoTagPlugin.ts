import { Command, Notice, Plugin, addIcon } from 'obsidian';
import { AutoTagPluginSettings, AutoTagSettingTab, DEFAULT_SETTINGS } from 'src/plugin/settings/settings';
import Logger from './Logger';
import { createCommandList } from './commands/commands';

export default class AutoTagPlugin extends Plugin {
    public settings: AutoTagPluginSettings;
    static Logger = Logger;

    async onload() {
        await this.loadSettings();

        AutoTagPlugin.Logger.initialize(this.app, this.settings, this.manifest);
        Logger.log("AutoTag Logger loaded");

        /***************************************
         *    Add the ribbon icon
         ***************************************/
        addIcon('auto-tag', '<svg width="100%" height="100%" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22"></path><path d="M26 32H33L40 32"></path><path d="M26 38H33H40"></path><path d="M30 28V42"></path><path d="M36 28V42"></path><path d="M30 4V14H40"></path></g></svg>');
        const ribbonIconEl = this.addRibbonIcon('auto-tag', 'AutoTag', (evt: MouseEvent) => {
            new Notice('This is a notice!');
        });
        ribbonIconEl.addClass('autotag-ribbon-icon');

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

    onunload() { }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
