import type {Terminal} from "terminal-kit";
import type * as types from "./types.js";

import {loadSave,saveHistory} from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
import {jsonSpacing,saveLocation} from "./config.js";


export async function exit(term: Terminal): Promise<void> {
	term("exiting...");
	await saveHistory();
	term.processExit(0);
}
export async function load(term: Terminal):Promise<void> {
	term("save file> ");
	const filename = await term.fileInput({
		baseDir: saveLocation,
		default: "AUTOSAVE.json",
	}).catch(_=>{
		term.yellow("Save directory not found. Check \"saveLocation\" in the config.js file.\n");
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
export function infoItems(term: Terminal, parts: string[]):void {
	// TODO: move "parts" into a custom input handler
	const args = parts.join(" ");
	const result = dataProcessing.lookupItem(args);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
export function help(term: Terminal, _parts: string[], inputNode:types.inputNode):void{
	const getHelp = (node:types.inputNode, depth:number):void=>{
		const [name,data,helpText] = node;
		if(depth>=0){
			term(jsonSpacing.repeat(depth));
			term.cyan(name.join("/"));
			term(": "+helpText+"\n");
		}
		if(Array.isArray(data)){
			for(const subNode of data){
				getHelp(subNode,depth+1);
			}
		}
	}
	getHelp(inputNode,-1);
}
