import {Editor, MarkdownView, Modal} from 'obsidian';
import {AutoTagPluginSettings} from '../../settings/settings';
import * as React from "react";
import {Root, createRoot} from "react-dom/client";
import {LlmModel} from "../../../services/models/openai.models";
import {calculateTokenCost} from "../../../utils/utils";

export class PreTagsFetchModal extends Modal {
	editor: Editor;
	view: MarkdownView;
	settings: AutoTagPluginSettings;
	reactRoot: Root | null;

	constructor(editor: Editor, view: MarkdownView, settings: AutoTagPluginSettings) {
		super(view.app);
		this.editor = editor;
		this.view = view;
		this.settings = settings;
		this.reactRoot = null;
	}

	onOpen() {
		const {contentEl, editor} = this;

		const selectedText = editor.getSelection() || editor.getValue();

		const currentModel: LlmModel = this.settings.openaiModel;
		const approximateCost = calculateTokenCost(selectedText, currentModel);

		console.log("active model", currentModel);

		const reactContainer = contentEl.createDiv();
		this.reactRoot = createRoot(reactContainer);
		this.reactRoot.render(
			<React.StrictMode>
				<div>
					<h2>Before fetching tag suggestions</h2>
					<p>
						Active model: {currentModel.name}
						<br/>
						Length of selected text: {selectedText.length} characters
						<br/>
						Number of tokens: {calculateTokenCost(selectedText, currentModel).tokenCount}
						<br/>
						Cost per 1K tokens (input): {currentModel.inputCost1KTokens} USD
						<br/>
						Cost per 1K tokens (output): {currentModel.outputCost1KTokens} USD
						<br/>
						Approximate cost: {approximateCost.cost} USD
					</p>
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
