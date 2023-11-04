import AutoTagPlugin from "main";
import {Editor, EditorPosition, MarkdownView, Notice} from "obsidian";
import {PreUpdateModal} from "src/plugin/modals/preUpdateModal/preUpdateModal";
import {AutoTagPluginSettings} from "src/plugin/settings/settings";
import {getTagSuggestions} from "src/services/openai.api";
import {createDocumentFragment, customCaseConversion} from "src/utils/utils";
import {kebabCase, camelCase, pascalCase, snakeCase, constantCase, pascalSnakeCase, trainCase} from "change-case";

// Several combinations:
// - insert demo tags or real tags (real -> fetch them first)
// - insert in frontmatter or after the selected text

const getAutoTags = async (inputText: string, settings: AutoTagPluginSettings) => {
	let autotags: string[];
	if (settings.demoMode) {
		autotags = [
			// English
			"Healthy and Tasty",
			// French
			"Cuisine Facile",
			// Chinese
			"健康美味",
			// Japanese
			"健康的な美味しい",
			// Korean
			"건강하고 맛있는",
			// Arabic
			"طعام صحي",
			// Russian
			"Здоровая еда",
			// Hindi
			"स्वास्थ्यकर और स्वादिष्ट",
			// Thai
			"อาหารที่ดีต่อสุขภาพ",
			// Portuguese
			"Comida Saudável"
		];
	} else if (settings.openaiApiKey.length > 0) {
		// Remove the frontmatter from the document; should not be taken into account for tag generation.
		let mainInputText;
		try {
			const YAMLFrontMatter = /---\s*[\s\S]*?\s*---/g;
			mainInputText = inputText.replace(YAMLFrontMatter, "");
		} catch (err) {
			throw new Error("Error removing YML from message" + err);
		}

		autotags = await getTagSuggestions(mainInputText, settings.openaiApiKey) || [];
	} else {
		const notice = createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: OpenAI API key is missing. Please add it in the plugin settings.`);
		new Notice(notice);
		return [];
	}

	try {
		// Avoid empty tags
		autotags = autotags.filter((tag) => tag.length > 0);

		// Remove accents from letters (unneeded unless I add an option for users of languages such as french)
		// autotags = autotags.map((tag) => tag.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

		// Remove punctuation and various symbols that have no place in tags (unneeded probably; keeping as backup as it's tested and works well)
		// autotags = autotags.map((tag) => tag.replace(/[-_/\\@#$%^&*{}"'|<>~`’”§±¡™£¢∞¶•ªº–≠“‘æ…≥≤œ∑´®†¥¨ˆøπåß∂ƒ©˙∆˚¬Ω≈√∫˜()[\]=+]+/g, ''));

		// Apply tag formatting preference
		autotags = autotags.map((tag) => {
			// Check if tag contains any characters outside of the Basic Latin and Latin-1 Supplement blocks
			const notLatin = /[^\u0020-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]/.test(tag);

			if (notLatin) {
				return customCaseConversion(tag, settings.tagsFormat);
			}

			switch (settings.tagsFormat) {
				case "kebabCase":
					return kebabCase(tag);
				case "snakeCase":
					return snakeCase(tag);
				case "pascalCase":
					return pascalCase(tag);
				case "camelCase":
					return camelCase(tag);
				case "constantCase":
					return constantCase(tag);
				case "pascalSnakeCase":
					return pascalSnakeCase(tag);
				case "trainCase":
					return trainCase(tag);
				default:
					return kebabCase(tag);
			}
		});
	} catch (error) {
		AutoTagPlugin.Logger.error(error);
		const notice = createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error sanitizing tags: {{errorMessage}}`, {errorMessage: error.message});
		new Notice(notice);
	}

	if (settings.useAutotagPrefix) {
		autotags = autotags.map(tag => `autotag/${tag}`);
	}

	return autotags;
};

/**
 * Inserts or updates the "tags" field in the frontmatter of a document.
 *
 * @param view
 * @param newTags - An array of tags to be inserted or appended.
 * @param editor - The editor instance containing the content to modify.
 * @param settings - The AutoTagPluginSettings object, may help indicate how to insert the tags, under which key.
 * @returns A boolean indicating whether the operation was successful or not.
 */
export const insertTagsInFrontMatter = async (view: MarkdownView, newTags: string[], editor: Editor, settings: AutoTagPluginSettings): Promise<boolean> => {
	if (!view.file) {
		AutoTagPlugin.Logger.error("insertTagsInFrontMatter: view.file is null.");
		return false;
	}
	try {
		const frontmatterKey = settings.useFrontmatterAutotagsKey ? 'autotags' : 'tags';

		await view.app.fileManager.processFrontMatter(view.file, (frontmatter: {
			autotags?: string[];
			tags: string[]
		}) => {
			if (!frontmatter[frontmatterKey]) {
				AutoTagPlugin.Logger.log(`Front matter ${frontmatterKey} key created.`);
			}

			frontmatter[frontmatterKey] = (frontmatter[frontmatterKey] || []).concat(newTags);

			// TODO filter out duplicate tags (and inform user afterwards of what tags were inserted or not)
			// TODO let user pick in what order the tags are inserted? or alphabetical order by default, keep options simple?
		});

		const notice = createDocumentFragment(`<strong>Auto Tag plugin</strong><br>${newTags.length} tags inserted`);
		new Notice(notice);
		AutoTagPlugin.Logger.log(`Inserted ${newTags.length} tags in frontmatter [${newTags.map((tag) => `#${tag}`).join(", ")}]`);
	} catch (error) {
		AutoTagPlugin.Logger.error(error);
		const notice = createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: {{errorMessage}}`, {errorMessage: error.message});
		new Notice(notice);
		return false;
	}

	return true;
};

const insertTags = async (view: MarkdownView, insertLocation: "frontmatter" | "after-selection" | "before-selection", suggestedTags: string[], editor: Editor, settings: AutoTagPluginSettings, initialCursorPos: EditorPosition, selectedTextLength: number) => {
	if (insertLocation === "frontmatter") {
		await insertTagsInFrontMatter(view, suggestedTags, editor, settings);

		// TODO show modal "Document already had tags abc, we added new tags xyz"
	} else if (insertLocation === "after-selection") {
		// https://stackoverflow.com/questions/23733455/inserting-a-new-text-at-given-cursor-position
		// https://docs.obsidian.md/Reference/TypeScript+API/EditorPosition/EditorPosition
		const endOfSelectedText = {
			line: initialCursorPos.line,
			ch: initialCursorPos.ch + selectedTextLength
		};
		editor.setCursor(endOfSelectedText);
		AutoTagPlugin.Logger.log(`Inserting tags after the selected text.`);
		// TODO insert tags after the selected text
	} else if (insertLocation === "before-selection") {
		editor.setCursor(initialCursorPos);
		AutoTagPlugin.Logger.log(`Inserting tags before the selected text.`);
		// TODO insert tags before the selected text
	} else {
		AutoTagPlugin.Logger.error(`Unknown insertLocation: ${insertLocation}`);
		const notice = createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Unknown insertLocation.`);
		new Notice(notice);
	}
}

/**
 * This function takes the selected text or note contents, fetches tag suggestions for it, and inserts them in the note.
 */
export const commandFnInsertTagsForSelectedText = async (editor: Editor, view: MarkdownView, settings: AutoTagPluginSettings, insertLocation: "frontmatter" | "after-selection" | "before-selection" = "frontmatter") => {
	const initialCursorPos: EditorPosition = editor.getCursor();

	/**
	 * Get the selected text for which to fetch tag suggestions.
	 */
	let selectedText = editor.getSelection();
	const selectedTextLength = selectedText.length;

	if (selectedText) {
		AutoTagPlugin.Logger.debug(`Finding tags for user-selected text (${selectedText.length} chars)`);
	} else if (insertLocation === "frontmatter") {
		selectedText = editor.getValue();
		AutoTagPlugin.Logger.debug(`Finding tags for full note contents (${selectedText.length} chars)`);
	} else {
		const notice = createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Please select some text first.`);
		new Notice(notice);
		return;
	}

	if (!settings.demoMode && (settings.openaiApiKey.length === 0 || !settings.openaiApiKey)) {
		const notice = createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: OpenAI API key is missing. Please add it in the plugin settings.`);
		new Notice(notice);
		return;
	}

	// TODO get existing tags from the text, display them in the modal too

	// TODO as long as we use any AI service, call a function to estimate the number of tokens in the selected text and then estimate the cost
	// TODO if cost seems high or number of tokens is near the limit, display a warning and ask for confirmation

	/**
	 * Retrieve tag suggestions.
	 */
	const suggestedTags = await getAutoTags(selectedText, settings) || [];

	if (settings.showPreUpdateDialog) {
		new PreUpdateModal(app, settings, suggestedTags, async (acceptedTags: string[]) => {
			AutoTagPlugin.Logger.debug("Tags accepted for insertion:", acceptedTags);

			/**
			 * Insert only the tags accepted by the user in the modal.
			 */
			await insertTags(view, insertLocation, acceptedTags, editor, settings, initialCursorPos, selectedTextLength);
		}).open();
	} else {
		/**
		 * Insert the tags in the note right away.
		 */
		await insertTags(view, insertLocation, suggestedTags, editor, settings, initialCursorPos, selectedTextLength);
	}
}
