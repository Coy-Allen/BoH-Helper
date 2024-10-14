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
    term([...dataProcessing.getAllAspects()].sort().join(", ") + "\n");
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
export function searchItems(term, parts) {
    // TODO: move "parts" into a custom input handler
    const args = JSON.parse(parts.join(" "));
    const result = dataProcessing.findItems(args);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
export function searchItemCounts(term, parts) {
    // TODO: move "parts" into a custom input handler
    const args = JSON.parse(parts.join(" "));
    const counts = new Map();
    dataProcessing.findItems(args).forEach(item => {
        counts.set(item.entityid, (counts.get(item.entityid) ?? 0) + 1);
    });
    term([...counts.entries()]
        .sort(([_A, countA], [_B, countB]) => countA - countB)
        .map(([name, count]) => `${name}: ${count}\n`)
        .join(""));
}
export function searchRecipes(term, parts) {
    // TODO: move "parts" into a custom input handler
    const arg = JSON.parse(parts.join(" "));
    const result = dataProcessing.findRecipes(arg).map(recipe => [recipe[0].reqs, recipe[1]]);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
export function help(term, _parts, inputNode) {
    const getHelp = (node, depth) => {
        const [name, data, helpText] = node;
        if (depth >= 0) {
            term("  ".repeat(depth));
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
// helpers
//@ts-expect-error unused
async function getAspects(term) {
    // TODO: stub
    return {};
}
//@ts-expect-error unused
async function getStrArray(term, autocomplete) {
    // TODO: stub
    return [];
}
