'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Transform } from 'stream';

class LanguageSetting {
    constructor() {
        this.langId = "undefined";
        this.shouldBreakSelectionPerLines = false;
        this.prefix = null;
        this.postfix = null;
        this.payload = ["{selection}"];
    }
    langId: string;
    shouldBreakSelectionPerLines: Boolean;
    prefix: string | null;
    postfix: string | null;
    payload: string[];
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "sendtoscalarepl" is now active!');

    const extConfiguration = vscode.workspace.getConfiguration("sendtoscalarepl");
    const languageSettings = extConfiguration.get<LanguageSetting[]>("languages", []);

    const defaultLang = languageSettings.find(obj=> obj.langId === "default") || new LanguageSetting();
    console.log(`Found '${languageSettings.length}' language setting items.`);
    const selectionPattern = "{selection}";

    function getLangSettings(langId: string) {
        return languageSettings.find(obj=> obj.langId === langId) || defaultLang
    }


    function getSelectionText(textEditor: vscode.TextEditor) : string[] {
        let selection = textEditor.selection;       
        if (!selection) {
            console.error(`No selection.`)
            return [];
        }
        
        if (selection.isEmpty) {
            console.log(`No selected text, therefore selecting current line.`)
            return [textEditor.document.lineAt(selection.start.line).text];
        }

        let result : string[] = [];
        for (let line = selection.start.line; line <= selection.end.line; line++){
            let currentLine = textEditor.document.lineAt(line).text;
            if (line === selection.end.line) {
                currentLine = currentLine.substring(0, selection.end.character)
            }
            if (line === selection.start.line) {
                currentLine = currentLine.substring(selection.start.character)
            }
            result.push(currentLine);
        }
        console.log(`Selected text is '${result.length}' rows.`)
        return result;
    }

    let activeTerm: vscode.Terminal | null = null;

    function sendTextToActiveTerminal(text: string) {
        console.log(`Terminal|${text}`);


        // * take last existing and remember (create new one if doesn't exist)
        let t = vscode.window.terminals;
        if (activeTerm !== null) {
            if (t.indexOf(activeTerm) <0) {
                activeTerm = null;
            }
        }
        if (activeTerm === null) {
            if (t.length === 0) {
                activeTerm = vscode.window.createTerminal("ScalaREPL");
                activeTerm.show();
            } else {
                activeTerm = t[t.length-1];
            }
        }

        // * take active
        //  when the activeTerminal api starts to work
        // let term = vscode.window.activeTerminal;
        // if (term && term !== undefined) {
        //     activeTerm = term
        // }

        activeTerm.sendText(text)
    }


    function sendToTerminal(lines: string[]) {
        for(let l of lines) {
            sendTextToActiveTerminal(l);
        }
    }

    function replaceSelectionPatterns(msg: string, selection: string[]): string[] {
        if (selection.length > 1) {
            const i = msg.indexOf(selectionPattern);
            if (i > 0) {
                let result: string[] = [];
                let selectionFirst = selection[0];
                let selectionLast = selection[selection.length-1];
                result.push(msg.substr(0, i) + selectionFirst);
                for (let index = 0; index < selection.length-1; index++) {
                    result.push(selection[index]);
                }
                result.push(selectionLast, msg.substr(i));
            }
            return [msg];            
        } 
        let selectionReplacement = "";
        if (selection.length > 0) {
            selectionReplacement = selection[0]
        }        
        return [msg.replace(selectionPattern, selectionReplacement)];
    }

    function transformForREPL(selection: string[], transformationMap: string[]) : string[] {
        let result :string[] = [];
        for(let t of transformationMap) {
            let transformed = replaceSelectionPatterns(t, selection)
            result.concat(transformed)
        }
        return result;
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerTextEditorCommand('extension.sendToScalaREPL', (textEditor: vscode.TextEditor) => {
        // The code you place here will be executed every time your command is executed

        let langSettings = getLangSettings(textEditor.document.languageId)
        // vscode.termin
        let selection = getSelectionText(textEditor)
        if (selection.length === 0) {
            return;
        }
        let transformedSelection = transformForREPL(selection, langSettings.payload);

        sendToTerminal(transformedSelection);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}