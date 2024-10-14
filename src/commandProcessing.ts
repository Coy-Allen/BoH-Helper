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
		default: "AUTOSAVE.json",
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
	const args:{
		slotMeta?:{
			minCount?: number;
			maxCount?: number;
		};
		slots?:{
			required?:string[];
			essential?:string[];
			forbidden?:string[];
			missingRequired?:string[];
			missingEssential?:string[];
			missingForbidden?:string[];
		}[];
	} = JSON.parse(parts.join(" "));
	const result = dataProcessing.findVerbs(args);
	term(JSON.stringify("res: "+result.length,null,jsonSpacing)+"\n");
}
export function searchItems(term: Terminal, parts: string[]):void {
	// TODO: move "parts" into a custom input handler
	const args:{
		min?: types.aspects;
		any?: types.aspects;
		max?: types.aspects;
	} = JSON.parse(parts.join(" "));
	const result = dataProcessing.findItems(args);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
export function searchItemCounts(term: Terminal, parts: string[]):void {
	// TODO: move "parts" into a custom input handler
	const args:{
		min?: types.aspects;
		any?: types.aspects;
		max?: types.aspects;
	} = JSON.parse(parts.join(" "));
	const counts = new Map<string,number>();
	dataProcessing.findItems(args).forEach(item=>{
		counts.set(item.entityid,(counts.get(item.entityid)??0)+1)
	});
	term([...counts.entries()]
		.sort(([_A,countA],[_B,countB])=>countA-countB)
		.map(([name,count])=>`${name}: ${count}\n`)
		.join("")
	);
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
export function help(term: Terminal, _parts: string[], inputNode:types.inputNode):void{
	const getHelp = (node:types.inputNode, depth:number):void=>{
		const [name,data,helpText] = node;
		if(depth>=0){
			term("  ".repeat(depth));
			term.cyan(name);
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

// helpers

//@ts-expect-error unused
async function getAspects(term: Terminal): Promise<types.aspects> {
	// TODO: stub
	return {};
}
//@ts-expect-error unused
async function getStrArray(term: Terminal, autocomplete?: string[]): Promise<string[]> {
	// TODO: stub
	return [];
}