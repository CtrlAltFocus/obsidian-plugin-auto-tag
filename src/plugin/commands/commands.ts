import { App, Command, Editor, MarkdownView } from "obsidian";
import { AutoTagPluginSettings } from "../settings/settings";
import { commandFnInsertTagsForSelectedText } from "src/businesslogic/insertTags";

export function createCommandList(app: App, settings: AutoTagPluginSettings): Command[] {
    return [
        createCmdSelectTextInsertTags(settings),
    ];
}

export function createCmdSelectTextInsertTags(settings: AutoTagPluginSettings): Command {
    return {
        id: 'auto-tag--select-text-insert-tags',
        name: 'insert tags for selected text (insert before/after + frontmatter)',
        editorCallback: async (editor: Editor, view: MarkdownView) => commandFnInsertTagsForSelectedText(editor, view, settings),
    };
}
