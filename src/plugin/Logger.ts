import { App, PluginManifest } from "obsidian";
import { AutoTagPluginSettings } from "./settings/settings";

class Logger {
    private static _instance: Logger | null = null;
    private app: App;
    private settings: AutoTagPluginSettings;
    private manifest: PluginManifest;
    private logFilePath: string | null = null;

    private constructor(app: App, settings: AutoTagPluginSettings, manifest: PluginManifest) {
        this.app = app;
        this.settings = settings;
        this.manifest = manifest;

        const logFileName = "autotag.log";
        this.logFilePath = `${this.manifest.dir}/${logFileName}`;

        try {
            this.initializeLogFile();
        } catch (error) {
            console.error('Error initializing log file:', error);
        }
    }

    static initialize(app: App, settings: AutoTagPluginSettings, manifest: PluginManifest) {
        if (!Logger._instance)
            Logger._instance = new Logger(app, settings, manifest);
    }

    private async initializeLogFile() {
        if (!this.logFilePath) return;

        const fileExists = await this.app.vault.adapter.exists(this.logFilePath);

        if (!fileExists) {
            console.warn("did not find the log file", this.logFilePath);
            await this.app.vault.create(this.logFilePath, "[autotag] AutoTag log file created");

            const fileExists = await this.app.vault.adapter.exists(this.logFilePath);
            if (fileExists) {
                console.debug("log file created", this.logFilePath);
            } else {
                console.error("log file not created", this.logFilePath);
            }
        }
    }

    private async writeToLogFile(message: string, extra?: any) {
        if (this.settings.writeToLogFile && this.logFilePath) {
            await this.initializeLogFile();

            const timestamp = new Date().toLocaleString();
            const logMessage = `\n[${timestamp}] ${message} ${extra !== undefined ? JSON.stringify(extra) : ''}`;
            try {
                await this.app.vault.adapter.append(this.logFilePath, logMessage);
            } catch (error) {
                console.error('Error appending log:', error);
            }

            // TODO best not to log the `extra` by default, but maybe have a setting for it later that can be activated for debugging

        }
    }

    static get instance(): Logger {
        if (!Logger._instance) {
            console.error("[autotag][err] " + "AutoTag.Logger not initialized");
            throw new Error("AutoTag.Logger not initialized");
        }
        return Logger._instance;
    }

    private static isInitialized(): void {
        if (!Logger._instance) {
            console.error("[autotag][err] " + "AutoTag.Logger not initialized");
            throw new Error("AutoTag.Logger not initialized");
        }
    }

    static async log(message: string, extra?: any) {
        this.isInitialized();
        const prefix = "[autotag][log] ";
        if (extra)
            console.log(prefix + message, extra);
        else
            console.log(prefix + message);

        await this._instance?.writeToLogFile(prefix + message, extra);
    }

    static async debug(message: string, extra?: any) {
        this.isInitialized();
        const prefix = "[autotag][dbg] ";
        if (extra)
            console.debug(prefix + message, extra);
        else
            console.debug(prefix + message);


        await this._instance?.writeToLogFile(prefix + message, extra);
    }

    static async warn(message: string, extra?: any) {
        this.isInitialized();
        const prefix = "[autotag][wrn] ";
        if (extra)
            console.warn(prefix + message, extra);
        else
            console.warn(prefix + message);

        await this._instance?.writeToLogFile(prefix + message, extra);
    }

    static async error(message: string, extra?: any) {
        this.isInitialized();
        const prefix = "[autotag][err] ";
        if (extra)
            console.error(prefix + message, extra);
        else
            console.error(prefix + message);

        await this._instance?.writeToLogFile(prefix + message, extra);
    }
}

export default Logger;
