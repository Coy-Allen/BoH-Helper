import { loadSave, saveHistory } from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
import { config } from "./config.js";
import { watch } from "fs";
let saveFileWatcherFilename;
let saveFileWatcher;
let fileReadTimer;
let shouldReadFile;
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
            baseDir: config.saveLocation,
            default: config.defaultFile,
        }).catch((_) => {
            term.yellow("Save directory not found. Check \"saveLocation\" in the config.js file.\n");
        });
        term("\n");
    }
    else {
        filename = config.saveLocation + "/" + parts.join(" ");
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
        saveFileWatcherFilename = filename;
        saveFileWatcher = watch(filename, fileChangeTrigger);
        term("file watcher created\n");
        return "";
    }
    return parts.join(" ");
}
function closeWatcher() {
    if (saveFileWatcher === undefined) {
        return false;
    }
    saveFileWatcher.close();
    saveFileWatcher = undefined;
    fileReadTimer = undefined;
    shouldReadFile = false;
    return true;
}
function fileChangeTrigger() {
    clearInterval(fileReadTimer);
    fileReadTimer = undefined;
    shouldReadFile = false;
    fileReadTimer = setInterval(() => { shouldReadFile = true; }, 5000);
}
export async function checkWatcherFileLoad(term) {
    if (!shouldReadFile) {
        return;
    }
    term("loading save file\n");
    if (await loadFile(saveFileWatcherFilename)) {
        term("save file loaded\n");
    }
    else {
        term.red("failed to load save file. stopping file watcher.\n");
        closeWatcher();
    }
    shouldReadFile = false;
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
        term(config.jsonSpacing.repeat(depth));
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
