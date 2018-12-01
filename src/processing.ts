import {UserSelection} from "./selection";
import {selectionPatternTag, linePatternTag, currentLinePatternTag, PayloadFormat, patternTagDelimiter} from "./constants";
   
    function replacePattern(line: string, pattern: string, replacement: string[]) : string[] {
        // replacement is multiline
        if (replacement.length > 1) {
            const i = line.indexOf(pattern);
            if (i >= 0) {
                let result: string[] = [];
                let replacementFirstLine = replacement[0];
                let replacementLastLine = replacement[replacement.length-1];
                result.push(line.substr(0, i) + replacementFirstLine);
                for (let index = 1; index < replacement.length-1; index++) {
                    result.push(replacement[index]);
                }
                result.push(replacementLastLine + line.substr(i + pattern.length));
                return result;
            }
            return [line];
        }

        // replacement is singleline
        let lineReplacement = "";

        if (replacement.length > 0) {
            // selection is not empty
            lineReplacement = replacement[0];
        }        
        return [line.replace(pattern, lineReplacement)];
    }

    function extendPatternTag(patternTag: string) {
        return patternTagDelimiter + patternTag + patternTagDelimiter;
    }

    function mapReduce<T>(input : T[], callbackfn: (value: T) => T[]) : T[] {
        return input.map(callbackfn).reduce((acc, item) => acc.concat(item), []);
    }

    function extendPattern(patternTag: string, content: string[]) : [string, string[]] {
        let extendedTag =  extendPatternTag(patternTag);
        return [extendedTag, mapReduce(content, l => replacePattern(l, patternTag, [extendedTag]))];
    }


    function processPatterns(selection: string[], currentLine: string, linePattern: string, noSelectionPayload: string[], oneLineSelectionPayload: string[], multilineSelectionPayload: string[]) : string[] {
        console.log(`Transforming '${selection.length}' input lines.`);
        // transformations of replacement patterns
        let processedSelection =  mapReduce   selection.map(l => replacePattern(linePattern, linePatternTag, [l])).reduce((acc, item) => acc.concat(item), []);            
        
        let payloadPattern: string[] = [];
        switch (selection.length) {
            case 0:
                payloadPattern = noSelectionPayload;
                break;
            case 1:
                payloadPattern = oneLineSelectionPayload;
                break;
            default:
                payloadPattern = multilineSelectionPayload;
                break;
        }
        
        [, payloadPattern] = extendPattern(currentLinePatternTag, payloadPattern);

        let result :string[] = [];
        let lines : string[] = [];        
        payL =  mapReduce(payloadPattern, l => replacePattern(l, selectionPatternTag, selection));
        //  payloadPattern.map(l => replacePattern(l, currentLinePatternTag, [currentLine])).reduce((acc, item) => acc.concat(item), []);
        line = mapReduce(line, l => replacePattern(l, selectionPatternTag, selection))
        // line = line.map(l => replacePattern(l, selectionPatternTag, selection)).reduce((acc, item) => acc.concat(item), []);

        result = result.concat(line);

        console.log(`Transformed text is '${result.length}' lines.`);
        return result;
    }

    export function processSelection(userSelection: UserSelection,  noSelectionTemplate: string[], linePattern: string) : string[] {
        let payload : string[] = [];
        let selectionLines : string[] = [];

        if (userSelection.isEmpty) {
            selectionLines = noSelectionTemplate;
        }  else {
            selectionLines = userSelection.multilineSelection;
        }

        let lines = processPatterns(selectionLines,[],  userSelection.currentline, linePattern)

        return lines;
    }


    export function formatPayload(text: string[], payloadFormat: string) {
        if (payloadFormat === PayloadFormat.)
    }


