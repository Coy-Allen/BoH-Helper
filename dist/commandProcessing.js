import { loadSave, saveHistory } from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
import { jsonSpacing, saveLocation } from "./config.js";
import { watch } from "fs";
let saveFileWatcher;
export async function exit(term) {
    term("exiting...");
    closeWatcher();
    await saveHistory();
    term.processExit(0);
}
export async function load(term) {
    if (!closeWatcher()) {
        term("closing previous save file watcher.\n");
    }
    term("save file> ");
    const filename = await term.fileInput({
        baseDir: saveLocation,
        default: "AUTOSAVE.json",
    }).catch((_) => {
        term.yellow("Save directory not found. Check \"saveLocation\" in the config.js file.\n");
    });
    term("\n");
    if (!filename) {
        term.yellow("File not found.\n");
        return;
    }
    if (!await loadFile(filename)) {
        term.yellow("File failed to load.\n");
        return;
    }
    term("watch file for changes? [y|N]\n");
    if (!await term.yesOrNo({ yes: ["y"], no: ["n", "ENTER"] }).promise) {
        return;
    }
    // FIXME: game saves in multiple passes! it WILL fail ~3 times,
    //   then save unfinished copies 2 times before saving 1 final time.
    // FIXME: this async output breaks the display. need a work around. maybe something that delays the load/output,
    //   then runs the code just before the main input loop asks for user input?
    saveFileWatcher = watch(filename, (_event) => {
        void loadFile(filename).then(res => {
            if (res) {
                term("save file reloaded.\n");
                return;
            }
            term.red("save file watcher encountered an error and will close.\n");
            closeWatcher();
        });
    });
    term("file watcher created\n");
}
function closeWatcher() {
    if (saveFileWatcher === undefined) {
        return false;
    }
    saveFileWatcher.close();
    saveFileWatcher = undefined;
    return true;
}
async function loadFile(filename) {
    try {
        dataProcessing.loadSave(JSON.parse(await loadSave(filename)));
        return true;
    }
    catch (_) {
        return false;
    }
}
export function infoItems(term, parts) {
    // TODO: move "parts" into a custom input handler
    const args = parts.join(" ");
    const result = dataProcessing.lookupItem(args);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
export function help(term, _parts, inputNode) {
    const getHelp = (node, depth) => {
        const [name, data, helpText] = node;
        if (depth >= 0) {
            term(jsonSpacing.repeat(depth));
            term.cyan(name.join("/"));
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
