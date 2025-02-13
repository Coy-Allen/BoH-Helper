import { data } from "./dataProcessing.js";
export const itemFilter = {
    id: "object",
    name: "item filter",
    options: {},
    subType: [
        ["min", false, { id: "aspects", name: "min aspects", options: {} }],
        ["any", false, { id: "aspects", name: "any aspects", options: {} }],
        ["max", false, { id: "aspects", name: "max aspects", options: {} }],
        ["nameValid", false, { id: "string", name: "matches RegEx", options: { autocomplete: [], strict: false } }],
        ["nameInvalid", false, { id: "string", name: "NOT matches RegEx", options: { autocomplete: [], strict: false } }],
    ],
};
export const aspectTarget = {
    id: "stringArray",
    name: "item filter",
    options: {
        autocomplete: data.aspects.values(),
        autocompleteDelimiter: "\\.",
        strict: true,
    },
};
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
;
;
;
;
;
;
;
;
export async function validateOrGetInput(term, input, target) {
    if (input === "") {
        return getInput(term, target);
    }
    try {
        const json = JSON.parse(input);
        const validationResult = validateInput(json, target);
        if (validationResult === "") {
            return json;
        }
        term.red(`option validation failed: ${validationResult}\n`);
    }
    catch (_) {
        term.red("option validation failed: Not valid JSON\n");
    }
    return getInput(term, target);
}
export function validateInput(input, target) {
    if (input === undefined) {
        return target.required ?? true ? "" : "is undefined";
    }
    switch (target.id) {
        case "string": {
            if (typeof input !== "string") {
                return "is not a string";
            }
            if (target.options.strict && !target.options.autocomplete.includes(input)) {
                return "is not included in autocomplete list";
            }
            return "";
        }
        case "object": {
            if (typeof input !== "object" || Array.isArray(input) || input === null) {
                return "is not an object";
            }
            for (const [name, isRequired, subType] of target.subType) {
                const subInput = input[name];
                if (subInput === undefined) {
                    if (isRequired) {
                        return "is undefined for required key " + name;
                    }
                    continue;
                }
                const res = validateInput(subInput, subType);
                if (res !== "") {
                    return `[${name}] ${res}`;
                }
            }
            return "";
        }
        case "array": {
            if (!Array.isArray(input)) {
                return "is not an array";
            }
            if (target.options.minLength !== undefined && input.length < target.options.minLength) {
                return "is below the minimum length";
            }
            if (target.options.maxLength !== undefined && input.length > target.options.maxLength) {
                return "is above the maximum length";
            }
            for (let i = 0; i < input.length; i++) {
                const res = validateInput(input[i], target.subType);
                if (res !== "") {
                    return `[${i}] ${res}`;
                }
            }
            ;
            return "";
        }
        case "stringArray": {
            if (!Array.isArray(input)) {
                return "is not an array";
            }
            if (target.options.minLength !== undefined && input.length < target.options.minLength) {
                return "is below the minimum length";
            }
            if (target.options.maxLength !== undefined && input.length > target.options.maxLength) {
                return "is above the maximum length";
            }
            for (let i = 0; i < input.length; i++) {
                const entry = input[i];
                if (typeof entry !== "string") {
                    return `is not a string at index ${i}`;
                }
                if (target.options.strict && !target.options.autocomplete.includes(entry)) {
                    return `is not included in autocomplete list at index ${i}`;
                }
            }
            return "";
        }
        case "aspects": {
            if (typeof input !== "object" || Array.isArray(input) || input === null) {
                return "is not an object";
            }
            for (const [name, count] of Object.entries(input)) {
                if (!data.aspects.has(name)) {
                    return `${name} is not a valid aspect`;
                }
                if (!Number.isSafeInteger(count)) {
                    return "is not a safe integer";
                }
                const integer = count;
                if (integer < 0) {
                    return `${name}'s count is below 0`;
                }
            }
            return "";
        }
        case "integer": {
            if (!Number.isSafeInteger(input)) {
                return "is not a safe integer";
            }
            const integer = input;
            if (target.options.min !== undefined && integer < target.options.min) {
                return "is below the minimum value allowed";
            }
            if (target.options.max !== undefined && integer > target.options.max) {
                return "is above the max value allowed";
            }
            return "";
        }
        case "boolean": {
            if (typeof input !== "boolean") {
                return "is not a boolean";
            }
            return "";
        }
        default: {
            throw TypeError("unknown type given");
        }
    }
}
export async function getInput(term, target) {
    term(target.name + ": \n");
    let result;
    if (!(target.required ?? true)) {
        term("skip? [y|N]\n");
        if (await term.yesOrNo({ yes: ["y"], no: ["n", "ENTER"] }).promise) {
            term.previousLine(0);
            term.eraseLine();
            term.previousLine(0);
            term.eraseLine();
            term(target.name + ": undefined\n");
            return undefined;
        }
        term.previousLine(0);
        term.eraseLine();
    }
    term.previousLine(0);
    term.eraseLine();
    switch (target.id) {
        case "string": {
            const autocompleteDelimiter = target.options.autocompleteDelimiter;
            const autocompleteList = autocompleteDelimiter === undefined ?
                target.options.autocomplete :
                input => { return generateAutocomplete(generateCommandNames(target.options.autocomplete, autocompleteDelimiter), input); };
            while (true) {
                term.eraseLine();
                term.column(0);
                term(`${target.name}> `);
                const input = await term.inputField({
                    autoComplete: autocompleteList,
                    default: target.options.default,
                    autoCompleteMenu: true,
                    autoCompleteHint: true,
                    cancelable: true,
                }).promise ?? "";
                if (!target.options.strict || target.options.autocomplete.includes(input)) {
                    result = input;
                    break;
                }
            }
            break;
        }
        case "object": {
            const tempResult = {};
            term(`${target.name}: ${JSON.stringify(tempResult)}\n`);
            for (const [name, isRequired, subType] of target.subType) {
                if (!isRequired) {
                    // TODO: stub. ask if needed
                }
                const subTypeResult = await getInput(term, subType);
                tempResult[name] = subTypeResult;
                if (target.options.keepEntryVisual) {
                    term.previousLine(0);
                    term.eraseLine();
                    term.previousLine(0);
                    term.eraseLine();
                    term(`${target.name}: ${JSON.stringify(tempResult)}\n`);
                }
            }
            if (!target.options.keepEntryVisual) {
                for (const _ of target.subType) {
                    term.previousLine(0);
                    term.eraseLine();
                }
            }
            term.previousLine(0);
            term.eraseLine();
            result = tempResult;
            break;
        }
        case "array": {
            const tempResult = [];
            while (true) {
                term(`${target.name}: ${JSON.stringify(tempResult)}\n`);
                const options = ["add"];
                if (tempResult.length > 0) {
                    options.push("remove");
                }
                if ((target.options.minLength === undefined || tempResult.length >= target.options.minLength) &&
                    (target.options.maxLength === undefined || tempResult.length <= target.options.maxLength)) {
                    options.push("done", "");
                }
                term(`${target.name}> `);
                const input = await term.inputField({
                    autoComplete: options,
                    autoCompleteMenu: true,
                    autoCompleteHint: true,
                    cancelable: true,
                }).promise ?? "";
                if (!options.includes(input)) {
                    term.previousLine(0);
                    term.eraseLine();
                    continue;
                }
                if (input === "" || input === "done") {
                    break;
                }
                if (input === "add") {
                    tempResult.push(await getInput(term, target.subType));
                }
                if (input === "remove") {
                    const index = await getInput(term, {
                        id: "integer",
                        name: "index",
                        options: {
                            min: 0,
                            max: tempResult.length - 1,
                            default: tempResult.length - 1,
                        },
                    });
                    tempResult.splice(index, 1);
                }
                term.previousLine(0);
                term.eraseLine();
                term.previousLine(0);
                term.eraseLine();
            }
            term.previousLine(0);
            term.eraseLine();
            result = tempResult;
            break;
        }
        case "stringArray": {
            const selected = new Set();
            // setup autocomplete
            const autocompleteDelimiter = target.options.autocompleteDelimiter;
            const autocompleteList = autocompleteDelimiter === undefined ?
                target.options.autocomplete :
                input => { return generateAutocomplete(generateCommandNames(target.options.autocomplete, autocompleteDelimiter), input); };
            while (true) {
                // print current result
                term(`${target.name}: ${JSON.stringify([...selected.values()])}\n`);
                // input
                term.eraseLine();
                term(`${target.name}> `);
                const input = await term.inputField({
                    autoComplete: autocompleteList,
                    autoCompleteMenu: true,
                    autoCompleteHint: true,
                    cancelable: true,
                }).promise ?? "";
                if (input === "" && (target.options.minLength === undefined || target.options.minLength <= selected.size)) {
                    break;
                }
                term.previousLine(0);
                term.eraseLine();
                if (input === "" ||
                    target.options.strict &&
                        target.options.autocomplete.length !== 0 &&
                        !target.options.autocomplete.includes(input)) {
                    continue;
                }
                if (selected.has(input)) {
                    selected.delete(input);
                    continue;
                }
                if (target.options.maxLength === undefined || selected.size < target.options.maxLength) {
                    selected.add(input);
                }
            }
            term.eraseLine();
            term.previousLine(0);
            term.eraseLine();
            result = [...selected.values()];
            break;
        }
        case "aspects": {
            const aspectNames = data.aspects.values();
            const tempResult = new Map();
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
                term(`${target.name}: ${JSON.stringify(Object.fromEntries(tempResult.entries()))}\n`);
                // input
                term.eraseLine();
                term("aspect> ");
                aspect = await term.inputField({
                    autoComplete: autocompleteList,
                    autoCompleteMenu: true,
                    autoCompleteHint: true,
                    cancelable: true,
                }).promise ?? "";
                if (aspect === "" &&
                    (target.options.minTypes === undefined || target.options.minTypes <= tempResult.size) &&
                    (target.options.maxTypes === undefined || target.options.maxTypes >= tempResult.size)) {
                    break;
                }
                if (!data.aspects.has(aspect)) {
                    continue;
                }
                while (true) {
                    term.eraseLine();
                    term.column(0);
                    term("count> ");
                    count = await term.inputField({
                        cancelable: true,
                    }).promise ?? "";
                    if (count === "") {
                        break;
                    }
                    const countNumber = Number(count);
                    if (!Number.isSafeInteger(countNumber)) {
                        continue;
                    }
                    // add to result
                    tempResult.set(aspect, countNumber);
                    if ((tempResult.get(aspect) ?? 0) <= 0) {
                        tempResult.delete(aspect);
                    }
                    break;
                }
            }
            // clear the user input line
            term.eraseLine();
            term.previousLine(0);
            term.eraseLine();
            result = Object.fromEntries(tempResult.entries());
            break;
        }
        case "integer": {
            let tempResult = undefined;
            term("");
            while (true) {
                term(target.name + "> ");
                const input = await term.inputField({
                    cancelable: true,
                }).promise ?? "";
                term.eraseLine();
                term.column(0);
                if (input === "") {
                    if (target.options.default !== undefined) {
                        tempResult = target.options.default;
                        break;
                    }
                    continue;
                }
                const num = Number(input);
                if (isNaN(num)) {
                    continue;
                }
                if (!Number.isSafeInteger(num)) {
                    continue;
                }
                if (target.options.min !== undefined && target.options.min > num ||
                    target.options.max !== undefined && target.options.max < num) {
                    continue;
                }
                tempResult = num;
                break;
            }
            result = tempResult;
            break;
        }
        case "boolean": {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            let tempResult = undefined;
            const [yes, no] = [["y"], ["n"]];
            const visualOptions = ["y", "n"];
            switch (target.options.default) {
                case true: {
                    yes.push("ENTER");
                    visualOptions[0] = "Y";
                    break;
                }
                case false: {
                    no.push("ENTER");
                    visualOptions[1] = "N";
                    break;
                }
                case undefined: {
                    break;
                }
            }
            term(`${target.name}? [${visualOptions.join("|")}]\n`);
            while (tempResult === undefined) {
                tempResult = await term.yesOrNo({ yes: yes, no: no }).promise;
            }
            term.previousLine(0);
            result = tempResult;
            break;
        }
        default: {
            throw TypeError("unknown type given");
        }
    }
    // clear the user input line
    term.eraseLine();
    term.column(0);
    term(`${target.name}: ${JSON.stringify(result)}\n`);
    return result;
}
