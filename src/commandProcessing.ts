import type {Terminal} from "terminal-kit";
import os from "os";
import {loadSave} from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
import type * as types from "./types.js";

const jsonSpacing = "  ";

export function exit(term: Terminal): void {
	term("exiting...");
	term.processExit(0);
}
export async function load(term: Terminal):Promise<void> {
	term("save file> ");
	const filename = await term.fileInput({
		baseDir: os.homedir()+"\\AppData\\LocalLow\\Weather Factory\\Book of Hours",
	}).catch(_=>{
		//TODO: catch directory does not exist.
	});
	term("\n");
	if(!filename){
		term.yellow("File not found.\n");
		return;
	}
	try{
		const save: types.saveData = JSON.parse(await loadSave(filename));
		dataProcessing.loadSave(save);
	} catch(err){
		term.yellow("File failed to load.\n");
		//TODO: catch invalid file.
	}
}
export function listAspects(term: Terminal):void {
	term([...dataProcessing.getAllAspects()].sort().join(", ")+"\n");
}
export function infoItems(term: Terminal, parts: string[]):void {
	// TODO: move "parts" into a custom input handler
	const args = parts.join(" ");
	const result = dataProcessing.lookupItem(args);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
export function searchVerbs(term: Terminal, parts: string[]): void {
	// TODO: move "parts" into a custom input handler
	const args = JSON.parse(parts.join(" "));
	const result = dataProcessing.findVerbs(args);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
export function searchItems(term: Terminal, parts: string[]):void {
	// TODO: move "parts" into a custom input handler
	const args = JSON.parse(parts.join(" "));
	const result = dataProcessing.findItems(args);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
export function searchRecipes(term: Terminal, parts: string[]):void {
	// TODO: move "parts" into a custom input handler
	const arg:{
		reqs?: {
			min?: types.aspects;
			max?: types.aspects;
		}
		output?: {
			min?: types.aspects;
			max?: types.aspects;
		}
	} = JSON.parse(parts.join(" "));
	const result = dataProcessing.findRecipes(arg).map(recipe=>[recipe[0].reqs,recipe[1]]);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
