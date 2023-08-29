import { App, ButtonComponent, Modal } from 'obsidian';
import { AutoTagPluginSettings } from '../settings/settings';
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactView } from "../../react/components/ReactView.test";
import { Root, createRoot } from "react-dom/client";

export class PreUpdateModal extends Modal {
    settings: AutoTagPluginSettings;
    tags: string[];
    selectedTags: Set<string>;
    onApplyChanges: (selectedTags: string[]) => void;
    reactRoot: Root | null;

    constructor(app: App, settings: AutoTagPluginSettings, tags: string[], onApplyChanges: (selectedTags: string[]) => void) {
        super(app);
        this.settings = settings;
        this.tags = tags;
        this.selectedTags = new Set();
        this.onApplyChanges = onApplyChanges;
        this.reactRoot = null;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Select Tags' });

        const reactContainer = contentEl.createDiv();
        this.reactRoot = createRoot(reactContainer);
        this.reactRoot.render(
            <React.StrictMode>
                <ReactView />
            </React.StrictMode>
        );

        this.tags.forEach(tag => {
            const tagItem = contentEl.createDiv({ cls: 'tag-item' });
            tagItem.createEl('span', { text: tag });

            const refuseButton = new ButtonComponent(tagItem)
                .setButtonText("Refuse")
                .onClick(() => {
                    this.selectedTags.delete(tag);
                    this.updateButtonStyles(refuseButton, acceptButton);
                });

            const acceptButton = new ButtonComponent(tagItem)
                .setButtonText("Accept")
                .onClick(() => {
                    this.selectedTags.add(tag);
                    this.updateButtonStyles(refuseButton, acceptButton);
                });

            this.updateButtonStyles(refuseButton, acceptButton);
        });

        new ButtonComponent(contentEl.createDiv())
            .setButtonText("Apply changes")
            .setCta()
            .onClick(() => {
                this.onApplyChanges(Array.from(this.selectedTags));
                this.close();
            });

        new ButtonComponent(contentEl.createDiv())
            .setButtonText("Cancel")
            .onClick(() => this.close());
    }

    onClose() {
        this.reactRoot?.unmount();
        const { contentEl } = this;
        contentEl.empty();
    }

    updateButtonStyles(refuseButton: ButtonComponent, acceptButton: ButtonComponent) {
        const isAccepted = acceptButton.buttonEl.textContent && this.selectedTags.has(acceptButton.buttonEl.textContent);

        if (isAccepted) {
            refuseButton.buttonEl.classList.remove('active');
            acceptButton.buttonEl.classList.add('active');
        } else {
            refuseButton.buttonEl.classList.add('active');
            acceptButton.buttonEl.classList.remove('active');
        }
    }
}
