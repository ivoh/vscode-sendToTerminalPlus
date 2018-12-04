import {selectionPatternTag, linePatternTag, currentLinePatternTag, PayloadFormat, patternTagDelimiter} from "./constants";
   
    
    function replacePattern(inputLine: string, patternTag: string, replacementLines: string[], position?: number) : [string[], number] {
        let i = inputLine.lastIndexOf(patternTag, position);
        if (i < 0) {
            return [[inputLine], i];
        }

        let prefix = inputLine.substr(0, i);
        let suffix = inputLine.substr(i + patternTag.length);        

        // replacement is multiline
        if (replacementLines.length > 1) {
            let result: string[] = [];
            let replacementFirstLine = replacementLines[0];
            let replacementLastLine = replacementLines[replacementLines.length-1];
            result.push(prefix + replacementFirstLine);
            for (let index = 1; index < replacementLines.length-1; index++) {
                result.push(replacementLines[index]);
            }
            result.push(replacementLastLine + suffix);
            return [result, i];
        }

        // replacement is singleline
        let lineReplacement = "";

        if (replacementLines.length > 0) {
            // selection is not empty
            lineReplacement = replacementLines[0];
        }        
        return [[prefix +  lineReplacement + suffix], i];
    }
    
    /**
     * Replaces all occurences of patternTag
     * @param inputLine - input text line
     * @param patternTag - tag to be replaced
     * @param replacementLines - multiline content to replace the patternTag in inputLine
     */
    function replaceAllPatterns(inputLine: string, patternTag: string, replacementLines: string[]) : string[] {
        let position : number | undefined = undefined;
        let result : string[] = [inputLine];
        do {
            [result, position] = replacePattern(result[0], patternTag, replacementLines);
        } while (position !== undefined && position > 0);
        return result;
    }
    

    function extendPatternTag(patternTag: string) {
        return patternTagDelimiter + patternTag + patternTagDelimiter;
    }

    function mapReduce<T>(input : T[], callbackfn: (value: T) => T[]) : T[] {
        return input.map(callbackfn).reduce((acc, item) => acc.concat(item), []);
    }

    function extendPattern(patternTag: string, content: string[]) : [string, string[]] {
        let extendedTag =  extendPatternTag(patternTag);
        return [extendedTag, mapReduce(content, l => replaceAllPatterns(l, patternTag, [extendedTag]))];
    }


    /**
     * Replaces patterns with values
     * @param selection 
     * @param currentLine 
     * @param linePattern 
     * @param noSelectionPayload 
     * @param oneLineSelectionPayload 
     * @param multilineSelectionPayload 
     */
    export function processPatterns(selection: string[], currentLine: string, linePattern: string, noSelectionPayload: string[], 
        oneLineSelectionPayload: string[], multilineSelectionPayload: string[]) : string[] {
        console.log(`Transforming '${selection.length}' input lines.`);

        // transformations of replacement patterns
        let processedSelection =  mapReduce(selection, l => replaceAllPatterns(linePattern, linePatternTag, [l]));
        
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

        // extend pattern tags to lower likelyhood of containing tag in replacement content
        let extendedCurrentLinePatternTag = currentLinePatternTag;
        [extendedCurrentLinePatternTag, payloadPattern] = extendPattern(currentLinePatternTag, payloadPattern);

        let extendedSelectionPatternTag = selectionPatternTag;
        [extendedSelectionPatternTag, payloadPattern] = extendPattern(selectionPatternTag, payloadPattern);


        let result :string[] = payloadPattern;
        result =  mapReduce(result, l => replaceAllPatterns(l, extendedCurrentLinePatternTag, [currentLine]));
        result =  mapReduce(result, l => replaceAllPatterns(l, extendedSelectionPatternTag, processedSelection));

        console.log(`Transformed text is '${result.length}' lines.`);
        return result;
    }

    function breakDownStringToSlices(line: string, sliceLength: number) {
        let start = 0;
        let result : string[] = [];
        while (start < line.length) {
            result.push(line.substr(start, start + sliceLength));
            start += sliceLength;
        } 

        return result;
    }

    export function breakDownToFormat(lines: string[], payloadFormat: string, chunkSize: number) : string[] {
        switch (payloadFormat) {
            case PayloadFormat.Chunk:
                let asOneLine = lines.join("\n");
                let asArray = breakDownStringToSlices(asOneLine, chunkSize);
                return asArray;            
                break;
            case PayloadFormat.Line:
                return lines;
                break;        
            default:
                return [lines.join("\n")];
                break;
        }        
    }



