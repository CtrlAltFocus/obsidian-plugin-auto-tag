import {Editor, MarkdownView} from "obsidian";
import {AutoTagPluginSettings} from "../plugin/settings/settings";
import {PreTagsFetchModal} from "../plugin/modals/preTagsFetchModal/preTagsFetchModal";
import {commandFnInsertTagsForSelectedText} from "./insertTags";

export const commandFnShowPreTagsFetchModal = async (editor: Editor, view: MarkdownView, settings: AutoTagPluginSettings, insertLocation: "frontmatter" | "after-selection" | "before-selection" = "frontmatter") => {
	if (settings.checkCostEstimation) {
		new PreTagsFetchModal(editor, view, settings).open();
	} else {
		commandFnInsertTagsForSelectedText(editor, view, settings, insertLocation);
	}
};
