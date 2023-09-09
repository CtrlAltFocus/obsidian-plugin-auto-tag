import {App, Modal} from 'obsidian';
import {AutoTagPluginSettings} from '../../settings/settings';
import * as React from "react";
import {Root, createRoot} from "react-dom/client";
import {TagsPreviewList} from "./tagsPreviewList";

export class PreUpdateModal extends Modal {
	settings: AutoTagPluginSettings;
	tags: string[];
	onApplyChanges: (selectedTags: string[]) => void;
	reactRoot: Root | null;

	constructor(app: App, settings: AutoTagPluginSettings, tags: string[], onApplyChanges: (selectedTags: string[]) => void) {
		super(app);
		this.settings = settings;
		this.tags = tags;
		this.onApplyChanges = onApplyChanges;
		this.reactRoot = null;
	}

	onOpen() {
		const {contentEl} = this;

		const reactContainer = contentEl.createDiv();
		this.reactRoot = createRoot(reactContainer);
		this.reactRoot.render(
			<React.StrictMode>
				<div>
					<h2>New tags to insert</h2>
					<TagsPreviewList
						tags={this.tags}
						onAccept={(acceptedTags) => {
							if (acceptedTags.length > 0) {
								this.onApplyChanges(acceptedTags);
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
