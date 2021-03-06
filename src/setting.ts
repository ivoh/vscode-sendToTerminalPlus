import * as vscode from 'vscode';
import {selectionPatternTag, currentLinePatternTag, linePatternTag, defaultOption, undefinedOption, DelayMode} from "./constants";
import {plainToClass} from "class-transformer";

export class LanguageSetting {
    langId: string;
    delayMode: string;
    payloadFormat: string;
    linePattern: string;
    noSelectionPayload: string[];
    oneLineSelectionPayload: string[];
    multiLineSelectionPayload: string[];
    delayInMS : number;
    chunkSize : number;

    constructor() {
        this.langId = undefinedOption;
        this.delayMode = defaultOption;
        this.payloadFormat = defaultOption;
        this.linePattern = linePatternTag;
        this.noSelectionPayload = [ currentLinePatternTag];
        this.oneLineSelectionPayload = [selectionPatternTag];
        this.multiLineSelectionPayload = [selectionPatternTag];
        this.delayInMS = 0;
        this.chunkSize = 100;
    }


    toString() {
        return `langId:${this.langId}, delayMode:${this.delayMode}, payloadFormat:${this.payloadFormat}, processLine:${this.linePattern}, `
        + `noSelectionPayload:${this.noSelectionPayload}, oneLineSelectionPayload:${this.oneLineSelectionPayload}, multiLineSelectionPayload:${this.multiLineSelectionPayload}`;
    }

    setDefaultValues(defaultDelayMode: string, defaultPayloadFormat: string, messageDelay: number, chunkSize: number) : void {
        this.delayMode = this.delayMode === defaultOption ? defaultDelayMode : this.delayMode;
        this.payloadFormat = this.payloadFormat === defaultOption ? defaultPayloadFormat : this.payloadFormat; 
        this.chunkSize = chunkSize;
        if (this.delayMode === DelayMode.NoDelay ) {
            this.delayInMS = 0;
        } else {
            this.delayInMS = messageDelay;
        }
    }

}



let defaultLanguageSettings: LanguageSetting = new LanguageSetting();
let languageSettings: LanguageSetting[] = [];
let messageDelay: number = 0;
let defaultDelayMode: string = "nodelay";
let chunkSize: number = 1000;    
let defaultPayloadFormat: string ="all";

let defaultLang = defaultLanguageSettings;
const extConfiguration = vscode.workspace.getConfiguration("sendtoterminalplus");
const dynamicConfiguration = extConfiguration.get<Boolean>("dynamicconfiguration", false);
let configurationLoaded = false;


function getLanguageSettings() : LanguageSetting[] {
    if (dynamicConfiguration || !configurationLoaded) {
        const extConfiguration = vscode.workspace.getConfiguration("sendtoterminalplus");
        messageDelay = extConfiguration.get<number>("messageDelay", messageDelay);
        defaultDelayMode = extConfiguration.get<string>("defaultDelayMode", defaultDelayMode);
        chunkSize = extConfiguration.get<number>("chunkSize", chunkSize);
        defaultPayloadFormat = extConfiguration.get<string>("defaultPayloadFormat", defaultPayloadFormat);
        console.log(`Found common setting: messageDelay='${messageDelay}', defaultDelayMode='${defaultDelayMode}', chunkSize='${chunkSize}', defaultPayloadFormat='${defaultPayloadFormat}'.`);

        languageSettings = extConfiguration.get<LanguageSetting[]>("languages", languageSettings).map(l => plainToClass(LanguageSetting, l));
        for(let s of languageSettings) {
            s.setDefaultValues(defaultDelayMode, defaultPayloadFormat, messageDelay, chunkSize);
        }

        defaultLang = languageSettings.find(obj=> obj.langId === "default") || defaultLang;
        console.log(`Found '${languageSettings.length}' language setting items.`);
        configurationLoaded = true;
    }

    return languageSettings;
}


export function getLangSettings(langId: string) {
    getLanguageSettings();
    return languageSettings.find(obj=> obj.langId === langId) || defaultLang;
}

