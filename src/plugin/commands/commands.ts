import { App, Command, Editor, MarkdownView } from "obsidian";
import { AutoTagPluginSettings } from "../settings/settings";
import { commandFnInsertTagsForSelectedText } from "src/businesslogic/insertTags";
import { AutoTagActionMenuModal } from "../modals/actionMenuModal";

export function createCommandList(app: App, settings: AutoTagPluginSettings): Command[] {
    return [
        // createCmdAutoTagActionMenuModal(app, settings),
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

export function createCmdAutoTagActionMenuModal(app: App, settings: AutoTagPluginSettings): Command {
    return {
        id: 'autotag-action-menu-modal',
        name: 'Action menu display',
        callback: () => {
            new AutoTagActionMenuModal(app, settings).open();
        },
    };
}
