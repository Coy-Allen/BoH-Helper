import fs from "fs/promises";
import json5 from "json5";
import iconv from "iconv-lite";
import fileMetaDataList from "./fileList.js"
import * as dataProcessing from "./dataProcessing.js";
import type * as types from "./types.js";
import {dataFolder} from "./config.js";



const fileOutputs = new Map<string,any[]>();
let history:string[]|undefined;

export async function loadFiles(dispatch:(type:"start"|"success"|"failed",file:string)=>void): Promise<void> {
	// TODO: find BoH data folder even if installed elsewhere
	for (let i=0;i<fileMetaDataList.length;i++) {
		const fileMetaData = fileMetaDataList[i];
		dispatch("start",fileMetaData.name);
		const outputs = fileOutputs.get(fileMetaData.type) ?? [];
		if(!fileOutputs.has(fileMetaData.type)){fileOutputs.set(fileMetaData.type,outputs);}
		try {
			const fileContent = await fs.readFile(dataFolder+"\\"+fileMetaData.name)
				.then(file=>iconv.decode(file,fileMetaData.encoding).toLowerCase())
				.then(contents=>fileMetaData.postProcessing?.(contents)??contents);
			outputs.push(json5.parse(fileContent));
			dispatch("success",fileMetaData.name);
		} catch(err: any) {
			dispatch("failed",fileMetaData.name);
		}
	}
	dispatch("start","finalizing");
	// FIXME: dupe messages have the loading bar behind them. need to clear the line beforehand.
	pushData();
	dispatch("success","finalizing");
}

export async function loadSave(saveFile:string): Promise<string> {
	return await fs.readFile(saveFile).then(file=>iconv.decode(file,"utf8").toLowerCase());
}

function pushData(): void{
	dataProcessing.setDataItems((fileOutputs.get("items")??[]).flatMap(files=>files.elements.map((element:any):types.dataItem=>({
		id: element.id,
		uniquenessgroup: element.uniquenessgroup ?? "",
		label: element.label ?? "",
		desc: element.desc ?? "",
		inherits: element.inherits ?? "",
		audio: element.audio ?? "",
		aspects: element.aspects ?? "",
		xtriggers: element.xtriggers ?? {},
		xexts: element.xexts ?? "",
	}))));
	dataProcessing.setDataRecipes((fileOutputs.get("recipes")??[]).flatMap(recipes=>recipes.recipes));
	dataProcessing.setDataVerbs((fileOutputs.get("verbs")??[]).flatMap(verbs=>verbs.verbs));
	dataProcessing.setDataDecks((fileOutputs.get("decks")??[]).flatMap(decks=>decks.decks));
}

// history handler

export async function getHistory(): Promise<string[]> {
	if(history){return history;}
	try {
		history = (await fs.readFile(import.meta.dirname+"/../history.txt","utf8")).split("\n");
	} catch(err) {
		history = [];
	}
	return history;
}
export async function addHistory(line:string): Promise<void> {
	if(!history){
		await getHistory();
	}
	if(!history){
		console.error("failed to initalize history.");
		return;
	}
	history.push(line);
}
export async function saveHistory(): Promise<void> {
	if(!history){
		// no history to save
		return;
	}
	try {
		// max history is 50 lines
		const trunkHistory = history.slice(history.length-50);
		fs.writeFile(import.meta.dirname+"/../history.txt",trunkHistory.join("\n"));
	} catch(err) {

	}
}
