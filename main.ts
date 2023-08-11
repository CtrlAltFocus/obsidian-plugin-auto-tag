import { App, ButtonComponent, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, stringifyYaml } from 'obsidian';
import { parseYaml } from 'obsidian';
import { OPENAI_API_MODELS, getTagSuggestions } from 'src/services/openai.api';

/*
 * Look for inspiration and examples on how to code plugin details here:
 * https://www.programcreek.com/typescript/?api=obsidian.ButtonComponent
 */

interface AutoTagPluginSettings {
	tagsToInsert: number;
	openaiApiKey: string;
	openaiModel: string;
}

const DEFAULT_SETTINGS: AutoTagPluginSettings = {
	tagsToInsert: 3,
	openaiApiKey: "",
	openaiModel: OPENAI_API_MODELS[0].id,
}

const commandFnInsertTagsForSelectedText = async (editor: Editor, view: MarkdownView, settings: AutoTagPluginSettings) => {
	const initialCursorPos: EditorPosition = editor.getCursor();

	const selectedText = editor.getSelection();
	if (!selectedText) {
		new Notice('Please select text.');
		return;
	}

	let suggestedTags: string[] = [];
	try {
		console.log(`selectedText:`, selectedText);
		console.log(`settings: ${JSON.stringify(settings)}`);
		console.log(`starting getTagSuggestions()...`);
		suggestedTags = await getTagSuggestions(selectedText, settings.openaiApiKey) || [];
		console.log(`suggestedTags:`, suggestedTags);
	} catch (error) {
		new Notice('Error: ' + error);
	}

	try {
		const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
		const content = editor.getValue();
		const match = content.match(frontmatterRegex);

		// const demoTags = ['test', 'test2', 'test3'];
		const demoTags = suggestedTags;

		if (match) {
			const frontmatter = match[1];
			console.log("Frontmatter:", frontmatter);
			let parsedFrontMatter = parseYaml(frontmatter);
			console.log(`parsedFrontMatter:`, parsedFrontMatter);
			if (parsedFrontMatter) {
				if (parsedFrontMatter.tags) {
					const tags = parsedFrontMatter.tags;
					console.log(`existing tags:`, tags);
					parsedFrontMatter.tags = tags.concat(demoTags);
				} else {
					parsedFrontMatter.tags = demoTags;
				}

				const updatedFrontMatter = stringifyYaml(parsedFrontMatter)
				const updatedContent = content.replace(frontmatterRegex, `---\n${updatedFrontMatter.trim()}\n---\n`);
				editor.setValue(updatedContent);
				console.log("Replaced front-matter.", updatedFrontMatter);
			} else {
				parsedFrontMatter = {};
				parsedFrontMatter.tags = demoTags;
				console.log("Create new front-matter.");
				const content = editor.getValue();
				const updatedContent = `---\n${stringifyYaml(parsedFrontMatter).trim()}\n---\n\n${content.trimStart()}`;
				editor.setValue(updatedContent);
			}
			console.log(`updated parsedFrontMatter:`, stringifyYaml(parsedFrontMatter));
		} else {
			console.log('Frontmatter not found.');
			const newFrontMatter = { tags: demoTags };
			console.log("Create new front-matter.");
			const content = editor.getValue();
			const updatedContent = `---\n${stringifyYaml(newFrontMatter).trim()}\n---\n\n${content.trimStart()}`;
			editor.setValue(updatedContent);
		}
	}
	catch (e) {
		new Notice('Error: ' + e);
	} finally {
		editor.setCursor(initialCursorPos);
		// For a selected text: which cursor position? start or end of selection?
		// TODO command options: insert before selection or after selection
	}

	// Update the frontmatter tags
	// const tags = [lastWord];
	// updateFrontmatterTags(editor, []);
}

export default class AutoTagPlugin extends Plugin {
	settings: AutoTagPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		this.addCommand({
			id: 'auto-tag--select-text-insert-tags',
			name: 'insert tags for selected text (insert before/after + frontmatter)',
			editorCallback: async (editor: Editor, view: MarkdownView) => commandFnInsertTagsForSelectedText(editor, view, this.settings)
		});

		// this.addCommand({
		// 	id: 'auto-tag--all-known-tags',
		// 	name: 'show all known tags (insert at cursor)',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		const knownTags = await this.getKnownTags();
		// 		editor.replaceRange(
		// 			knownTags.join(', '),
		// 			editor.getCursor()
		// 		);
		// 	}
		// });

		// this.addCommand({
		// 	id: 'auto-tag--tag-suggestions--for-each-heading-section',
		// 	name: 'suggest tags (for each heading section)',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		const content = editor.getValue();
		// 		const regex = /(#+ .+)(\n)([\s\S]*?)(\n|$)/g;
		// 		const headingsPositions: number[] = [];

		// 		let match;
		// 		while ((match = regex.exec(content)) !== null) {
		// 			const followingText = match[3];
		// 			if (!/^#+\s/.test(followingText)) {
		// 				headingsPositions.push(match.index + match[0].length);
		// 			}
		// 		}

		// 		// Insert "hello world" after each heading at the collected positions
		// 		headingsPositions.reverse(); // Start from the end to avoid misalignment
		// 		for (const pos of headingsPositions) {
		// 			const { line, ch } = editor.getDoc().offsetToPos(pos);
		// 			editor.replaceRange(`INSERTION_POINT_AFTER_HEADING\n`, { line: line, ch: ch });
		// 		}
		// 	}
		// });

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'autotag-action-menu-modal',
			name: 'Action menu display',
			callback: () => {
				new AutoTagActionMenuModal(this.app, this.settings).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AutoTagSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getKnownTags(): Promise<string[]> {
		const { vault, metadataCache } = this.app;
		const tags: string[] = [];

		const fileContents: string[] = await Promise.all(
			vault.getMarkdownFiles().map(async (file) => vault.cachedRead(file))
		);

		let totalLength = 0;
		fileContents.forEach((content) => {
			totalLength += content.length;
		});

		vault.getMarkdownFiles().forEach((file, index) => {
			metadataCache.getFileCache(file)?.tags?.forEach((tag) => {
				if (!tags.includes(tag.tag)) {
					tags.push(tag.tag);
				}
			});
		});

		console.debug(`Found ${tags.length} tags in ${fileContents.length} files with a total length of ${totalLength} characters.`);

		return tags;
	}
}

class AutoTagActionMenuModal extends Modal {
	settings: AutoTagPluginSettings;

	constructor(app: App, settings: AutoTagPluginSettings) {
		super(app);
		this.settings = settings;
	}

	async onOpen() {
		const { contentEl, app } = this;
		const editor = app.workspace.activeEditor?.editor;
		const view = app.workspace.getActiveViewOfType(MarkdownView);

		if (!editor || !view) {
			if (!editor && !view)
				new Notice('Missing active editor and view.');
			else if (!editor)
				new Notice('Missing active editor.');
			else
				new Notice('Missing active view.');
			return;
		}

		contentEl.createEl('h2', { text: 'Auto Tag Action Menu' });

		new ButtonComponent(this.modalEl.createDiv())
			.setButtonText("Cancel")
			.setCta()
			.onClick(() => this.close());

		new ButtonComponent(this.modalEl.createDiv())
			.setButtonText("Cancel 2")
			.setCta()
			.onClick(() => this.close());

		// Create buttons
		const displayNoticeButton = contentEl.createEl('button', { text: 'Display Notice' });
		const closeButton = contentEl.createEl('button', { text: 'Close' });

		// Button click event handlers
		displayNoticeButton.addEventListener('click', async () => {
			this.displayNotice();
			await commandFnInsertTagsForSelectedText(editor, view, this.settings);
		});

		closeButton.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	displayNotice() {
		new Notice('Hello world!');
	}
}

class AutoTagSettingTab extends PluginSettingTab {
	plugin: AutoTagPlugin;

	constructor(app: App, plugin: AutoTagPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

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
				.setValue("5")
				.onChange(async (value) => {
					this.plugin.settings.tagsToInsert = parseInt(value);
					await this.plugin.saveSettings();
				}));

		// TODO have a dropdown to select the AI provider
		// TODO for openAI, have a dropdown to select the model + text input for the model, in case the user wants to use a custom model
		// TODO add links to billing info and debugging info
		new Setting(containerEl)
			.setName('OpenAI API key')
			.setDesc('Create a new one at https://platform.openai.com/, set up your billing and paste the key here')
			.addText(text => text
				.setPlaceholder('secret-key-...')
				.setDisabled(false)
				.setValue(DEFAULT_SETTINGS.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
					new Notice('OpenAI API key saved.');
				})
			);

		new Setting(containerEl)
			.setName('OpenAI model')
			.setDesc('Which model to use depends on cost and size of notes. The default option should be the cheapest and be sufficient for most users.')
			.addDropdown(dropdown =>
				// iterate over all objects of OPENAI_API_MODELS and add them to the
				// dropdown
				OPENAI_API_MODELS.reduce((dropdown, model) => {
					return dropdown.addOption(model.id, model.name);
				}, dropdown)
					.setValue(this.plugin.settings.openaiModel)
					.onChange(async (modelId) => {
						this.plugin.settings.openaiModel = modelId;

						// TODO figure this out
						if (modelId.toLowerCase().includes("gpt-4")) {
							this.plugin.settings.tagsToInsert = 10;
							new Notice("The GPT-4 model is still in beta and may not work as expected. The number of tags to insert has been set to 10.");

							// ?
							// set a dropdown select's selected value to 4
							// tagsToInsertSetting.settingEl. ....
						}

						await this.plugin.saveSettings();
					}));

		new Setting(containerEl)
			.setName('OpenAI temperature')
			.setDesc('Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive. Higher temperature results in more random completions.')
			.descEl.createEl('a', {
				text: 'Read more',
				href: 'https://beta.openai.com/docs/api-reference/completions/create#temperature',
				attr: {
					target: '_blank',
				}
			})


		// TODO: add a button to view the list of known tags across all files


		// TODO: add a button to trigger opening the graph view, with tags view selected

	}
}
