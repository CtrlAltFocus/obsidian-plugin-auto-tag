import { App, ButtonComponent, MarkdownView, Modal, Notice } from "obsidian";
import { commandFnInsertTagsForSelectedText } from "src/businesslogic/insertTags";
import { AutoTagPluginSettings } from "../settings/settings";

export class AutoTagActionMenuModal extends Modal {
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
