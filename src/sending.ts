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
        activeTerm.show(true);

        return ((text: string, addNewLine: boolean) => {
            console.log(`Terminal|${text}`);
            activeTerm.sendText(text);
        });
    }

    export function sendToTerminal(lines: string[], addNewLines: boolean, delay: number) {
        console.log(`Sending '${lines.length}' lines to terminal with delay '${delay}', addNewLines:'${addNewLines}'.`);
        let send = getSendTextToActiveTerminalDelegate();

        function sendOneByOneLineWithDelay(currentDelay: number, nextDelay: number) {
            let lu = lines.shift();
            let isLastItem = lines.length === 0;
            if (lu === undefined) {
                return;
            }
            let l = lu;

            if (currentDelay <= 0) {
                // immediately
                send(l, addNewLines || isLastItem);
                sendOneByOneLineWithDelay(nextDelay, nextDelay);
            } else {
                // delayed
                console.log(`"Sleep for '${currentDelay}' ms`);
                setTimeout(function() {
                    send(l, addNewLines || isLastItem);
                    sendOneByOneLineWithDelay(nextDelay, nextDelay);
                }, currentDelay);
            }
        }
        
        // first line immediately, next one with predefined delay
        sendOneByOneLineWithDelay(0, delay);
    }

