import type {Terminal} from "terminal-kit";
import type * as types from "./types.js";

import {getAllAspects} from "./dataProcessing.js";

export async function getItemSearchOptions(term: Terminal, name?:string): Promise<types.itemSearchOptions> {
	return {
		min: await getAspects(term, "Min"+(name?" "+name:"")),
		any: await getAspects(term, "Any"+(name?" "+name:"")),
		max: await getAspects(term, "Max"+(name?" "+name:"")),
		// TODO: nameValid?: string,
		// TODO: nameInvalid?: string,
	}
}
export async function getAspects(term: Terminal, name: string): Promise<types.aspects> {
	const aspectNames = getAllAspects();
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
export async function getStrArray(term: Terminal, name: string, options?: {
	autocomplete?: string[];
	min?: number;
	max?: number;
	strict?: boolean;
}): Promise<string[]> {
	const result = new Set<string>();
	const optionsFull = {
		autocomplete: options?.autocomplete ?? [],
		min: options?.min ?? 1,
		max: options?.max,
		strict: options?.strict ?? true,
	}
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
			autoComplete: optionsFull.autocomplete,
			autoCompleteMenu: true,
			autoCompleteHint: true,
			cancelable: true,
		}).promise) ?? "";
		if(
			optionsFull.strict &&
			optionsFull.autocomplete.length !== 0 &&
			!optionsFull.autocomplete.includes(input)
		){continue;}
		if(input==="" && optionsFull.min<=result.size){break;}
		if(result.has(input)){
			result.delete(input);
			continue;
		}
		if(optionsFull.max===undefined||result.size<optionsFull.max){
			result.add(input);
		}
	}
	// clear the user input line
	term.eraseLine();
	term.column(0);
	return [...result.values()];
}
