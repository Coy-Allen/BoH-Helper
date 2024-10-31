import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {getItemSearchOptions, getAspects} from "../commandHelpers.js";
import {findVerbs, findItems, findRecipes} from "../dataProcessing.js"
import {jsonSpacing} from "../config.js";

const search: types.inputNode = ["search",[
	["verbs",searchVerbs,"search found popups and their card inputs."],
	// locked rooms
	["items",searchItems,"search owned items and their aspects."],
	["itemCounts",searchItemCounts,"list owned item counts."],// counts of items in house
	["recipes",searchRecipes,"search discovered (non-???) recipes and their outputs."],
],"finds unlocked things in your save file. load your save file 1st."];

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
	const result = findVerbs(args);
	term(JSON.stringify("res: "+result.length,null,jsonSpacing)+"\n");
}
export async function searchItems(term: Terminal, parts: string[]):Promise<string|undefined> {
	const arg = (parts.length !== 0 ? 
		JSON.parse(parts.join(" ")) :
		await getItemSearchOptions(term)
	);
	const result = findItems(arg);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
	if(parts.length === 0){
		return JSON.stringify(arg);
	}
	return;
}
export async function searchItemCounts(term: Terminal, parts: string[]):Promise<string|undefined> {
	const arg = (parts.length !== 0 ? 
		JSON.parse(parts.join(" ")) :
		await getItemSearchOptions(term)
	);
	const counts = new Map<string,number>();
	findItems(arg).forEach(item=>{
		counts.set(item.entityid,(counts.get(item.entityid)??0)+1)
	});
	term([...counts.entries()]
		.sort(([_A,countA],[_B,countB]):number=>countA-countB)
		.map(([name,count]):string=>`${name}: ${count}\n`)
		.join("")
	);
	if(parts.length === 0){
		return JSON.stringify(arg);
	}
	return;
}
export async function searchRecipes(term: Terminal, parts: string[]):Promise<string|undefined> {
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
	const result = findRecipes(arg).map(recipe=>[recipe[0].reqs,recipe[1]]);
	term(JSON.stringify(result,null,jsonSpacing)+"\n");
	if(parts.length === 0){
		return JSON.stringify(arg);
	}
	return;
}

export default search;
