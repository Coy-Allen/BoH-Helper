import terminalKit from "terminal-kit";
import * as fileLoader from "./fileLoader.js";
import * as commandProcessing from "./commandProcessing.js";
import fileMetaDataList from "./fileList.js";
import { dataFolder, isDebug, shouldAutoloadSave, defaultFile } from "./config.js";
import tables from "./commands/tables.js";
import list from "./commands/list.js";
import misc from "./commands/misc.js";
import search from "./commands/search.js";
import debugCommands from "./commands/debug.js";
import info from "./commands/info.js";
const term = terminalKit.terminal;
const inputTree = [[""], [
        [["help", "?"], (t, p) => commandProcessing.help(t, p, inputTree), "shows all commands"],
        [["clear"], () => {
                term.clear();
                return "";
            }, "clears the terminal"],
        [["exit", "quit", "stop"], commandProcessing.exit, "exits the terminal"],
        [["load"], commandProcessing.load, "load user save files"],
        list,
        info,
        search,
        // overwrite/add something to save. OR have a local file to "force" knowledge of recipes and such?
        // 	recipes. some recipes' discovery are not recorded in the save file.
        // something for missing things?
        // 	how many skills are left
        // 	current loot tables for searches.
        // 		must ignore inaccessable searches.
        // 		????? for resulting items that are not curently in the library.
        // 			IDK what to do for memories & items that are "discovered" but not present.
        // something for advanced stuff.
        misc,
        // show max aspects \w specific inputs (skill, knowledge, memories, fuel, flower, ...)
        tables,
        // ["alias",[
        // 	["save",(_=>undefined),"saves the last used command"],
        // 	["load",(_=>undefined),"loads a specific alias and runs the command"],
        // ],"save frequently used commands for easy use"],
    ], "The console! Autocomplete with tab. up/down to go through command history."];
if (isDebug) {
    inputTree[1].push(debugCommands);
}
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
                term.red("failed to load " + dataFolder + "\\" + filename + "\n");
                term.red("Check \"installFolder\" in the config.js file or verify your game's integrity.\n");
                throw new Error();
            }
        }
    });
    term("\n");
    if (shouldAutoloadSave) {
        try {
            await commandProcessing.load(term, defaultFile.split(" "));
        }
        catch (_) {
            term(`failed to autoload the save "${defaultFile}".`);
        }
    }
    term("");
    await inputLoop();
}
async function inputLoop() {
    while (true) {
        term("> ");
        const input = await term.inputField({
            history: await fileLoader.getHistory(),
            autoComplete: generateAutocomplete,
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
            await fileLoader.addHistory(input);
            continue;
        }
        try {
            const changedArguments = await commandLookup[1](term, commandLookup[2]);
            const finalArgs = changedArguments !== "" ? changedArguments : commandLookup[2].join(" ");
            await fileLoader.addHistory((commandLookup[0].join(" ") + " " + finalArgs).trimEnd());
        }
        catch (error) {
            term.red("command threw an error.\n");
            if (isDebug) {
                term.red(error.stack ?? "" + "\n");
                term.red(error.name + "\n");
                term.red(error.message + "\n");
            }
            await fileLoader.addHistory(input);
        }
    }
}
function findCommand(parts) {
    let targetNode = inputTree;
    const tree = [];
    for (let i = 0; i <= parts.length; i++) {
        const [, data] = targetNode;
        if (!Array.isArray(data)) {
            return [tree, data, parts.splice(i)];
        }
        if (parts.length === i) {
            return;
        }
        const nextNode = data.find(([names, _data]) => names.some(name => name.toLowerCase() === parts[i].toLowerCase()));
        if (nextNode === undefined) {
            return;
        }
        targetNode = nextNode;
        tree.push(nextNode[0][0]);
    }
    return;
}
function generateAutocomplete(input) {
    // FIXME: tabbing at end of fully complete command causes autocomplete to show parent command
    // FIXME: tabbing \w just a single ` as input causes a crash. maybe returns empty array?
    const parts = input.toLowerCase().split(" ").filter(part => part !== "");
    let outputTarget = inputTree;
    let index = 0;
    const output = [];
    const getAliasName = (aliases, targ) => {
        return aliases.find(name => name.startsWith(targ)) ?? aliases[0];
    };
    while (true) {
        const command = outputTarget[1];
        if (!Array.isArray(command)) {
            // command found. keep the rest of user input
            return [...output, ...parts.slice(index)].join(" ");
        }
        const part = parts[index] ?? "";
        const subCommands = command.filter(inputNode => inputNode[0].some(name => name.startsWith(part)));
        if (subCommands.length > 1) {
            // multiple possible commands. for aliases, only show primary name. (subCommand[0][0])
            return subCommands.map(subCommand => [...output, getAliasName(subCommand[0], part)].join(" "));
        }
        if (subCommands.length === 0) {
            // unknown command
            return [...output, ...parts.slice(index)].join(" ");
        }
        if (parts.length <= index + 1 && part.length < subCommands[0].length) {
            // still typing command
            return [...output, getAliasName(subCommands[0][0], part)].join(" ");
        }
        // switch target to the only command left
        outputTarget = subCommands[0];
        output.push(getAliasName(subCommands[0][0], part));
        index++;
    }
}
void main().finally(() => {
    term.processExit(0);
});
