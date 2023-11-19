import {App, FileSystemAdapter, Notice, PluginSettingTab, Setting} from "obsidian";
import AutoTagPlugin from "../autoTagPlugin";
import {createDocumentFragment} from "src/utils/utils";
import {OPENAI_API_MODELS} from "../../services/openaiModelsList";
import {LlmModel} from "../../services/models/openai.models";

export interface AutoTagPluginSettings {
	useAutotagPrefix: boolean;
	useFrontmatterAutotagsKey: boolean;
	tagsFormat: "kebabCase"|"snakeCase"|"pascalCase"|"camelCase"| "pascalSnakeCase"|"trainCase"|"constantCase";
	checkCostEstimation: boolean;
	showPreUpdateDialog: boolean;
	showPostUpdateDialog: boolean;
	demoMode: boolean;
	writeToLogFile: boolean;
	openaiApiKey: string;
	openaiModel: LlmModel;
	openaiTemperature: number;
}

export const DEFAULT_SETTINGS: AutoTagPluginSettings = {
	useAutotagPrefix: true,
	useFrontmatterAutotagsKey: false,
	tagsFormat: "kebabCase",
	checkCostEstimation: true,
	showPreUpdateDialog: true,
	showPostUpdateDialog: true,
	demoMode: true,
	writeToLogFile: false,
	openaiApiKey: "",
	openaiModel: OPENAI_API_MODELS[0],
	openaiTemperature: 0.2,
}

export class AutoTagSettingTab extends PluginSettingTab {
	plugin: AutoTagPlugin;

	constructor(app: App, plugin: AutoTagPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl, app} = this;

		containerEl.empty();

		/***************************************
		 *    Feedback & support
		 ***************************************/

		new Setting(containerEl)
		.setName('Feedback')
		.setDesc(createDocumentFragment(`This plugin is new. Your feedback helps shape what it becomes.<br>- <a href="https://forms.gle/6XWpoHKXRqzSKyZj7" target="_blank">Link to your feedback form</a><br>- by email at <a href="mailto:control.alt.focus@gmail.com">control.alt.focus@gmail.com</a><br>- on X (= Twitter) <a href="https://twitter.com/ctrl_alt_focus" target="_blank"><strong>@ctrl_alt_focus</strong></a>`))
		
		/***************************************
		 *    Main tag settings
		 ***************************************/

		new Setting(containerEl)
		.setHeading()
		.setName('Tagging options');

		new Setting(containerEl)
		.setName(`Prefix newly suggested tags with "#autotag/"`)
		.setDesc(
			createDocumentFragment(`Example: "#autotag/recipe" instead of "#recipe".<br>Read about the benefits and use cases of <a href='https://duckduckgo.com' target='_blank'>nested tags</a>.`)
		)
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
		.setName('How to format tags?')
		.setDesc('You can indicate your own preference. Only applies to new suggested tags, does not update existing tags.')
		.addDropdown(dropdown => dropdown
		.addOption("kebabCase", 'two-words (kebak case)')
		.addOption("snakeCase", 'two_words (snake case)')
		.addOption("pascalCase", 'TwoWords (pascal case)')
		.addOption("camelCase", 'twoWords (camel case)')
		.addOption("pascalSnakeCase", 'Two_Words (pascal snake case)')
		.addOption("trainCase", 'Two-Words (train case)')
		.addOption("constantCase", 'TWO_WORDS (constant case)')
		.setValue(`${this.plugin.settings.tagsFormat}`)
		.onChange(async (value) => {
			this.plugin.settings.tagsFormat = value as AutoTagPluginSettings["tagsFormat"];
			await this.plugin.saveSettings();
		}));

		new Setting(containerEl)
		.setName("See estimated cost before taking action")
		.setDesc(createDocumentFragment("Get an idea of the approximate API cost of fetching tags.<br>Depends on the chosen API service and model used."))
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.checkCostEstimation);
			toggle.onChange(async (toggleValue: boolean) => {
				this.plugin.settings.checkCostEstimation = toggleValue;
				await this.plugin.saveSettings();
			});
		});

		/*
		Possible names for this:
		** "Tag change approval" (or "Tag change confirmation")
		** "Pre-update tag summary" (or "Summary of tag changes")
		"Tag update confirmation" (or "Tag update approval")
		"Suggested tag changes" (or "Suggested tag updates")
		"Tag review and edit" (or ** "Auto tags review and approval")
		*/
		new Setting(containerEl)
		.setName("Review and approve suggested tags before inserting them")
		.setDesc(createDocumentFragment("Shows the suggested tags that will be added to the note.<br>You can make changes before accepting them."))
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.showPreUpdateDialog);
			toggle.onChange(async (toggleValue: boolean) => {
				this.plugin.settings.showPreUpdateDialog = toggleValue;
				await this.plugin.saveSettings();
			});
		});

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
		.setName(`Service provider`);

		new Setting(containerEl)
		.setName(`Service provider to find tags from text`)
		.setDesc(createDocumentFragment(`For now only OpenAI is supported.<br>Ideas and requests are welcome (for better/cheaper/more privacy focused options).`))
		.addDropdown(dropdown => dropdown
			.addOption("openai", 'OpenAI')
			.setValue("openai")
		)
		.setDisabled(true);

		new Setting(containerEl)
		.setName(`OpenAI API model`)
		.setDesc(createDocumentFragment(`The OpenAI <strong>GPT-3.5 Turbo model</strong> is used by default (rather than GPT-4) as it's really good for this task and the cheapest choice. Contact me if this is not enough for your needs.`));

		new Setting(containerEl)
		.setName(`Predictability of the results`)
		.setDesc(createDocumentFragment(`You can change how "creative" the results will be.<br>The default value ("More predictable") offers a good balance between creativity and predictability.`))
			.addDropdown(dropdown => dropdown
				.addOption("0.2", 'More predictable')
				.addOption("0.9", 'More creative')
				.setValue(`${this.plugin.settings.openaiTemperature}`)
				.onChange(async (value) => {
					this.plugin.settings.openaiTemperature = parseFloat(value);
					await this.plugin.saveSettings();
					console.debug('this.plugin.settings.openaiTemperature', this.plugin.settings.openaiTemperature);
				})
			);

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

		/***************************************
		 *    Debugging info & stats
		 ***************************************/

		new Setting(containerEl)
		.setHeading()
		.setName('Debugging info & stats');

		let logFilePath;
		const adapter = app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			logFilePath = `${adapter.getBasePath()}/${this.plugin.manifest.dir}/autotag.log`;

			new Setting(containerEl)
			.setName("Write logs to a log file")
			.setDesc(createDocumentFragment("Helpful for to see what actions the plugin took and what the results were.<br>Log file location:<br>" + (logFilePath ? `<strong>${logFilePath}</strong>` : "(the plugin folder could not be determined)")))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.writeToLogFile);
				toggle.onChange(async (toggleValue: boolean) => {
					this.plugin.settings.writeToLogFile = toggleValue;
					await this.plugin.saveSettings();
				});
			});
		}
	}
}
