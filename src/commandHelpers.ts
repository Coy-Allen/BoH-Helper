import type {Terminal} from "terminal-kit";
import type * as types from "./types.js";

import {getAllAspects} from "./dataProcessing.js";
import {markupReplaceList} from "./config.js";

export function markupReplace<t extends string[]|string>(text: t): t {
	const isArray = Array.isArray(text);
	const input:string[] = isArray?text:[text];
	const res:string[] = [];
	for(const str of input){
		const replaced = markupReplaceList.reduce((prev:string,[regex,color]:[RegExp,string]):string=>{
			return prev.replaceAll(regex,`^[${color}]$&^:`);
		},str);
		res.push(replaced);
	}
	if (isArray) {
		return res as t;
	}
	return res[0] as t;
}
export async function getItemSearchOptions(term: Terminal, name?:string): Promise<types.itemSearchOptions> {
	return {
		min: await getAspects(term, "Min"+(name?" "+name:"")),
		any: await getAspects(term, "Any"+(name?" "+name:"")),
		max: await getAspects(term, "Max"+(name?" "+name:"")),
		nameValid: (await getStrArray(term, "Name Matches"+(name?" "+name:""),{min:0,max:1}))[0],
		nameInvalid: (await getStrArray(term, "Name NOT Matches"+(name?" "+name:""),{min:0,max:1}))[0],
	}
}
export async function getAspects(term: Terminal, name: string): Promise<types.aspects> {
	// TODO: add strict to options
	const aspectNames = getAllAspects();
	const result:types.aspects = {};
	let aspect:string = "";
	let count:string = "";
	term("\n");
	const autocompleteList = (input:string):string|string[]=>{
		return generateAutocomplete(
			generateCommandNames(aspectNames,"\\."),
			input
		)
	}
	while (true){
		// print current result
		term.previousLine(0);
		term.eraseLine();
		term(`${name} = ${Object.entries(result).map(entry=>`${entry[0]}:${entry[1]}`).join(", ")}\n`);
		// input
		term.eraseLine();
		term("aspect> ");
		aspect = (await term.inputField({
			autoComplete: autocompleteList,
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
	autocompleteDelimiter?: string;
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
	const autocompleteDelimiter = options?.autocompleteDelimiter;
	const autocompleteList:string|string[]|((input:string)=>(string|string[])) = autocompleteDelimiter===undefined ?
		optionsFull.autocomplete :
		input=>{return generateAutocomplete(generateCommandNames(optionsFull.autocomplete,autocompleteDelimiter),input)}
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
			autoComplete: autocompleteList,
			autoCompleteMenu: true,
			autoCompleteHint: true,
			cancelable: true,
		}).promise) ?? "";
		if(input==="" && optionsFull.min<=result.size){break;}
		if(
			optionsFull.strict &&
			optionsFull.autocomplete.length !== 0 &&
			!optionsFull.autocomplete.includes(input)
		){continue;}
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
type commandNames = [string,commandNames[]];

function generateCommandNames(options:string[],delimiter:string):commandNames[]{
	const result:commandNames[]=[];
	const regexSplit = new RegExp(`(?=${delimiter})`);
	for(const option of options){
		const parts = [...option.split(regexSplit),""];
		let prevSections = result;
		for(const part of parts){
			if(!prevSections.map(section=>section[0]).includes(part)){
				prevSections.push([part,[]]);
			}
			prevSections = prevSections.find(section=>section[0]===part)?.[1]??[]
		}
	}
	return result;
}

function generateAutocomplete(options:commandNames[],inputRaw:string): string|string[]{
	const input = inputRaw.toLowerCase();
	let inputIndex = 0;
	let outputTargets:commandNames = ["",options];
	const output:string[] = []
	while(true) {
		const commands = outputTargets[1].filter(outputTarget=>{
			return outputTarget[0].startsWith(input.slice(inputIndex)) ||
				input.startsWith(outputTarget[0],inputIndex)
		});
		if(commands.length > 1) {
			// multiple possible commands
			return commands.map(command=>[...output,command[0]].join(""));
		}
		if(commands.length === 0) {
			// unknown command
			return output.join("");
		}
		const command = commands[0];
		output.push(command[0]);
		inputIndex+= command[0].length;
		outputTargets = command;
	}
}
