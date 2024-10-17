import terminalKit from "terminal-kit";
import * as fileLoader from "./fileLoader.js";
import * as commandProcessing from "./commandProcessing.js";
import fileMetaDataList from "./fileList.js";
const term = terminalKit.terminal;
const inputTree = ["", [
        ["help", (t, p) => { commandProcessing.help(t, p, inputTree); }, "shows all commands"],
        ["clear", () => { term.clear(); }, "clears the terminal"],
        ["exit", commandProcessing.exit, "exits the terminal"],
        ["quit", commandProcessing.exit, "exits the terminal"],
        ["stop", commandProcessing.exit, "exits the terminal"],
        ["load", commandProcessing.load, "load user save files"],
        ["list", [
                ["aspects", commandProcessing.listAspects, "displays all aspects in the game (even hidden ones)"],
                // locked recipes? maybe. could cause spoiler issues
                // shorthands for empty searches. see "search *" commands
                // remaining draws in decks. (RootPopulationCommand.DealersTable)
            ], "lists things in the game. CAN CONTAIN SPOILERS!"],
        ["info", [
                ["items", commandProcessing.infoItems, "info on item aspects and results for inspect/talk."],
            ], "give detailed info on something. does not need save file. CAN CONTAIN SPOILERS!"],
        ["search", [
                ["verbs", commandProcessing.searchVerbs, "search found popups and their card inputs."],
                // locked rooms
                ["items", commandProcessing.searchItems, "search owned items and their aspects."],
                ["itemCounts", commandProcessing.searchItemCounts, "list owned item counts."], // counts of items in house
                ["recipes", commandProcessing.searchRecipes, "search discovered (non-???) recipes and their outputs."],
            ], "finds unlocked things in your save file. load your save file 1st."],
        // overwrite/add something to save. OR have a local file to "force" knowledge of recipes and such?
        // recipes. some recipes' discovery are not recorded in the save file.
        // something for missing things?
        // how many skills are left
        // current loot tables for searches.
        // must ignore inaccessable searches.
        // ????? for resulting items that are not curently in the library.
        // IDK what to do for memories & items that are "discovered" but not present.
        // something for advanced stuff.
        ["misc", [
                ["missingCraftable", commandProcessing.missingCraftable, "lists all known recipes & ALL gathering spots that create items you don't have."],
                ["availableMemories", commandProcessing.availableMemories, "shows all memories that can be obtained."],
                // list max aspects possible for given crafting bench.
                // list max aspects possible for arbitrary crafting options (books).
            ], "things I couldn't categorize. CAN CONTAIN SPOILERS!"],
        // show max aspects \w specific inputs (skill, knowledge, memories, fuel, flower, ...)
        ["tables", [
                ["maxAspects", commandProcessing.maxAspects, "shows max aspects available."],
            ], "display's tables of info"],
        // ["alias",[
        // 	["save",(_=>undefined),"saves the last used command"],
        // 	["load",(_=>undefined),"loads a specific alias and runs the command"],
        // ],"save frequently used commands for easy use"],
    ], ""];
async function main() {
    await term.drawImage("resources/splash.png", { shrink: { width: term.width, height: term.height * 4 } });
    term.yellow("Book of Hours' Watcher\n");
    const fileLoadingProgress = term.progressBar({
        title: "Loading Files",
        items: fileMetaDataList.length,
        inline: true,
        // syncMode: true, // BUGGED: https://github.com/cronvel/terminal-kit/issues/251
    });
    await fileLoader.loadFiles((type, filename) => {
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
                term.red("failed to load " + filename + "\n");
                break;
            }
        }
    });
    term("\n");
    await inputLoop();
}
async function inputLoop() {
    // TODO: persist history
    while (true) {
        term("> ");
        const input = await term.inputField({
            history: await fileLoader.getHistory(),
            autoComplete: inputTree[1].flatMap(command => generateAutocomplete(command)),
            autoCompleteMenu: true,
            autoCompleteHint: true,
        }).promise;
        term("\n");
        if (!input) {
            term.eraseLine();
            term.previousLine(0);
            continue;
        }
        const parts = input.split(" ").filter(part => part !== "");
        const commandLookup = findCommand(parts);
        if (commandLookup === undefined) {
            term.yellow("command not found.\n");
            fileLoader.addHistory(input);
            continue;
        }
        try {
            const historyAppend = await commandLookup[0](term, commandLookup[1]);
            fileLoader.addHistory(input + (historyAppend ? " " + historyAppend : ""));
        }
        catch (error) {
            term.red("command threw an error.\n");
            fileLoader.addHistory(input);
        }
    }
}
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
        const nextNode = data.find(([name, _data]) => name.toLowerCase() === parts[i].toLowerCase());
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
main().finally(() => {
    term.processExit(0);
});
