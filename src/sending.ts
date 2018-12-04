import * as vscode from 'vscode';

    function getSendTextToActiveTerminalDelegate() {
        // * take active
        let activeTermOrNull = vscode.window.activeTerminal;

        // let activeTerm = activeTermOrNull |
        if (activeTermOrNull === null || activeTermOrNull === undefined) {
            console.log("Not referencing any terminal and no terminal is open. Therefore creating new terminal.");
            activeTermOrNull = vscode.window.createTerminal("Terminal+");
        }       
        let activeTerm = activeTermOrNull;
        activeTerm.show();

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

