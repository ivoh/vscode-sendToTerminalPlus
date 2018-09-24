'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class LanguageSetting {
    langId: string;
    shouldSendSelectionPerLines: Boolean;
    oneLineSelectionPayload: string[];
    multiLineSelectionPayload: string[];

    constructor() {
        this.langId = "undefined";
        this.shouldSendSelectionPerLines = false;
        this.oneLineSelectionPayload = ["{selection}"];
        this.multiLineSelectionPayload = ["{selection}"];
    }
}

class UserSelection {
    text: string[];
    isMultiLine: Boolean;

    constructor(text: string[], isMultiLine: Boolean) {
        this.text = text;
        if (this.text.length > 0 && this.text[this.text.length-1].length === 0) {
            this.text.splice(this.text.length-1, 1);
        }
        this.isMultiLine = isMultiLine;
    }

    isEmpty() {
        return this.text.length === 0;
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "sendtoterminalplus" is now active!');

    const extConfiguration = vscode.workspace.getConfiguration("sendtoterminalplus");
    const languageSettings = extConfiguration.get<LanguageSetting[]>("languages", []);

    const defaultLang = languageSettings.find(obj=> obj.langId === "default") || new LanguageSetting();
    console.log(`Found '${languageSettings.length}' language setting items.`);
    const selectionPattern = "{selection}";

    function getLangSettings(langId: string) {
        return languageSettings.find(obj=> obj.langId === langId) || defaultLang;
    }


    function getSelectionText(textEditor: vscode.TextEditor, shouldBreakSelectionPerLines: Boolean) : UserSelection {
        let selection = textEditor.selection;       

        // weird state
        if (!selection) {
            console.error(`No selection. Unexpected state.`);
            return new UserSelection([], false);
        }
        
        // select current line under cursor (as there i sno selection)
        if (selection.isEmpty) {
            console.log(`No selected text, therefore selecting current line.`);
            return new UserSelection([textEditor.document.lineAt(selection.start.line).text], false);
        }
        
        let isMultiLine = selection.end.line !== selection.start.line;

        // break per lines
        if (shouldBreakSelectionPerLines) {
            let result : string[] = [];
            for (let line = selection.start.line; line <= selection.end.line; line++){
                let currentLine = textEditor.document.lineAt(line).text;
                if (line === selection.end.line) {
                    currentLine = currentLine.substring(0, selection.end.character);
                }
                if (line === selection.start.line) {
                    currentLine = currentLine.substring(selection.start.character);
                }
                result.push(currentLine);
            }
            return new UserSelection(result, isMultiLine);
        }

        // as single line
        return new UserSelection([textEditor.document.getText(selection)], isMultiLine);
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


    function sendToTerminal(lines: string[]) {
        console.log(`Sending '${lines.length}' lines to terminal.`);
        for(let l of lines) {
            sendTextToActiveTerminal(l);
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

        let langSettings = getLangSettings(textEditor.document.languageId);
        console.log(`Using language setting for '${langSettings.langId}'`);

        // vscode.termin
        let selection = getSelectionText(textEditor, langSettings.shouldSendSelectionPerLines);
        if (selection.isEmpty()) {
            console.debug("There is no selection to process.");
            return;
        }

        console.log(`Selected text is multiLine:'${selection.isMultiLine}' and '${selection.text.length}' lines long.`);

        let transformedSelection = transformForREPL(selection, langSettings.oneLineSelectionPayload, langSettings.multiLineSelectionPayload);

        sendToTerminal(transformedSelection);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}