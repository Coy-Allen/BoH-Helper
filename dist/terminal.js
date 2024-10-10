import terminalKit from "terminal-kit";
import * as loader from "./bohLoader.js";
import * as inputProcessing from "./inputProcessing.js";
const term = terminalKit.terminal;
async function main() {
    await term.drawImage("resources/splash.png", { shrink: { width: term.width, height: term.height * 4 } });
    term.yellow("Book of Hours' Watcher\n");
    const fileLoadingProgress = term.progressBar({
        title: "Loading Files",
        items: loader.fileMetaDataList.length,
        inline: true,
        // syncMode: true, // BUGGED: https://github.com/cronvel/terminal-kit/issues/251
    });
    await loader.loadFiles((type, filename) => {
        switch (type) {
            case "start": {
                fileLoadingProgress.startItem(filename);
                break;
            }
            case "success": {
                fileLoadingProgress.itemDone(filename);
                break;
            }
            case "failed": {
                fileLoadingProgress.stop();
                term.red("failed to load " + filename);
                break;
            }
        }
    });
    await inputLoop();
}
main().finally(() => {
    term.processExit(0);
});
async function inputLoop() {
    // TODO: save history
    const history = [];
    while (true) {
        term("\n> ");
        const input = await term.inputField({
            history: history,
            autoComplete: inputTree[1].flatMap(command => generateAutocomplete(command)),
            autoCompleteMenu: true,
            autoCompleteHint: true,
        }).promise;
        if (!input) {
            term.eraseLine();
            term.previousLine(0);
            continue;
        }
        history.push(input);
        const parts = input.split(" ").filter(part => part !== "");
        const commandLookup = findCommand(parts);
        term("\n");
        if (commandLookup === undefined) {
            term.yellow("command not found.");
            continue;
        }
        await commandLookup[0](term, commandLookup[1]);
    }
}
const inputTree = ["", [
        ["help", () => { term("WIP"); }],
        ["clear", () => { term.clear(); }],
        ["exit", (t) => inputProcessing.exit(t)],
        ["quit", (t) => inputProcessing.exit(t)],
        ["stop", (t) => inputProcessing.exit(t)],
        ["load", () => { term("WIP"); }],
        ["list", [
                ["aspects", () => { term("WIP"); }],
            ]],
        ["info", [
                ["items", () => { term("WIP"); }],
            ]],
        ["search", [
                ["items", () => { term("WIP"); }],
                ["recipes", () => { term("WIP"); }],
            ]],
    ]];
function findCommand(parts) {
    // TODO: clean this up
    let targetNode = inputTree;
    for (let i = 0; i <= parts.length; i++) {
        const [_name, data] = targetNode;
        if (!Array.isArray(data)) {
            return [data, parts.splice(i)];
        }
        if (parts.length === i) {
            return;
        }
        const nextNode = data.find(([name, _data]) => name === parts[i].toLowerCase());
        if (nextNode === undefined) {
            return;
        }
        targetNode = nextNode;
    }
    return;
}
function generateAutocomplete([name, data]) {
    if (Array.isArray(data)) {
        return data.flatMap(subCommand => generateAutocomplete(subCommand).map(part => name + " " + part));
    }
    return [name];
}
