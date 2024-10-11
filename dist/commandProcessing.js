import os from "os";
import { loadSave } from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
const jsonSpacing = "  ";
export function exit(term) {
    term("exiting...");
    term.processExit(0);
}
export async function load(term) {
    term("save file> ");
    const filename = await term.fileInput({
        baseDir: os.homedir() + "\\AppData\\LocalLow\\Weather Factory\\Book of Hours",
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
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
export function searchItems(term, parts) {
    // TODO: move "parts" into a custom input handler
    const args = JSON.parse(parts.join(" "));
    const result = dataProcessing.findItems(args);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
export function searchRecipes(term, parts) {
    // TODO: move "parts" into a custom input handler
    const arg = JSON.parse(parts.join(" "));
    const result = dataProcessing.findRecipes(arg).map(recipe => [recipe[0].reqs, recipe[1]]);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
