import type {Terminal} from "terminal-kit";
import os from "os";
import {loadSave,saveHistory} from "./fileLoader.js";
import * as dataProcessing from "./dataProcessing.js";
import type * as types from "./types.js";

const jsonSpacing = "  ";

export async function exit(term: Terminal): Promise<void> {
	term("exiting...");
	await saveHistory();
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
	term(dataProcessing.getAllAspects().sort().join(", ")+"\n");
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
export async function searchItems(term: Terminal, parts: string[]):Promise<void> {
	const arg = (parts.length !== 0 ? 
		JSON.parse(parts.join(" ")) :
		{
			min: await getAspects(term, "Min"),
			any: await getAspects(term, "Any"),
			max: await getAspects(term, "Max"),
			// TODO: nameValid?: string,
			// TODO: nameInvalid?: string,
		}
	);
	const result = dataProcessing.findItems(arg);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
export async function searchItemCounts(term: Terminal, parts: string[]):Promise<void> {
	const arg = (parts.length !== 0 ? 
		JSON.parse(parts.join(" ")) :
		{
			min: await getAspects(term, "Min"),
			any: await getAspects(term, "Any"),
			max: await getAspects(term, "Max"),
			// TODO: nameValid?: string,
			// TODO: nameInvalid?: string,
		}
	);
	const counts = new Map<string,number>();
	dataProcessing.findItems(arg).forEach(item=>{
		counts.set(item.entityid,(counts.get(item.entityid)??0)+1)
	});
	term([...counts.entries()]
		.sort(([_A,countA],[_B,countB]):number=>countA-countB)
		.map(([name,count]):string=>`${name}: ${count}\n`)
		.join("")
	);
}
export async function searchRecipes(term: Terminal, parts: string[]):Promise<void> {
	const arg = (parts.length !== 0 ? 
		JSON.parse(parts.join(" ")) :
		{
			reqs: {
				min: await getAspects(term, "Min input"),
				max: await getAspects(term, "Max input"),
			},
			output: {
				min: await getAspects(term, "Min output"),
				max: await getAspects(term, "Max output"),
			}
		}
	);
	const result = dataProcessing.findRecipes(arg).map(recipe=>[recipe[0].reqs,recipe[1]]);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
}
export function help(term: Terminal, _parts: string[], inputNode:types.inputNode):void{
	const getHelp = (node:types.inputNode, depth:number):void=>{
		const [name,data,helpText] = node;
		if(depth>=0){
			term(jsonSpacing.repeat(depth));
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
export async function missingCraftable(term: Terminal, parts: string[]): Promise<void> {
	const arg:{
		detailed?:boolean,
		maxOwned?:number,
	} = JSON.parse(parts.join(" "));
	const found = dataProcessing.missingCraftable(arg);
	for(const [name,items] of found){
		const detail = arg.detailed?items.join(", "):items.length.toString();
		term.cyan(`${name}`)
		term(`: ${detail}\n`)
	}
}
export async function availiableMemories(term: Terminal, parts: string[]): Promise<void> {
	const maxTargLen = 15;
	const genListOutput = (memories:[string,string[]][]):void=>{
		for(const [memId,targs] of memories){
			term(jsonSpacing);
			term.cyan(memId);
			if(targs.length <= maxTargLen){
				term(": "+targs.join(", ")+"\n");
			} else {
				targs.length = maxTargLen;
				term(": "+targs.join(", ")+", ");
				term.gray("...\n");
			}
		}
	}
	const arg:{
		inputs:("recipes"|"itemsReusable"|"itemsConsumable"|"books")[];
		memFilter?:{
			any?:types.aspects;
			ignoreObtained?:boolean;
		};
	} = JSON.parse(parts.join(" "));
	const result = dataProcessing.availiableMemories(arg);
	if(result.recipes){
		term.cyan("Recipes");
		term(":\n");
		genListOutput(result.recipes);
	}
	if(result.itemsConsumableInspect){
		term.cyan("Consumables (Inspect)");
		term(":\n");
		genListOutput(result.itemsConsumableInspect);
	}
	if(result.itemsConsumableTalk){
		term.cyan("Consumables (Talk)");
		term(":\n");
		genListOutput(result.itemsConsumableTalk);
	}
	if(result.itemsReusableInspect){
		term.cyan("Reusables (Inspect)");
		term(":\n");
		genListOutput(result.itemsReusableInspect);
	}
	if(result.itemsReusableTalk){
		term.cyan("Reusables (Talk)");
		term(":\n");
		genListOutput(result.itemsReusableTalk);
	}

}

// helpers //
// these are for commands to request the specific thing from the user. user input shorthand

async function getAspects(term: Terminal, name: string): Promise<types.aspects> {
	const aspectNames = dataProcessing.getAllAspects();
	const result:types.aspects = {};
	let aspect:string = "";
	let count:string = "";
	term("\n");
	while (true){
		// print current result
		term.previousLine(0);
		term.eraseLine();
		term(`${name} = ${Object.entries(result).map(entry=>`${entry[0]}:${entry[1]}`).join(", ")}\n`);
		// input
		term.eraseLine();
		term("aspect> ");
		aspect = (await term.inputField({
			autoComplete: aspectNames,
			autoCompleteMenu: true,
			autoCompleteHint: true,
			cancelable: true,
		}).promise) ?? "";
		if(aspect===""){break;}
		while (true){
			term.eraseLine();
			term.column(0);
			term("count> ");
			count = (await term.inputField({
				cancelable: true,
			}).promise) ?? "";
			if(count === ""){break;}
			const countNumber = Number(count);
			if(!Number.isSafeInteger(countNumber)){continue;}
			// add to result
			result[aspect]=countNumber;
			if(result[aspect] <= 0){delete result[aspect];}
			break;
		}
	}
	// clear the user input line
	term.eraseLine();
	term.column(0);
	return result;
}
//@ts-expect-error unused
async function getStrArray(term: Terminal, name: string, autocomplete?: string[]): Promise<string[]> {
	const result = new Set<string>();
	let input:string = "";
	term("\n");
	while (true){
		// print current result
		term.previousLine(0);
		term.eraseLine();
		term(`${name} = ${[...result.values()].join(", ")}\n`);
		// input
		term.eraseLine();
		term("input> ");
		input = (await term.inputField({
			autoComplete: autocomplete ?? [],
			autoCompleteMenu: true,
			autoCompleteHint: true,
			cancelable: true,
		}).promise) ?? "";
		if(input===""){break;}
		if(result.has(input)){
			result.delete(input);
		} else {
			result.add(input);
		}
	}
	// clear the user input line
	term.eraseLine();
	term.column(0);
	return [...result.values()];

}