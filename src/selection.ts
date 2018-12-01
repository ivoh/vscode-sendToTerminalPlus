import * as vscode from 'vscode';

export class UserSelection {
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


export function getSelectionText(textEditor: vscode.TextEditor) : UserSelection {
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


