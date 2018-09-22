'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';




// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "sendtoscalarepl" is now active!');

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
            result.push(currentLine)
        }
        console.log(`Selected text is '${result.length}' rows.`)
        return result;
    }

    function sendTextToActiveTerminal(text: string) {
        // vscode.window.showInformationMessage(`${text}`);
        console.log(`Terminal|${text}`)

        // cannot use as it is taking selected text by itself (ignores parameter)
        // https://github.com/Microsoft/vscode/blob/5867dc7ab51b60ce402144d236a9565a941d6e84/src/vs/workbench/parts/terminal/electron-browser/terminalActions.ts#L595
        // vscode.commands.executeCommand('workbench.action.terminal.runSelectedText', text);

        // new funcitonality  --enable-proposed-api
        // https://github.com/Microsoft/vscode/issues/52834
        // There is no way to get active terminal in VSCode by now !!!!
        // https://github.com/Microsoft/vscode/issues/48434#issuecomment-393591023
        let t = vscode.window.terminals
        vscode.window.activeTerminal
        // for(let t in vscode.window.terminals) {
        //     let term = vscode.window.terminals[t]
        //     term.
        // }
    
    }


    function sendToTerminal(lines: string[]) {
        if (lines.length > 1) {
            sendTextToActiveTerminal(":PASTE");
        }
        for(let l in lines) {
            sendTextToActiveTerminal(lines[l]);
        }
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerTextEditorCommand('extension.sendToScalaREPL', (textEditor: vscode.TextEditor) => {
        // The code you place here will be executed every time your command is executed

        // vscode.termin
        let selection = getSelectionText(textEditor)
        if (selection.length === 0) {
            return;
        }

        sendToTerminal(selection);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}