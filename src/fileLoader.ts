import fs from "node:fs/promises";
import json5 from "json5";
import iconv from "iconv-lite";
import {fileMetaDataList, type dlcMaxCounts} from "./fileList.ts";
import {data} from "./dataProcessing.ts";
import type * as types from "./types.ts";
import {config} from "./config.ts";


const fileOutputs = {
	decks: [] as {decks: types.dataDeck[]}[],
	items: [] as {elements: types.dataElement[]}[],
	recipes: [] as {recipes: types.dataRecipe[]}[],
	verbs: [] as {verbs: types.dataVerb[]}[],
};
let history: string[]|undefined;

export async function loadFiles(dispatch: (type: "start"|"success"|"failed", file: string) => void): Promise<typeof dlcMaxCounts> {
	const successList: typeof dlcMaxCounts = new Map();
	for (const fileMetaData of fileMetaDataList) {
		dispatch("start", fileMetaData.name);
		const outputs = fileOutputs[fileMetaData.type];
		try {
			const fileContent = await fs.readFile(config.installFolder+"\\bh_Data\\StreamingAssets\\bhcontent\\core\\"+fileMetaData.name)
				.then(file=>iconv.decode(file, fileMetaData.encoding).toLowerCase())
				.then(contents=>fileMetaData.postProcessing?.(contents)??contents);
			outputs.push(json5.parse(fileContent));
			const count = successList.get(fileMetaData.dlc)??0;
			successList.set(fileMetaData.dlc, count+1);
			dispatch("success", fileMetaData.name);
		} catch (_) {
			dispatch("failed", fileMetaData.name);
		}
	}
	dispatch("start", "finalizing");
	// FIXME: dupe messages have the loading bar behind them. need to clear the line beforehand.
	pushData();
	dispatch("success", "finalizing");
	return successList;
}

export async function loadSave(saveFile: string): Promise<string> {
	return await fs.readFile(saveFile).then(file=>iconv.decode(file, "utf8").toLowerCase());
}

function pushData(): void {
	data.aspects.overwrite(fileOutputs.items.flatMap(item=>item.elements.filter(
		element=>element.isaspect??false,
	)).map(element=>element.id));
	// notice: the aspect search in the items and recipes are no longer added to aspects.
	data.elements.overwrite(fileOutputs.items.flatMap(files=>files.elements));
	data.recipes.overwrite(fileOutputs.recipes.flatMap(recipes=>recipes.recipes).filter(recipe=>recipe.craftable??true));
	data.verbs.overwrite(fileOutputs.verbs.flatMap(verbs=>verbs.verbs).filter(verb=>!verb.spontaneous));
	data.decks.overwrite(fileOutputs.decks.flatMap(decks=>decks.decks));
}

// history handler

export async function getHistory(): Promise<string[]> {
	if (history) {return history;}
	try {
		history = (await fs.readFile(import.meta.dirname+"/../history.txt", "utf8")).split("\n");
	} catch (_) {
		history = [];
	}
	return history;
}
export async function addHistory(line: string): Promise<void> {
	if (!history) {
		await getHistory();
	}
	if (!history) {
		console.error("failed to initalize history.");
		return;
	}
	history.push(line);
}
export async function saveHistory(): Promise<void> {
	if (!history) {
		// no history to save
		return;
	}
	try {
		const trunkHistory = history.slice(Math.max(history.length-config.maxHistory, 0));
		await fs.writeFile(import.meta.dirname+"/../history.txt", trunkHistory.join("\n"));
	} catch (_) {
		// failed to save
	}
}
