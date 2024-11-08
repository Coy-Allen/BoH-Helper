import { getAllAspects } from "./dataProcessing.js";
import { markupReplaceList } from "./config.js";
export function markupReplace(text) {
    const isArray = Array.isArray(text);
    const input = isArray ? text : [text];
    const res = [];
    for (const str of input) {
        const replaced = markupReplaceList.reduce((prev, [regex, color]) => {
            return prev.replaceAll(regex, `^[${color}]$&^:`);
        }, str);
        res.push(replaced);
    }
    if (isArray) {
        return res;
    }
    return res[0];
}
export async function getItemSearchOptions(term, name) {
    return {
        min: await getAspects(term, "Min" + (name ? " " + name : "")),
        any: await getAspects(term, "Any" + (name ? " " + name : "")),
        max: await getAspects(term, "Max" + (name ? " " + name : "")),
        nameValid: (await getStrArray(term, "Name Matches" + (name ? " " + name : ""), { min: 0, max: 1 }))[0],
        nameInvalid: (await getStrArray(term, "Name NOT Matches" + (name ? " " + name : ""), { min: 0, max: 1 }))[0],
    };
}
export async function getAspects(term, name) {
    // TODO: add strict to options
    const aspectNames = getAllAspects();
    const result = {};
    let aspect = "";
    let count = "";
    term("\n");
    const autocompleteList = (input) => {
        return generateAutocomplete(generateCommandNames(aspectNames, "\\."), input);
    };
    while (true) {
        // print current result
        term.previousLine(0);
        term.eraseLine();
        term(`${name} = ${Object.entries(result).map(entry => `${entry[0]}:${entry[1]}`).join(", ")}\n`);
        // input
        term.eraseLine();
        term("aspect> ");
        aspect = (await term.inputField({
            autoComplete: autocompleteList,
            autoCompleteMenu: true,
            autoCompleteHint: true,
            cancelable: true,
        }).promise) ?? "";
        if (aspect === "") {
            break;
        }
        while (true) {
            term.eraseLine();
            term.column(0);
            term("count> ");
            count = (await term.inputField({
                cancelable: true,
            }).promise) ?? "";
            if (count === "") {
                break;
            }
            const countNumber = Number(count);
            if (!Number.isSafeInteger(countNumber)) {
                continue;
            }
            // add to result
            result[aspect] = countNumber;
            if (result[aspect] <= 0) {
                delete result[aspect];
            }
            break;
        }
    }
    // clear the user input line
    term.eraseLine();
    term.column(0);
    return result;
}
export async function getNum(term, name, options) {
    const optionsFull = {
        min: options?.min ?? Number.MIN_SAFE_INTEGER,
        default: options?.default,
        max: options?.max ?? Number.MAX_SAFE_INTEGER,
    };
    let result = undefined;
    term("");
    while (true) {
        term.eraseLine();
        term(name + "> ");
        const input = (await term.inputField({
            cancelable: true,
        }).promise) ?? "";
        if (optionsFull.default !== undefined && input === "") {
            result = optionsFull.default;
            break;
        }
        const num = parseInt(input, 10);
        if (isNaN(num)) {
            continue;
        }
        if (Number.isSafeInteger(num)) {
            continue;
        }
        if (optionsFull.min > num || optionsFull.max < num) {
            continue;
        }
        result = num;
        break;
    }
    // clear the user input line
    term.eraseLine();
    term.column(0);
    return result;
}
export async function getStrArray(term, name, options) {
    const result = new Set();
    const optionsFull = {
        autocomplete: options?.autocomplete ?? [],
        min: options?.min ?? 1,
        max: options?.max,
        strict: options?.strict ?? true,
    };
    const autocompleteDelimiter = options?.autocompleteDelimiter;
    const autocompleteList = autocompleteDelimiter === undefined ?
        optionsFull.autocomplete :
        input => { return generateAutocomplete(generateCommandNames(optionsFull.autocomplete, autocompleteDelimiter), input); };
    let input = "";
    term("\n");
    while (true) {
        // print current result
        term.previousLine(0);
        term.eraseLine();
        term(`${name} = ${[...result.values()].join(", ")}\n`);
        // input
        term.eraseLine();
        term("input> ");
        input = (await term.inputField({
            autoComplete: autocompleteList,
            autoCompleteMenu: true,
            autoCompleteHint: true,
            cancelable: true,
        }).promise) ?? "";
        if (input === "" && optionsFull.min <= result.size) {
            break;
        }
        if (optionsFull.strict &&
            optionsFull.autocomplete.length !== 0 &&
            !optionsFull.autocomplete.includes(input)) {
            continue;
        }
        if (result.has(input)) {
            result.delete(input);
            continue;
        }
        if (optionsFull.max === undefined || result.size < optionsFull.max) {
            result.add(input);
        }
    }
    // clear the user input line
    term.eraseLine();
    term.column(0);
    return [...result.values()];
}
function generateCommandNames(options, delimiter) {
    const result = [];
    const regexSplit = new RegExp(`(?=${delimiter})`);
    for (const option of options) {
        const parts = [...option.split(regexSplit), ""];
        let prevSections = result;
        for (const part of parts) {
            if (!prevSections.map(section => section[0]).includes(part)) {
                prevSections.push([part, []]);
            }
            prevSections = prevSections.find(section => section[0] === part)?.[1] ?? [];
        }
    }
    return result;
}
function generateAutocomplete(options, inputRaw) {
    const input = inputRaw.toLowerCase();
    let inputIndex = 0;
    let outputTargets = ["", options];
    const output = [];
    while (true) {
        const commands = outputTargets[1].filter(outputTarget => {
            return outputTarget[0].startsWith(input.slice(inputIndex)) ||
                input.startsWith(outputTarget[0], inputIndex);
        });
        if (commands.length > 1) {
            // multiple possible commands
            return commands.map(command => [...output, command[0]].join(""));
        }
        if (commands.length === 0) {
            // unknown command
            return output.join("");
        }
        const command = commands[0];
        output.push(command[0]);
        inputIndex += command[0].length;
        outputTargets = command;
    }
}
