import {App, Command, Editor, MarkdownView} from "obsidian";
import {AutoTagPluginSettings} from "../settings/settings";
import {commandFnShowPreTagsFetchModal} from "../../businesslogic/startAutoTagFlow";

export function createCommandList(app: App, settings: AutoTagPluginSettings): Command[] {
	return [
		createCmdSelectTextInsertTags(settings),
	];
}

export function createCmdSelectTextInsertTags(settings: AutoTagPluginSettings): Command {
	return {
		id: 'select-text-insert-tags',
		name: 'insert tags for selected text (insert before/after + frontmatter)',
		editorCallback: async (editor: Editor, view: MarkdownView) => commandFnShowPreTagsFetchModal(editor, view, settings),
	};
}
