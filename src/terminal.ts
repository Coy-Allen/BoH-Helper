import type * as types from "./types.ts";

import terminalKit from "terminal-kit";
import * as fileLoader from "./fileLoader.ts";
import * as commandProcessing from "./commandProcessing.ts";
import {fileMetaDataList, dlcMaxCounts} from "./fileList.ts";
import {configCommands, config} from "./config.ts";


import tables from "./commands/tables.ts";
import list from "./commands/list.ts";
import misc from "./commands/misc.ts";
import search from "./commands/search.ts";
import debugCommands from "./commands/debug.ts";
import info from "./commands/info.ts";

const term = terminalKit.terminal;
const inputTree: [[string, ...string[]], [types.inputNode, ...types.inputNode[]], string] = [[""], [
	[["help", "?"], (t, p): string=>commandProcessing.help(t, p, inputTree), "shows all commands"],
	configCommands,
	[["clear"], (): string=>{
		term.clear();
		return "";
	}, "clears the terminal"],
	[["exit", "quit", "stop"], commandProcessing.exit, "exits the terminal"],
	// ["alias",[
	// 	["save",(_=>undefined),"saves the last used command"],
	// 	["load",(_=>undefined),"loads a specific alias and runs the command"],
	// ],"save frequently used commands for easy use"],
], "The console! Autocomplete with tab. up/down to go through command history."];

async function main(): Promise<void> {
	await term.drawImage(
		"resources/splash.png",
		{shrink: {width: term.width, height: term.height*4}},
	);
	term.yellow("Book of Hours' Watcher\n");
	const fileLoadingProgress = term.progressBar({
		title: "Loading Files",
		items: fileMetaDataList.length,
		inline: true,
		// syncMode: true, // BUGGED: https://github.com/cronvel/terminal-kit/issues/251
	});
	await fileLoader.loadFiles((type, filename): void=>{
		switch (type) {
			case "start":{
				fileLoadingProgress.startItem(filename);
				break;
			}
			case "success":{
				fileLoadingProgress.itemDone(filename);
				break;
			}
			case "failed":{
				fileLoadingProgress.itemDone(filename);
				// allow failed (and missing) files. we will determine if we should error later.
				// fileLoadingProgress.stop();
				// throw new Error(filename);
			}
		}
	}).then(fileResult=>{
		term("content packs loaded: ");
		let hasStrangeCounts = false;
		const loadedPacks: string[] = [];
		for (const [dlc, maxCount] of dlcMaxCounts.entries()) {
			const loadedCount = fileResult.get(dlc) ?? 0;
			if (loadedCount === 0) {
				term.grey(`${dlc}(${loadedCount}/${maxCount}) `);
			} else if (loadedCount === maxCount) {
				term.green(`${dlc}(${loadedCount}/${maxCount}) `);
				loadedPacks.push(dlc);
			} else {
				hasStrangeCounts = true;
				term.red(`${dlc}(${loadedCount}/${maxCount}) `);
			}
		}
		term.eraseLineAfter();
		term("\n");
		if (hasStrangeCounts) {
			term.red("Some content packs didn't have all their content! Please verify game integrity!\n");
		}
		if (!loadedPacks.includes("BoH")) {
			throw Error("BoH content pack not found");
		}
		initalizeCommands();
	}).catch((_err: unknown): void=>{
		term.red("failed to load core files at "+config.installFolder+"\\bh_Data\\StreamingAssets\\bhcontent\\core\\\n");
		term.red("Check \"installFolder\" in the config.json file and/or verify the game's integrity.\n");
	});
	if (config.shouldAutoloadSave) {
		try {
			await commandProcessing.load(term, config.defaultFile.split(" "));
		} catch (_) {
			term(`failed to autoload the save "${config.defaultFile}".`);
		}
	}
	await inputLoop();
}

function initalizeCommands(): void {
	inputTree[1].push(
		[["load"], commandProcessing.load, "load user save files"],
		list,
		info,
		search,
		misc,
		tables,
	);
	if (config.isDebug) {inputTree[1].push(debugCommands);}
}

async function inputLoop(): Promise<void> {
	while (true) {
		await commandProcessing.checkWatcherFileLoad(term);
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
		const parts = input.split(" ").filter(part=>part!=="");
		const commandLookup = findCommand(parts);
		if (commandLookup===undefined) {
			term.yellow("command not found.\n");
			await fileLoader.addHistory(input);
			continue;
		}
		try {
			const changedArguments = await commandLookup[1](term, commandLookup[2]);
			const finalArgs = changedArguments!==""?changedArguments:commandLookup[2].join(" ");
			await fileLoader.addHistory((commandLookup[0].join(" ")+" "+finalArgs).trimEnd());
		} catch (error) {
			term.red("command threw an error.\n");
			if (config.isDebug) {
				term.red((error as Error).stack??""+"\n");
				term.red((error as Error).name+"\n");
				term.red((error as Error).message+"\n");
			}
			await fileLoader.addHistory(input);
		}
	}
}
function findCommand(parts: string[]): [string[], types.commandFunc, string[]]|undefined {
	let targetNode: types.inputNode = inputTree;
	const tree: string[] = [];
	for (let i=0;i<=parts.length;i++) {
		const [, data] = targetNode;
		if (!Array.isArray(data)) {return [tree, data, parts.splice(i)];}
		const part = parts[i];
		if (part===undefined) {return;}
		const nextNode = data.find(
			([names, _data]): boolean=>names.some(
				name=>name.toLowerCase()===part.toLowerCase(),
			),
		);
		if (nextNode===undefined) {return;}
		targetNode = nextNode;
		tree.push(nextNode[0][0]);
	}
	return;
}
function generateAutocomplete(input: string): string|string[] {
	const parts = input.split(" ").filter(part=>part!=="");
	let outputTarget: types.inputNode = inputTree;
	let index = 0;
	const output: string[] = [];
	const getAliasName = (aliases: [string, ...string[]], targ: string): string=>{
		return aliases.find(name=>name.startsWith(targ))??aliases[0];
	};
	while (true) {
		const command = outputTarget[1];
		if (!Array.isArray(command)) {
			// command found. keep the rest of user input
			return [...output, ...parts.slice(index)].join(" ");
		}
		const part = parts[index]??"";
		const subCommands = command.filter(inputNode=>inputNode[0].some(name=>name.startsWith(part)));
		if (subCommands.length > 1) {
			// multiple possible commands. for aliases, only show primary name. (subCommand[0][0])
			return subCommands.map(subCommand=>[...output, getAliasName(subCommand[0], part)].join(" "));
		}
		const subCommand = subCommands[0];
		if (subCommand === undefined) {
			// unknown command
			return [...output, ...parts.slice(index)].join(" ");
		}
		if (parts.length <= index+1 && part.length < subCommand.length) {
			// still typing command
			return [...output, getAliasName(subCommand[0], part)].join(" ");
		}
		// switch target to the only command left
		outputTarget = subCommand;
		output.push(getAliasName(subCommand[0], part));
		index++;
	}
}

void main().finally((): void=>{
	term.processExit(0);
});
