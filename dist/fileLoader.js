import fs from "fs/promises";
import json5 from "json5";
import iconv from "iconv-lite";
import fileMetaDataList from "./fileList.js";
import { data } from "./dataProcessing.js";
import { dataFolder, maxHistory } from "./config.js";
const fileOutputs = {
    decks: [],
    items: [],
    recipes: [],
    verbs: [],
};
let history;
export async function loadFiles(dispatch) {
    // TODO: find BoH data folder even if installed elsewhere
    for (const fileMetaData of fileMetaDataList) {
        dispatch("start", fileMetaData.name);
        const outputs = fileOutputs[fileMetaData.type];
        try {
            const fileContent = await fs.readFile(dataFolder + "\\" + fileMetaData.name)
                .then(file => iconv.decode(file, fileMetaData.encoding).toLowerCase())
                .then(contents => fileMetaData.postProcessing?.(contents) ?? contents);
            outputs.push(json5.parse(fileContent));
            dispatch("success", fileMetaData.name);
        }
        catch (_) {
            dispatch("failed", fileMetaData.name);
        }
    }
    dispatch("start", "finalizing");
    // FIXME: dupe messages have the loading bar behind them. need to clear the line beforehand.
    pushData();
    dispatch("success", "finalizing");
}
export async function loadSave(saveFile) {
    return await fs.readFile(saveFile).then(file => iconv.decode(file, "utf8").toLowerCase());
}
function pushData() {
    data.aspects.overwrite(fileOutputs.items.flatMap(item => item.elements.filter(element => element.isaspect ?? false)).map(element => element.id));
    // notice: the aspect search in the items and recipes are no longer added to aspects.
    data.elements.overwrite(fileOutputs.items.flatMap(files => files.elements));
    data.recipes.overwrite(fileOutputs.recipes.flatMap(recipes => recipes.recipes));
    data.verbs.overwrite(fileOutputs.verbs.flatMap(verbs => verbs.verbs).filter(verb => !verb.spontaneous));
    data.decks.overwrite(fileOutputs.decks.flatMap(decks => decks.decks));
}
// history handler
export async function getHistory() {
    if (history) {
        return history;
    }
    try {
        history = (await fs.readFile(import.meta.dirname + "/../history.txt", "utf8")).split("\n");
    }
    catch (_) {
        history = [];
    }
    return history;
}
export async function addHistory(line) {
    if (!history) {
        await getHistory();
    }
    if (!history) {
        console.error("failed to initalize history.");
        return;
    }
    history.push(line);
}
export async function saveHistory() {
    if (!history) {
        // no history to save
        return;
    }
    try {
        const trunkHistory = history.slice(Math.max(history.length - maxHistory, 0));
        await fs.writeFile(import.meta.dirname + "/../history.txt", trunkHistory.join("\n"));
    }
    catch (_) {
        // TODO: alert user of save issue
    }
}
