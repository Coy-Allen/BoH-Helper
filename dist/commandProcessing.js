import os from "os";
import { loadSave, saveHistory } from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
const jsonSpacing = "  ";
export async function exit(term) {
    term("exiting...");
    await saveHistory();
    term.processExit(0);
}
export async function load(term) {
    term("save file> ");
    const filename = await term.fileInput({
        baseDir: os.homedir() + "\\AppData\\LocalLow\\Weather Factory\\Book of Hours",
        default: "AUTOSAVE.json",
    }).catch(_ => {
        //TODO: catch directory does not exist.
    });
    term("\n");
    if (!filename) {
        term.yellow("File not found.\n");
        return;
    }
    try {
        const save = JSON.parse(await loadSave(filename));
        dataProcessing.loadSave(save);
    }
    catch (err) {
        term.yellow("File failed to load.\n");
        //TODO: catch invalid file.
    }
}
export function listAspects(term) {
    term(dataProcessing.getAllAspects().sort().join(", ") + "\n");
}
export function infoItems(term, parts) {
    // TODO: move "parts" into a custom input handler
    const args = parts.join(" ");
    const result = dataProcessing.lookupItem(args);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
export function searchVerbs(term, parts) {
    // TODO: move "parts" into a custom input handler
    const args = JSON.parse(parts.join(" "));
    const result = dataProcessing.findVerbs(args);
    term(JSON.stringify("res: " + result.length, null, jsonSpacing) + "\n");
}
export async function searchItems(term, parts) {
    const arg = (parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        await getItemSearchOptions(term));
    const result = dataProcessing.findItems(arg);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
    if (parts.length === 0) {
        return JSON.stringify(arg);
    }
    return;
}
export async function searchItemCounts(term, parts) {
    const arg = (parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        await getItemSearchOptions(term));
    const counts = new Map();
    dataProcessing.findItems(arg).forEach(item => {
        counts.set(item.entityid, (counts.get(item.entityid) ?? 0) + 1);
    });
    term([...counts.entries()]
        .sort(([_A, countA], [_B, countB]) => countA - countB)
        .map(([name, count]) => `${name}: ${count}\n`)
        .join(""));
    if (parts.length === 0) {
        return JSON.stringify(arg);
    }
    return;
}
export async function searchRecipes(term, parts) {
    const arg = (parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        {
            reqs: {
                min: await getAspects(term, "Min input"),
                max: await getAspects(term, "Max input"),
            },
            output: {
                min: await getAspects(term, "Min output"),
                max: await getAspects(term, "Max output"),
            }
        });
    const result = dataProcessing.findRecipes(arg).map(recipe => [recipe[0].reqs, recipe[1]]);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
    if (parts.length === 0) {
        return JSON.stringify(arg);
    }
    return;
}
export function help(term, _parts, inputNode) {
    const getHelp = (node, depth) => {
        const [name, data, helpText] = node;
        if (depth >= 0) {
            term(jsonSpacing.repeat(depth));
            term.cyan(name);
            term(": " + helpText + "\n");
        }
        if (Array.isArray(data)) {
            for (const subNode of data) {
                getHelp(subNode, depth + 1);
            }
        }
    };
    getHelp(inputNode, -1);
}
export async function missingCraftable(term, parts) {
    const arg = JSON.parse(parts.join(" "));
    const found = dataProcessing.missingCraftable(arg);
    for (const [name, items] of found) {
        const detail = arg.detailed ? items.join(", ") : items.length.toString();
        term.cyan(`${name}`);
        term(`: ${detail}\n`);
    }
}
export async function availableMemories(term, parts) {
    const maxTargLen = 15;
    const genListOutput = (memories) => {
        for (const [memId, targs] of memories) {
            term(jsonSpacing);
            term.cyan(memId);
            if (targs.length <= maxTargLen) {
                term(": " + targs.join(", ") + "\n");
            }
            else {
                targs.length = maxTargLen;
                term(": " + targs.join(", ") + ", ");
                term.gray("...\n");
            }
        }
    };
    const arg = JSON.parse(parts.join(" "));
    const result = dataProcessing.availableMemories(arg);
    if (result.recipes) {
        term.blue("Recipes");
        term(":\n");
        genListOutput(result.recipes);
    }
    if (result.itemsConsumableInspect) {
        term.blue("Consumables (Inspect)");
        term(":\n");
        genListOutput(result.itemsConsumableInspect);
    }
    if (result.itemsConsumableTalk) {
        term.blue("Consumables (Talk)");
        term(":\n");
        genListOutput(result.itemsConsumableTalk);
    }
    if (result.itemsReusableInspect) {
        term.blue("Reusables (Inspect)");
        term(":\n");
        genListOutput(result.itemsReusableInspect);
    }
    if (result.itemsReusableTalk) {
        term.blue("Reusables (Talk)");
        term(":\n");
        genListOutput(result.itemsReusableTalk);
    }
}
export async function maxAspects(term, parts) {
    const arg = (parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        await (async () => {
            const rows = [];
            while (true) {
                rows.push(await getItemSearchOptions(term));
                term("add another row? [y|N]\n");
                if (!await term.yesOrNo({ yes: ["y"], no: ["n", "ENTER"] }).promise) {
                    break;
                }
            }
            term("change target aspects? [y|N]\n");
            if (await term.yesOrNo({ yes: ["y"], no: ["n", "ENTER"] }).promise) {
                return [rows, await getStrArray(term, "target aspects", dataProcessing.getAllAspects())];
            }
            return [rows];
        })());
    const result = await dataProcessing.maxAspects(...arg);
    term.table(result, {
        contentHasMarkup: true,
        // borderChars: "lightRounded",
    });
    if (parts.length === 0) {
        return JSON.stringify(arg);
    }
    return;
}
// helpers //
// these are for commands to request the specific thing from the user. user input shorthand
async function getItemSearchOptions(term, name) {
    return {
        min: await getAspects(term, "Min" + (name ? " " + name : "")),
        any: await getAspects(term, "Any" + (name ? " " + name : "")),
        max: await getAspects(term, "Max" + (name ? " " + name : "")),
        // TODO: nameValid?: string,
        // TODO: nameInvalid?: string,
    };
}
async function getAspects(term, name) {
    const aspectNames = dataProcessing.getAllAspects();
    const result = {};
    let aspect = "";
    let count = "";
    term("\n");
    while (true) {
        // print current result
        term.previousLine(0);
        term.eraseLine();
        term(`${name} = ${Object.entries(result).map(entry => `${entry[0]}:${entry[1]}`).join(", ")}\n`);
        // input
        term.eraseLine();
        term("aspect> ");
        aspect = (await term.inputField({
            autoComplete: aspectNames,
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
async function getStrArray(term, name, autocomplete) {
    const result = new Set();
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
            autoComplete: autocomplete ?? [],
            autoCompleteMenu: true,
            autoCompleteHint: true,
            cancelable: true,
        }).promise) ?? "";
        if (input === "") {
            break;
        }
        if (result.has(input)) {
            result.delete(input);
        }
        else {
            result.add(input);
        }
    }
    // clear the user input line
    term.eraseLine();
    term.column(0);
    return [...result.values()];
}
