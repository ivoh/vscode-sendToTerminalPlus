'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class LanguageSetting {
    langId: string;
    delayMode: string;
    payloadFormat: string;
    processLine: string;
    noSelectionPayload: string[];
    oneLineSelectionPayload: string[];
    multiLineSelectionPayload: string[];

    constructor() {
        this.langId = "undefined";
        this.delayMode = "default";
        this.payloadFormat = "default";
        this.processLine = "{line}";
        this.noSelectionPayload = ["{currentline}"];
        this.oneLineSelectionPayload = ["{selection}"];
        this.multiLineSelectionPayload = ["{selection}"];
    }


    toString() {
        return `langId:${this.langId}, delayMode:${this.delayMode}, payloadFormat:${this.payloadFormat}, processLine:${this.processLine}, `
        + `noSelectionPayload:${this.noSelectionPayload}, oneLineSelectionPayload:${this.oneLineSelectionPayload}, multiLineSelectionPayload:${this.multiLineSelectionPayload}`;
    }

    setDefaultValues(defaultDelayMode: string, defaultPayloadFormat: string) : void {
        this.delayMode = this.delayMode === "default" ? defaultDelayMode : this.delayMode;
        this.payloadFormat = this.payloadFormat === "this.payloadFormat" ? defaultPayloadFormat : this.payloadFormat; 
    }

}

class UserSelection {
    // selection: string[],
    // line: string[],

    currentline: string;
    selection: string;
    multilineSelection: string[];    
    isMultiLine: boolean;

    constructor(currentline: string, selection: string, multilineSelection : string[], isMultiLine: boolean) {
        this.currentline = currentline;
        this.selection = selection;
        this.multilineSelection = multilineSelection;
        this.isMultiLine = isMultiLine;

        this.removeTrailingLine(multilineSelection);
    }

    removeTrailingLine(text: string[]) {
        // remove trailing space line
        if (text.length > 0 && text[text.length-1].length === 0) {
            text.splice(text.length-1, 1);
        }

    }

    isEmpty() {
        return this.multilineSelection.length === 0;
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "sendtoterminalplus" is now active!');

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

    const selectionPattern = "{selection}";

    function getLangSettings(langId: string) {
        return languageSettings.find(obj=> obj.langId === langId) || defaultLang;
    }


    function getSelectionText(textEditor: vscode.TextEditor) : UserSelection {
        const selection = textEditor.selection;       

        // weird state
        if (!selection) {
            console.error(`No selection. Unexpected state.`);
            return new UserSelection("", "", [], false);
        }
        
        // current line under cursor
        const currentline = textEditor.document.lineAt(selection.start.line).text

        if (selection.isEmpty) {
            console.log(`No selected text, therefore passing only current line.`);
            return new UserSelection(currentline, "", [], false);
        }

        // is multiline
        const isMultiLine = selection.end.line !== selection.start.line;

        // multiline selection
        let multilineSelection : string[] = [];
        for (let line = selection.start.line; line <= selection.end.line; line++){
            let currentLine = textEditor.document.lineAt(line).text;
            if (line === selection.end.line) {
                currentLine = currentLine.substring(0, selection.end.character);
            }
            if (line === selection.start.line) {
                currentLine = currentLine.substring(selection.start.character);
            }
            multilineSelection.push(currentLine);
        }

        // single line
        const lineSelection = textEditor.document.getText(selection);


        return new UserSelection(currentline, lineSelection, multilineSelection, isMultiLine);
    }

    let activeTerm: vscode.Terminal | null = null;

    function sendTextToActiveTerminal(text: string) {
        // * take last existing and remember (create new one if doesn't exist)
        let t = vscode.window.terminals;
        if (activeTerm !== null) {
            if (t.indexOf(activeTerm) <0) {
                console.log("Used terminal is no longer active. Therefore dropping reference.");
                activeTerm = null;
            }
        }
        if (activeTerm === null) {
            if (t.length === 0) {
                console.log("Not referencing any terminal and no terminal is open. Therefore creating new terminal.");
                activeTerm = vscode.window.createTerminal("Terminal+");
                activeTerm.show();
            } else {
                activeTerm = t[t.length-1];
                console.log(`Not referencing any terminal. Taking last active. '${activate.name}'`);
            }
        }

        // * take active
        //  when the activeTerminal api starts to work
        // let term = vscode.window.activeTerminal;
        // if (term && term !== undefined) {
        //     activeTerm = term
        // }

        console.log(`Terminal|${text}`);
        activeTerm.sendText(text);
    }


    function sendToTerminal(lines: string[], delay: number) {
        console.log(`Sending '${lines.length}' lines to terminal with delay '${delay}'.`);

        function sendOneByOneLineWithDelay() {
            let lu = lines.shift();
            if (lu === undefined) {
                return;
            }
            let l = lu;
            setTimeout(function() {
                sendTextToActiveTerminal(l);
                sendOneByOneLineWithDelay();
            }, delay);        
        }
        
        if (delay > 0) {
            sendOneByOneLineWithDelay();
        } else {
            for(let l of lines) {
                sendTextToActiveTerminal(l);
            }

        }
    }

    function replaceSelectionPatterns(msg: string, selection: string[]): string[] {
        // selection is multiline
        if (selection.length > 1) {
            const i = msg.indexOf(selectionPattern);
            if (i >= 0) {
                let result: string[] = [];
                let selectionFirst = selection[0];
                let selectionLast = selection[selection.length-1];
                result.push(msg.substr(0, i) + selectionFirst);
                for (let index = 1; index < selection.length-1; index++) {
                    result.push(selection[index]);
                }
                result.push(selectionLast + msg.substr(i + selectionPattern.length));
                return result;
            }
            return [msg];
        } 

        // selection is singleline
        let selectionReplacement = "";

        if (selection.length > 0) {
            // selection is not empty
            selectionReplacement = selection[0];
        }        
        return [msg.replace(selectionPattern, selectionReplacement)];
    }

    function transformForREPL(selection: UserSelection, oneLineText: string[], multiLineText: string[]) : string[] {
        console.log(`Transforming '${selection.text.length}' input lines.`);
        let result :string[] = [];
        let text : string[] = [];
        if (!selection.isEmpty()) {
            if (selection.isMultiLine) {
                text = multiLineText;            
            } else {
                text = oneLineText; 
            }
            for(let t of text) {
                // transformations goes here
                let transformed = replaceSelectionPatterns(t, selection.text);


                result = result.concat(transformed);
            }
        }
        console.log(`Transformed text is '${result.length}' lines.`);
        return result;
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerTextEditorCommand('extension.sendToTerminalPlus', (textEditor: vscode.TextEditor) => {
        // The code you place here will be executed every time your command is executed


        // dynamic settings
        if (dynamicConfiguration || !configurationLoaded) {
            const extConfiguration = vscode.workspace.getConfiguration("sendtoterminalplus");
            messageDelay = extConfiguration.get<number>("messageDelay", messageDelay);
            defaultDelayMode = extConfiguration.get<string>("defaultDelayMode", defaultDelayMode);
            chunkSize = extConfiguration.get<number>("chunkSize", chunkSize);
            defaultPayloadFormat = extConfiguration.get<string>("defaultPayloadFormat", defaultPayloadFormat);
            console.log(`Found common setting: messageDelay='${messageDelay}', defaultDelayMode='${defaultDelayMode}', chunkSize='${chunkSize}', defaultPayloadFormat='${defaultPayloadFormat}'.`);

            languageSettings = extConfiguration.get<LanguageSetting[]>("languages", languageSettings);
            for(let s of languageSettings) {
                s.setDefaultValues(defaultDelayMode, defaultPayloadFormat);
            }

            defaultLang = languageSettings.find(obj=> obj.langId === "default") || defaultLang;
            console.log(`Found '${languageSettings.length}' language setting items.`);
            configurationLoaded = true;
        }
    

        // pick correct language
        let langSettings = getLangSettings(textEditor.document.languageId);
        console.log(`Using language setting for '${langSettings.langId}'='${langSettings}'`);

        // take selection
        let selection = getSelectionText(textEditor);
        console.log(`Selected text is empty:'${selection.isEmpty()}' multiLine:'${selection.isMultiLine}' and '${selection.multilineSelection.length}' lines long.`);

        // transform as per language rules
        let transformedSelection = transformForREPL(selection, langSettings.oneLineSelectionPayload, langSettings.multiLineSelectionPayload);

        // send to terminal
        let sendDelay = 0;
        if (langSettings.delayMode === "delayed") {
            sendDelay = messageDelay;
        }
        sendToTerminal(transformedSelection, sendDelay);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}