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
	onAcceptFetch: () => void;
	onCancelFetch?: () => void;

	constructor(editor: Editor, view: MarkdownView, settings: AutoTagPluginSettings, onAcceptFetch: () => void, onCancelFetch?: () => void) {
		super(view.app);
		this.editor = editor;
		this.view = view;
		this.settings = settings;
		this.reactRoot = null;
		this.onAcceptFetch = onAcceptFetch;
		this.onCancelFetch = onCancelFetch;
	}

	cancel = () => {
		this.onCancelFetch?.();
		this.close();
	}

	accept = () => {
		this.onAcceptFetch();
		this.close();
	}

	onOpen() {
		const {contentEl, editor, settings} = this;

		const selectedText = editor.getSelection() || editor.getValue();
		const currentModel: LlmModel = this.settings.openaiModel;
		const approximateCost = calculateTokenCost(settings, selectedText, currentModel);

		const reactContainer = contentEl.createDiv();
		this.reactRoot = createRoot(reactContainer);
		this.reactRoot.render(
			<React.StrictMode>
				<div>
					<h2>Before fetching tag suggestions</h2>
					<table>
						<tbody>
						<tr>
							<td className="pr-4 font-bold">Estimated API call cost</td>
							<td className="font-bold">
								{approximateCost.cost.toFixed(4).substring(0, 4)}
								{approximateCost.cost < 0.01 && <span className="opacity-70">
									{approximateCost.cost.toFixed(4).substring(4)}
								</span>} USD
							</td>
						</tr>
						<tr>
							<td className="pr-4">Length of selected text</td>
							<td>{selectedText.length} characters</td>
						</tr>
						<tr>
							<td className="pr-4">
								Number of tokens<sup className="text-gray-500">*</sup>
							</td>
							<td>{approximateCost.tokenCount}</td>
						</tr>
						<tr className="text-sm text-gray-500">
							<td><sup>*</sup> includes some contents for the API call<br/>&nbsp;</td>
						</tr>
						<tr className="text-sm text-gray-500">
							<td className="pr-4">Active model</td>
							<td>{currentModel.name}</td>
						</tr>
						<tr className="text-sm text-gray-500">
							<td className="pr-4">Cost per 1K tokens (input)</td>
							<td>{currentModel.inputCost1KTokens} USD</td>
						</tr>
						<tr className="text-sm text-gray-500">
							<td className="pr-4">Cost per 1K tokens (output)</td>
							<td>{currentModel.outputCost1KTokens} USD</td>
						</tr>
						</tbody>
					</table>
					<p className="text-sm text-gray-500">

					</p>

					<div className="mt-8 space-x-2">
						<button onClick={this.cancel} className={`btn btn-secondary`}>
							Cancel
						</button>
						<button onClick={this.accept} className="btn mod-cta">
							Accept
						</button>
					</div>
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
