import * as React from "react";
import { App } from 'obsidian';

export type AppContextType = {
    app: App;
};

export const AppContext = React.createContext<AppContextType | undefined>(undefined);
