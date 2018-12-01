'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {getLangSettings} from "./setting";
import {getSelectionText} from "./selection";
import {processPatterns, breakDownToFormat} from './processing';
import {sendToTerminal} from './sending';
import { PayloadFormat } from './constants';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "sendtoterminalplus" is now active!');


    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerTextEditorCommand('extension.sendToTerminalPlus', (textEditor: vscode.TextEditor) => {
        // The code you place here will be executed every time your command is executed


        // pick correct language
        let langSettings = getLangSettings(textEditor.document.languageId);
        console.log(`Using language setting for '${langSettings.langId}'='${langSettings}'`);

        // take text selection
        let selection = getSelectionText(textEditor);
        console.log(`Selected text is empty:'${selection.isEmpty()}' multiLine:'${selection.isMultiLine}' and '${selection.multilineSelection.length}' lines long.`);

        // process payload
        let text = processPatterns(selection.multilineSelection,  selection.currentline, langSettings.linePattern,  langSettings.noSelectionPayload, 
            langSettings.oneLineSelectionPayload, langSettings.multiLineSelectionPayload);

        // transform as per language rules
        let transformedSelection = breakDownToFormat(text, langSettings.payloadFormat, langSettings.chunkSize);

        // send to terminal
        let shouldAddNewLineCharAtTheEndOfEachLine = langSettings.payloadFormat !== PayloadFormat.Chunk;
        sendToTerminal(transformedSelection, shouldAddNewLineCharAtTheEndOfEachLine, langSettings.delayInMS);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}