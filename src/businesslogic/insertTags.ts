import AutoTagPlugin from "main";
import { Editor, EditorPosition, MarkdownView, Notice, parseYaml, stringifyYaml } from "obsidian";
import { PreUpdateModal } from "src/plugin/modals/preUpdateModal/preUpdateModal";
import { AutoTagPluginSettings } from "src/plugin/settings/settings";
import { getTagSuggestions } from "src/services/openai.api";
import { createDocumentFragment } from "src/utils/utils";


// Several combinations:
// - insert demo tags or real tags (real -> fetch them first)
// - insert in frontmatter or after the selected text

const getAutoTags = async (inputText: string, settings: AutoTagPluginSettings) => {
    let autotags: string[];
    if (settings.demoMode) {
        autotags = ["recipe", "food", "healthy"];
    } else if (settings.openaiApiKey.length > 0) {
        autotags = await getTagSuggestions(inputText, settings.openaiApiKey) || [];
    } else {
		new Notice(createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: OpenAI API key is missing. Please add it in the plugin settings.`));
		return [];
	}

    if (settings.useAutotagPrefix) {
        autotags = autotags.map(tag => `autotag/${tag}`);
    }

    return autotags;
};

const parseFrontMatter = (content: string): { frontmatter: string; parsedFrontMatter: any } | null => {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    if (match) {
        const frontmatter = match[1];
        const parsedFrontMatter = parseYaml(frontmatter);
        return { frontmatter, parsedFrontMatter };
    }

    return null;
}

const updateOrCreateFrontMatterKey = (parsedFrontMatter: any, key: string, values: string[]): void => {
    if (parsedFrontMatter[key]) {
        const existingValues = parsedFrontMatter[key];
        parsedFrontMatter[key] = existingValues.concat(values);
    } else {
        parsedFrontMatter[key] = values;
    }
}

const updateFrontMatterContent = (editor: Editor, frontmatterRegex: RegExp, updatedFrontMatter: string): void => {
    const content = editor.getValue();
    const updatedContent = content.replace(frontmatterRegex, `---\n${updatedFrontMatter.trim()}\n---\n`);
    editor.setValue(updatedContent);
}

/**
 * Inserts or updates the "tags" field in the frontmatter of a document.
 * 
 * @param newTags - An array of tags to be inserted or appended.
 * @param editor - The editor instance containing the content to modify.
 * @param settings - The AutoTagPluginSettings object, may help indicate how to insert the tags, under which key.
 * @returns A boolean indicating whether the operation was successful or not.
 */
export const insertTagsInFrontMatter = (newTags: string[], editor: Editor, settings: AutoTagPluginSettings): boolean => {
    try {
        const content = editor.getValue();
        const result = parseFrontMatter(content);

        const frontmatterKey = settings.useFrontmatterAutotagsKey ? 'autotags' : 'tags';

		// TODO simplify: create frontmatter if not found. Then just insert tags into it.

        if (result) {
            updateOrCreateFrontMatterKey(result.parsedFrontMatter, frontmatterKey, newTags);
            const updatedFrontMatter = stringifyYaml(result.parsedFrontMatter);
            updateFrontMatterContent(editor, /^---\n([\s\S]*?)\n---\n/, updatedFrontMatter);
        } else {
            // If no frontmatter is found, create a new one with the suggested tags
            AutoTagPlugin.Logger.debug('Frontmatter not found. Creating new frontmatter');
            const newFrontMatter = { [frontmatterKey]: newTags };
            const updatedContent = `---\n${stringifyYaml(newFrontMatter).trim()}\n---\n\n${content.trimStart()}`;
            editor.setValue(updatedContent);
        }
		new Notice(createDocumentFragment(`<strong>Auto Tag plugin</strong><br>${newTags.length} tags inserted`));
		AutoTagPlugin.Logger.log(`Inserted ${newTags.length} tags in frontmatter [${newTags.map((tag) => `#${tag}`).join(", ")}]`);
    } catch (error) {
        AutoTagPlugin.Logger.error(error);
        new Notice(createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: ${error.message}`));
        return false;
    }

    return true;
};

const insertTags = (insertLocation: "frontmatter" | "after-selection" | "before-selection", suggestedTags: string[], editor: Editor, settings: AutoTagPluginSettings, initialCursorPos: EditorPosition, selectedTextLength: number) => {
	if (insertLocation === "frontmatter") {
		insertTagsInFrontMatter(suggestedTags, editor, settings);

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
		new Notice(createDocumentFragment("<strong>Auto Tag plugin</strong><br>Unknown insertLocation."));
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
        new Notice(createDocumentFragment("<strong>Auto Tag plugin</strong><br>Please select some text first."));
        return;
    }

	if (!settings.demoMode && (settings.openaiApiKey.length === 0 || !settings.openaiApiKey)) {
		new Notice(createDocumentFragment(`<strong>Auto Tag plugin</strong><br>Error: OpenAI API key is missing. Please add it in the plugin settings.`));
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
        new PreUpdateModal(app, settings, suggestedTags, (acceptedTags: string[]) => {
			AutoTagPlugin.Logger.debug("Tags accepted for insertion:", acceptedTags);

			/**
			 * Insert only the tags accepted by the user in the modal.
			 */
			insertTags(insertLocation, acceptedTags, editor, settings, initialCursorPos, selectedTextLength);
        }).open();
    }
	else {
		/**
		 * Insert the tags in the note right away.
		 */
		insertTags(insertLocation, suggestedTags, editor, settings, initialCursorPos, selectedTextLength);
	}
}
