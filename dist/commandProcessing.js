import { loadSave, saveHistory } from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
import { jsonSpacing, saveLocation, defaultFile } from "./config.js";
import { watch } from "fs";
let saveFileWatcher;
export async function exit(term) {
    term("exiting...");
    closeWatcher();
    await saveHistory();
    term.processExit(0);
    return "";
}
export async function load(term, parts) {
    if (closeWatcher()) {
        term("closed previous save file watcher.\n");
    }
    let filename;
    if (parts.length === 0) {
        term("save file> ");
        filename = await term.fileInput({
            baseDir: saveLocation,
            default: defaultFile,
        }).catch((_) => {
            term.yellow("Save directory not found. Check \"saveLocation\" in the config.js file.\n");
        });
        term("\n");
    }
    else {
        filename = saveLocation + "/" + parts.join(" ");
    }
    if (!filename) {
        term.yellow("File not found.\n");
        return "";
    }
    if (!await loadFile(filename)) {
        term.yellow("File failed to load.\n");
        return "";
    }
    if (parts.length === 0) {
        term("watch file for changes? [y|N]\n");
        if (!await term.yesOrNo({ yes: ["y"], no: ["n", "ENTER"] }).promise) {
            return "";
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
                // FIXME: just try again. skipping this for now
                // term.red("save file watcher encountered an error and will close.\n");
                // closeWatcher();
            });
        });
        term("file watcher created\n");
        return "";
    }
    // TODO: make args pick which file to load.
    return parts.join(" ");
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
export function help(term, parts, inputNode) {
    const getHelp = (node, depth) => {
        const [name, data, helpText] = node;
        term(jsonSpacing.repeat(depth));
        term.cyan(name.join("/"));
        term(": " + helpText + "\n");
        if (Array.isArray(data)) {
            for (const subNode of data) {
                getHelp(subNode, depth + 1);
            }
        }
    };
    let targetNode = inputNode;
    for (const part of parts) {
        const subTree = targetNode[1];
        if (!Array.isArray(subTree)) {
            break;
        }
        const nextTree = subTree.find(node => node[0].includes(part));
        if (nextTree === undefined) {
            break;
        }
        targetNode = nextTree;
    }
    getHelp(targetNode, 0);
    return "";
}
