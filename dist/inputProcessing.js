import os from "os";
import { loadSave } from "./fileLoader.js";
import * as loader from "./loader.js";
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
        loader.loadSave(save);
    }
    catch (err) {
        term.yellow("File failed to load.\n");
        //TODO: catch invalid file.
    }
}
export function listAspects(term) {
    term([...loader.getAllAspects()].sort().join(", ") + "\n");
}
export function infoItems(term, parts) {
    // FIXME: move "parts" into a custom input handler
    term(JSON.stringify(loader.lookupItem(parts.join(" ")), null, jsonSpacing) + "\n");
}
export function searchItems(term, parts) {
    // FIXME: move "parts" into a custom input handler
    term(JSON.stringify(loader.findItems(JSON.parse(parts.join(" "))), null, jsonSpacing) + "\n");
}
export function searchRecipes(term, parts) {
    // FIXME: move "parts" into a custom input handler
    const arg = JSON.parse(parts.join(" "));
    term(JSON.stringify(loader.findRecipes(arg).map(recipe => [recipe[0].reqs, recipe[1]]), null, jsonSpacing) + "\n");
}
