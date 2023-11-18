import {App, Modal} from 'obsidian';
import {AutoTagPluginSettings} from '../../settings/settings';
import * as React from "react";
import {Root, createRoot} from "react-dom/client";
import {TagsPreviewList} from "./components/TagsPreviewList";

export class PreUpdateModal extends Modal {
	settings: AutoTagPluginSettings;
	reactRoot: Root | null;
	fetchTagsFunction: () => Promise<string[]>;
	onAccept: (selectedTags: string[]) => void;
	onCancel?: () => void;

	constructor(app: App, settings: AutoTagPluginSettings, fetchTagsFunction: () => Promise<string[]>, onAccept: (selectedTags: string[]) => void, onCancel?: () => void) {
		super(app);
		this.settings = settings;
		this.reactRoot = null;
		this.fetchTagsFunction = fetchTagsFunction;
		this.onAccept = onAccept;
		this.onCancel = onCancel;
	}

	onOpen() {
		const {contentEl} = this;

		/**
		 * Retrieve tag suggestions.
		 */
		const reactContainer = contentEl.createDiv();
		this.reactRoot = createRoot(reactContainer);
		this.reactRoot.render(
			<React.StrictMode>
				<div>
					<h2>New tags to insert</h2>
					<TagsPreviewList
						fetchTagsFunction={this.fetchTagsFunction}
						onAccept={(acceptedTags) => {
							if (acceptedTags.length > 0) {
								this.onAccept(acceptedTags);
							}
							this.close();
						}}
						onCancel={() => {
							this.close();
						}}
					/>
				</div>
			</React.StrictMode>
		);
	}

	onClose() {
		this.reactRoot?.unmount();
		const {contentEl} = this;
		contentEl.empty();
	}
}
