import * as vscode from 'vscode';

    let activeTermOrNull: vscode.Terminal | null = null;

    function getSendTextToActiveTerminalDelegate() {
        // * take last existing and remember (create new one if doesn't exist)
        let t = vscode.window.terminals;
        if (activeTermOrNull !== null) {
            if (t.indexOf(activeTermOrNull) <0) {
                console.log("Used terminal is no longer active. Therefore dropping reference.");
                activeTermOrNull = null;
            }
        }

        // let activeTerm = activeTermOrNull |
        if (activeTermOrNull === null) {
            if (t.length === 0) {
                console.log("Not referencing any terminal and no terminal is open. Therefore creating new terminal.");
                activeTermOrNull = vscode.window.createTerminal("Terminal+");
                activeTermOrNull.show();
            } else {
                activeTermOrNull = t[t.length-1];
                console.log(`Not referencing any terminal. Taking last active. '${activeTermOrNull.name}'`);
            }
        }

        
        // * take active
        //  when the activeTerminal api starts to work
        // let term = vscode.window.activeTerminal;
        // if (term && term !== undefined) {
        //     activeTerm = term
        // }
        if (activeTermOrNull === null) {
            //hack: because of this crapy language
            return function(text: string, addNewLine: boolean) {};
        }

        let activeTerm = activeTermOrNull;
        return ((text: string, addNewLine: boolean) => {
            console.log(`Terminal|${text}`);
            activeTerm.sendText(text);
        });
    }


    export function sendToTerminal(lines: string[], addNewLines: boolean, delay: number) {
        console.log(`Sending '${lines.length}' lines to terminal with delay '${delay}', addNewLines:'${addNewLines}'.`);
        let send = getSendTextToActiveTerminalDelegate();

        function sendOneByOneLineWithDelay() {
            let lu = lines.shift();
            let isLastItem = lines.length === 0;
            if (lu === undefined) {
                return;
            }
            let l = lu;
            setTimeout(function() {
                send(l, addNewLines || isLastItem);
                sendOneByOneLineWithDelay();
            }, delay);
        }
        
        if (delay > 0) {
            // send with delay
            sendOneByOneLineWithDelay();
        } else {
            // send immmediately
            while (lines.length > 0) {
                let lu = lines.shift();
                let isLastItem = lines.length === 0;
                if (lu === undefined) {
                    return;
                }
                send(lu, addNewLines || isLastItem);
            }
        }
    }

