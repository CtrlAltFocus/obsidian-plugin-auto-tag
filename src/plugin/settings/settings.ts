/*
 * Look for inspiration and examples on how to code plugin details here:
 * https://www.programcreek.com/typescript/?api=obsidian.ButtonComponent
 */

import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { OPENAI_API_MODELS } from "src/services/openai.api";
import AutoTagPlugin from "../autoTagPlugin";
import { createDocumentFragment } from "src/utils/utils";

export interface AutoTagPluginSettings {
    useAutotagPrefix: boolean;
    useFrontmatterAutotagsKey: boolean;
    tagsToInsert: number;
    showPreUpdateDialog: boolean;
    showPostUpdateDialog: boolean;
    demoMode: boolean;
    writeToLogFile: boolean;
    openaiApiKey: string;
    openaiModel: string;
}

export const DEFAULT_SETTINGS: AutoTagPluginSettings = {
    useAutotagPrefix: true,
    useFrontmatterAutotagsKey: false,
    tagsToInsert: 3,
    showPreUpdateDialog: true,
    showPostUpdateDialog: true,
    demoMode: true,
    writeToLogFile: true,
    openaiApiKey: "",
    openaiModel: OPENAI_API_MODELS[0].id,
}

export class AutoTagSettingTab extends PluginSettingTab {
    plugin: AutoTagPlugin;

    constructor(app: App, plugin: AutoTagPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl, app } = this;

        containerEl.empty();

        /***************************************
         *    Main tag settings
         ***************************************/

        new Setting(containerEl)
            .setHeading()
            .setName('Tag insertion options');

        new Setting(containerEl)
            .setName(`Prefix newly suggested tags with "#autotag/"`)
            .setDesc(createDocumentFragment(`Example: "#autotag/recipe" instead of "#recipe".\nRead about the benefits and use cases of <a href='https://duckduckgo.com' target='_blank'>nested tags</a>.`))
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.useAutotagPrefix)
                toggle.onChange(async (toggleValue: boolean) => {
                    this.plugin.settings.useAutotagPrefix = toggleValue;
                    await this.plugin.saveSettings();
                })
            });

        new Setting(containerEl)
            .setName(`In front-matter insert under "autotags:" instead of "tags:"`)
            .setDesc(createDocumentFragment(`Benefit: don't mix your tags and auto tags in the front matter of your notes.<br>Downside: tags in a different property are not recognized as tags by Obsidian, no auto-complete when typing "#..".`))
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.useFrontmatterAutotagsKey)
                toggle.onChange(async (toggleValue: boolean) => {
                    this.plugin.settings.useFrontmatterAutotagsKey = toggleValue;
                    await this.plugin.saveSettings();
                })
            });

        new Setting(containerEl)
            .setName('Maximum number of tags to request')
            .setDesc('The actual number of tags returned may be less than this number, depending on the AI provider.')
            .addDropdown(dropdown => dropdown
                .addOption("1", '1 tag')
                .addOption("2", '2 tags')
                .addOption("3", '3 tags')
                .addOption("4", '4 tags')
                .addOption("5", '5 tags')
                .addOption("6", '6 tags')
                .addOption("7", '7 tags')
                .addOption("8", '8 tags')
                .addOption("9", '9 tags')
                .addOption("10", '10 tags')
                .setValue(`${this.plugin.settings.tagsToInsert}`)
                .onChange(async (value) => {
                    this.plugin.settings.tagsToInsert = parseInt(value);
                    await this.plugin.saveSettings();
                }));

        /*
        Possible names for this:
        ** "Tag change approval" (or "Tag change confirmation")
        ** "Pre-update tag summary" (or "Summary of tag changes") 
        "Tag update confirmation" (or "Tag update approval")
        "Suggested tag changes" (or "Suggested tag updates")
        "Tag review and edit" (or ** "Auto tags review and approval")
        */
        new Setting(containerEl)
            .setName("Auto tags review and approval BEFORE applying applying any changes")
            .setDesc(createDocumentFragment("Shows the suggested tags that will be added to the note.<br>You can make changes before accepting them."))
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.showPreUpdateDialog);
                toggle.onChange(async (toggleValue: boolean) => {
                    this.plugin.settings.showPreUpdateDialog = toggleValue;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(`Expected something different? or more?`)
            .setDesc(createDocumentFragment(`Please <strong>share your feedback</strong>, dislikes, requests.<br>- by email at <a href="mailto:control.alt.focus@gmail.com">control.alt.focus@gmail.com</a><br>- on X (= Twitter) <a href="https://twitter.com/ctrl_alt_focus" target="_blank"><strong>@ctrl_alt_focus</strong></a>`));

        /***************************************
         *    Demo settings
         ***************************************/

        new Setting(containerEl)
            .setHeading()
            .setName('Test mode / Demo mode');

        new Setting(containerEl)
            .setName(`Use demo mode to test with sample tags`)
            .setDesc(createDocumentFragment(`Test easily without API key or internet connection.<br>Inserts numbered sample tags, instead of generating real tags. Uses the configured settings.`))
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.demoMode)
                toggle.onChange(async (toggleValue: boolean) => {
                    this.plugin.settings.demoMode = toggleValue;
                    await this.plugin.saveSettings();
                })
            });

        /***************************************
         *    Service provider settings 
         ***************************************/

        new Setting(containerEl)
            .setHeading()
            .setName(`Service provider settings`);

        new Setting(containerEl)
            .setName(`Service provider to find tags from text`)
            .setDesc(createDocumentFragment(`For now only OpenAI is supported. More to come!<br>Ideas welcome (cheaper? more privacy focused?).`))
            .addDropdown(dropdown => dropdown
                .addOption("openai", 'OpenAI')
                .setValue("openai")
            )
            .setDisabled(true);

        new Setting(containerEl)
            .setName('OpenAI model')
            .setDesc(createDocumentFragment(`Which model to use depends on cost and size of notes.<br>The default option (${DEFAULT_SETTINGS.openaiModel}) should be the cheapest and be sufficient for most users.`))
            .addDropdown(dropdown =>
                OPENAI_API_MODELS.reduce((dropdown, model) => {
                    return dropdown.addOption(model.id, model.name);
                }, dropdown)
                    .setValue(this.plugin.settings.openaiModel)
                    .onChange(async (modelId) => {
                        this.plugin.settings.openaiModel = modelId;
                        await this.plugin.saveSettings();
                    }));

        new Setting(containerEl)
            .setName('OpenAI API key')
            .setDesc(createDocumentFragment(`Create a new API key at <a href="https://platform.openai.com" target="_blank">https://platform.openai.com</a>, set up your billing (set a max limit of 1$ or 5$ for example) and paste the key here.`))
            .addText(text => text
                .setPlaceholder('secret-key-...')
                .setValue(this.plugin.settings.openaiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openaiApiKey = value;
                    await this.plugin.saveSettings();
                    new Notice('OpenAI API key saved.');
                })
            );
        // TODO add links to billing info and debugging info

        /*************************************** 
         *    Debugging info & stats 
         ***************************************/

        new Setting(containerEl)
            .setHeading()
            .setName('Debugging info & stats');


        new Setting(containerEl)
            .setName("Write logs to a log file")
            .setDesc(createDocumentFragment("Helpful for to see what actions the plugin took and what the results were.<br>The file `autotag.log` will be created in the root of your autotag plugin folder."))
            .addToggle(toggle => {
                toggle.setValue(this.plugin.settings.writeToLogFile);
                toggle.onChange(async (toggleValue: boolean) => {
                    this.plugin.settings.writeToLogFile = toggleValue;
                    await this.plugin.saveSettings();
                });
            });

        // TODO add a way to view the file (display in a modal or so?)
        // TODO low prio: a button to clear (empty) the log file manually (show it when viewing the contents.. to avoid accidental clearing)

        // new ButtonComponent(containerEl)
        //     .setButtonText('Show all known tags and auto tags')
        //     .onClick(async () => {

        //         new AutoTagActionMenuModal(app, this.plugin.settings).open();
        //         new Notice('Not implemented yet.');
        //     });

        // TODO: add a button to view the list of known tags across all files

        // TODO: add a button to trigger opening the graph view, with tags view selected

    }
}
