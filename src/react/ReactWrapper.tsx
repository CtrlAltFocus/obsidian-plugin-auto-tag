import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactView } from "./components/ReactView.test";
import { createRoot } from "react-dom/client";

const VIEW_TYPE_EXAMPLE = "example-view";

export class ReactWrapper extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }

    getDisplayText() {
        return "Example view";
    }

    async onOpen() {
        const root = createRoot(this.containerEl.children[1]);
        root.render(
            <React.StrictMode>
                <ReactView />
            </React.StrictMode>
        );
    }

    async onClose() {
        ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    }
}
