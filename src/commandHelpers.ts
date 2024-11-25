import type {Terminal} from "terminal-kit";
import type * as types from "./types.js";

import {getAllAspects, doesAspectExist} from "./dataProcessing.js";
import {markupReplaceList} from "./config.js";

export function markupReplace<t extends string[]|string>(text: t): t {
	const isArray = Array.isArray(text);
	const input: string[] = isArray?text:[text];
	const res: string[] = [];
	for (const str of input) {
		const replaced = markupReplaceList.reduce((prev: string, [regex, color]: [RegExp, string]): string=>{
			return prev.replaceAll(regex, `^[${color}]$&^:`);
		}, str);
		res.push(replaced);
	}
	if (isArray) {
		return res as t;
	}
	return res[0] as t;
}
export async function getItemSearchOptions(term: Terminal, name?: string): Promise<types.itemSearchOptions> {
	return {
		min: await getAspects(term, "Min"+(name?" "+name:"")),
		any: await getAspects(term, "Any"+(name?" "+name:"")),
		max: await getAspects(term, "Max"+(name?" "+name:"")),
		nameValid: (await getStrArray(term, "Name Matches"+(name?" "+name:""), {min: 0, max: 1}))[0],
		nameInvalid: (await getStrArray(term, "Name NOT Matches"+(name?" "+name:""), {min: 0, max: 1}))[0],
	};
}
/**/
export async function getAspects(term: Terminal, name: string): Promise<types.aspects> {
	// TODO: add strict to options
	const aspectNames = getAllAspects();
	const result: types.aspects = {};
	let aspect = "";
	let count = "";
	term("\n");
	const autocompleteList = (input: string): string|string[]=>{
		return generateAutocomplete(
			generateCommandNames(aspectNames, "\\."),
			input,
		);
	};
	while (true) {
		// print current result
		term.previousLine(0);
		term.eraseLine();
		term(`${name} = ${Object.entries(result).map(entry=>`${entry[0]}:${entry[1]}`).join(", ")}\n`);
		// input
		term.eraseLine();
		term("aspect> ");
		aspect = await term.inputField({
			autoComplete: autocompleteList,
			autoCompleteMenu: true,
			autoCompleteHint: true,
			cancelable: true,
		}).promise ?? "";
		if (aspect==="") {break;}
		while (true) {
			term.eraseLine();
			term.column(0);
			term("count> ");
			count = await term.inputField({
				cancelable: true,
			}).promise ?? "";
			if (count === "") {break;}
			const countNumber = Number(count);
			if (!Number.isSafeInteger(countNumber)) {continue;}
			// add to result
			result[aspect]=countNumber;
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			if (result[aspect] <= 0) {delete result[aspect];}
			break;
		}
	}
	// clear the user input line
	term.eraseLine();
	term.column(0);
	return result;
}
export async function getNum(term: Terminal, name: string, options?: {
	min?: number;
	default?: number;
	max?: number;
}): Promise<number> {
	const optionsFull = {
		min: options?.min ?? Number.MIN_SAFE_INTEGER,
		default: options?.default,
		max: options?.max ?? Number.MAX_SAFE_INTEGER,
	};
	let result: number|undefined = undefined;
	term("");
	while (true) {
		term(name+"> ");
		const input = await term.inputField({
			cancelable: true,
		}).promise ?? "";
		term.eraseLine();
		term.column(0);
		if (input === "") {
			if (optionsFull.default !== undefined) {
				result = optionsFull.default;
				break;
			}
			continue;
		}
		const num = Number(input);
		if (isNaN(num)) {continue;}
		if (!Number.isSafeInteger(num)) {continue;}
		if (optionsFull.min > num || optionsFull.max < num) {continue;}
		result = num;
		break;
	}
	term(`${name} = ${result}\n`);
	return result;
}
/**/

export async function getArray<t>(term: Terminal, name: string, generator:((edit?: t) => Promise<t>|t), options?: {
	sameline?: boolean;
	min?: number;
	max?: number;
}): Promise<t[]> {
	// FIXME: does not work
	/*
	return [await generator()];
	*/
	const result: t[] = [];
	const optionsFull = {
		sameLine: options?.sameline ?? false,
		min: options?.min ?? 0,
		max: options?.max ?? Number.MAX_SAFE_INTEGER,
	};
	while (true) {
		term(`${name}(${result.length})> `);
		const userInput = await term.inputField({
			autoComplete: ["add", "delete", "edit", "submit"],
			autoCompleteMenu: true,
			autoCompleteHint: true,
			cancelable: true,
		}).promise;
		term.eraseLine();
		term.column(0);
		if (userInput === "add") {
			if (optionsFull.max <= result.length) {
				// TODO: can't add new entry.
				continue;
			}
			result.push(await generator());
		}
		if (userInput === "delete") {
			if (result.length === 0) {
				// TODO: can't remove entry.
			}
			// TODO: remove entry.
		}
		if (userInput === "edit") {
			if (result.length === 0) {
				// TODO: can't edit entry.
			}
			// TODO: edit entry.
		}
		if (userInput === "submit") {
			if (result.length < optionsFull.min || result.length > optionsFull.max) {
				// TODO: can't return.
				continue;
			}
			break;
		}
	}
	return result;
}
/**/
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
	};
	const autocompleteDelimiter = options?.autocompleteDelimiter;
	const autocompleteList: string|string[]|((input: string)=>(string|string[])) = autocompleteDelimiter===undefined ?
		optionsFull.autocomplete :
		input=>{return generateAutocomplete(generateCommandNames(optionsFull.autocomplete, autocompleteDelimiter), input);};
	let input = "";
	term("\n");
	while (true) {
		// print current result
		term.previousLine(0);
		term.eraseLine();
		term(`${name} = ${[...result.values()].join(", ")}\n`);
		// input
		term(`${name}> `);
		input = await term.inputField({
			autoComplete: autocompleteList,
			autoCompleteMenu: true,
			autoCompleteHint: true,
			cancelable: true,
		}).promise ?? "";
		if (input==="" && optionsFull.min<=result.size) {break;}
		if (
			optionsFull.strict &&
			optionsFull.autocomplete.length !== 0 &&
			!optionsFull.autocomplete.includes(input)
		) {continue;}
		if (result.has(input)) {
			result.delete(input);
			continue;
		}
		if (optionsFull.max===undefined||result.size<optionsFull.max) {
			result.add(input);
		}
	}
	// clear the user input line
	term.eraseLine();
	term.column(0);
	return [...result.values()];
}
/**/
type commandNames = [string, commandNames[]];

function generateCommandNames(options: string[], delimiter: string): commandNames[] {
	const result: commandNames[]=[];
	const regexSplit = new RegExp(`(?=${delimiter})`);
	for (const option of options) {
		const parts = [...option.split(regexSplit), ""];
		let prevSections = result;
		for (const part of parts) {
			if (!prevSections.map(section=>section[0]).includes(part)) {
				prevSections.push([part, []]);
			}
			prevSections = prevSections.find(section=>section[0]===part)?.[1]??[];
		}
	}
	return result;
}

function generateAutocomplete(options: commandNames[], inputRaw: string): string|string[] {
	const input = inputRaw.toLowerCase();
	let inputIndex = 0;
	let outputTargets: commandNames = ["", options];
	const output: string[] = [];
	while (true) {
		const commands = outputTargets[1].filter(outputTarget=>{
			return outputTarget[0].startsWith(input.slice(inputIndex)) ||
				input.startsWith(outputTarget[0], inputIndex);
		});
		if (commands.length > 1) {
			// multiple possible commands
			return commands.map(command=>[...output, command[0]].join(""));
		}
		if (commands.length === 0) {
			// unknown command
			return output.join("");
		}
		const command = commands[0];
		output.push(command[0]);
		inputIndex+= command[0].length;
		outputTargets = command;
	}
}

// REWORK

type targetTypes = targetArray|targetObject|targetString|targetStringArray|targetAspects|targetInteger;

export type processedType<t extends targetTypes> =  (t["required"] extends false ? undefined : never)|(
	t extends targetArray ? processedType<t["subType"]>[] : // TODO: figure out how subtypes work
	t extends targetObject ? (
		{[key in t["subType"][number] as key[1] extends true ? key[0] : never]: processedType<key[2]>} &
		{[key in t["subType"][number] as key[1] extends false ? key[0] : never]?: processedType<key[2]>}
	) :
	t extends targetString ? string :
	t extends targetStringArray ? string[] :
	t extends targetAspects ? Record<string, number> :
	t extends targetInteger ? number :
	unknown
);


interface targetBase {
	id: string;
	name: string;
	required?: false; // undefined = true
};
export interface targetArray<t extends targetTypes=targetTypes> extends targetBase {
	id: "array";
	subType: t;
	options: {
		minLength?: number;
		maxLength?: number;
	};
};
export interface targetObject extends targetBase {
	id: "object";
	subType: [string, boolean, targetTypes][];
	options: object;
};
export interface targetString extends targetBase {
	id: "string";
	options: {
		autocomplete: string[];
		autocompleteDelimiter?: string;
		strict: boolean;
	};
};
export interface targetStringArray extends targetBase {
	id: "stringArray";
	options: {
		autocomplete: string[];
		autocompleteDelimiter?: string;
		strict: boolean;
		minLength?: number;
		maxLength?: number;
	};
};
export interface targetAspects extends targetBase {
	id: "aspects";
	options: {
		minTypes?: number;
		maxTypes?: number;
	};
};
export interface targetInteger extends targetBase {
	id: "integer";
	options: {
		default?: number;
		min?: number;
		max?: number;
	};
};

export function validateInput(input: unknown, target: targetTypes): string {
	if (input === undefined) {
		return target.required??true ? "" : "is undefined";
	}
	switch (target.id) {
		case "string":{
			if (typeof input !== "string") {return "is not a string";}
			if ( target.options.strict && !target.options.autocomplete.includes(input)) {
				return "is not included in autocomplete list";
			}
			return "";
		}
		case "object":{
			if (typeof input !== "object" || Array.isArray(input) || input === null) {
				return "is not an object";
			}
			for (const [name, isRequired, subType] of target.subType) {
				const subInput = (input as Record<string, unknown>)[name];
				if (subInput===undefined) {
					if (isRequired) {return "is undefined for required key "+name;}
					continue;
				}
				const res = validateInput(subInput, subType);
				if (res!=="") {
					return `[${name}] ${res}`;
				}
			}
			return "";
		}
		case "array":{
			if (!Array.isArray(input)) {return "is not an array";}
			if (target.options.minLength !== undefined && input.length < target.options.minLength) {
				return "is below the minimum length";
			}
			if (target.options.maxLength !== undefined && input.length > target.options.maxLength) {
				return "is above the maximum length";
			}
			for (let i=0;i<input.length;i++) {
				const res = validateInput(input[i], target.subType);
				if (res!=="") {
					return `[${i}] ${res}`;
				}
			};
			return "";
		}
		case "stringArray":{
			if (!Array.isArray(input)) {return "is not an array";}
			if (target.options.minLength !== undefined && input.length < target.options.minLength) {
				return "is below the minimum length";
			}
			if (target.options.maxLength !== undefined && input.length > target.options.maxLength) {
				return "is above the maximum length";
			}
			for (let i=0;i<input.length;i++) {
				const entry: unknown = input[i];
				if (typeof entry !== "string") {return `is not a string at index ${i}`;}
				if (target.options.strict && !target.options.autocomplete.includes(entry)) {
					return `is not included in autocomplete list at index ${i}`;
				}
			}
			return "";
		}
		case "aspects":{
			if (typeof input !== "object" || Array.isArray(input) || input === null) {
				return "is not an object";
			}
			for (const [name, count] of Object.entries(input) as [string, unknown][]) {
				if (!doesAspectExist(name)) {
					return `${name} is not a valid aspect`;
				}
				if (!Number.isSafeInteger(count)) {return "is not a safe integer";}
				const integer = count as number;
				if (integer < 0) {
					return `${name}'s count is below 0`;
				}
			}
			return "";
		}
		case "integer":{
			if (!Number.isSafeInteger(input)) {return "is not a safe integer";}
			const integer = input as number;
			if (target.options.min !== undefined && integer < target.options.min) {
				return "is below the minimum value allowed";
			}
			if (target.options.max !== undefined && integer > target.options.max) {
				return "is above the max value allowed";
			}
			return "";
		}
		default:{
			throw TypeError("unknown type given");
		}
	}
}

export async function getInput<t extends targetTypes>(term: Terminal, target: t): Promise<processedType<t>> {
	term(target.name+": \n");
	let result: processedType<t>;
	if (!(target.required??true)) {
		term("skip? [y|N]\n");
		if (await term.yesOrNo({yes: ["y"], no: ["n", "ENTER"]}).promise) {
			term.previousLine(0);
			term.eraseLine();
			term.previousLine(0);
			term.eraseLine();
			term(target.name+": undefined\n");
			return undefined as processedType<t>;
		}
		term.previousLine(0);
		term.eraseLine();
	}
	term.previousLine(0);
	term.eraseLine();
	switch (target.id) {
		case "string":{
			const autocompleteDelimiter = target.options.autocompleteDelimiter;
			const autocompleteList: string|string[]|((input: string)=>(string|string[])) = autocompleteDelimiter===undefined ?
				target.options.autocomplete :
				input=>{return generateAutocomplete(generateCommandNames(target.options.autocomplete, autocompleteDelimiter), input);};
			while (true) {
				term.eraseLine();
				term.column(0);
				term(`${target.name}> `);
				const input = await term.inputField({
					autoComplete: autocompleteList,
					autoCompleteMenu: true,
					autoCompleteHint: true,
					cancelable: true,
				}).promise ?? "";
				if (!target.options.strict || target.options.autocomplete.includes(input)) {
					result = input as processedType<t>;
					break;
				}
			}
			break;
		}
		case "object":{
			const tempResult: Record<string, processedType<targetTypes>> = {};
			term(`${target.name}: ${JSON.stringify(tempResult)}\n`);
			for (const [name, isRequired, subType] of target.subType) {
				if (!isRequired) {
					// TODO: stub. ask if needed
				}
				const subTypeResult = await getInput(term, subType);
				tempResult[name] = subTypeResult;
			}
			for (let i=0; i<= target.subType.length; i++) {
				term.previousLine(0);
				term.eraseLine();
			}
			result = tempResult as processedType<t>;
			break;
		}
		case "array":{
			const tempResult: processedType<targetTypes>[] = [];
			while (true) {
				term(`${target.name}: ${JSON.stringify(tempResult)}\n`);
				const options = ["add"];
				if (options.length>0) {options.push("remove");}
				if (
					(!target.options.minLength || tempResult.length>=target.options.minLength) &&
					(!target.options.maxLength || tempResult.length<=target.options.maxLength)
				) {options.push("done", "");}
				term(`${target.name}> `);
				const input = await term.inputField({
					autoComplete: options,
					autoCompleteMenu: true,
					autoCompleteHint: true,
					cancelable: true,
				}).promise ?? "";
				if (!options.includes(input)) {
					term.previousLine(0);
					term.eraseLine();
					continue;
				}
				if (input === "" || input === "done") {break;}
				if (input === "add") {
					tempResult.push(await getInput(term, target.subType));
				}
				if (input === "remove") {
					const index = await getInput(term, {
						id: "integer",
						name: "index",
						options: {
							min: 0,
							max: tempResult.length-1,
							default: tempResult.length-1,
						},
					});
					tempResult.splice(index, 1);
				}
				term.previousLine(0);
				term.eraseLine();
				term.previousLine(0);
				term.eraseLine();
			}
			result = tempResult as processedType<t>;
			break;
		}
		case "stringArray":{
			const selected = new Set<string>();
			// setup autocomplete
			const autocompleteDelimiter = target.options.autocompleteDelimiter;
			const autocompleteList: string|string[]|((input: string)=>(string|string[])) = autocompleteDelimiter===undefined ?
				target.options.autocomplete :
				input=>{return generateAutocomplete(generateCommandNames(target.options.autocomplete, autocompleteDelimiter), input);};
			while (true) {
				// print current result
				term(`${target.name}: ${JSON.stringify([...selected.values()])}\n`);
				// input
				term.eraseLine();
				term(`${target.name}> `);
				const input = await term.inputField({
					autoComplete: autocompleteList,
					autoCompleteMenu: true,
					autoCompleteHint: true,
					cancelable: true,
				}).promise ?? "";
				if (input==="" && (target.options.minLength === undefined || target.options.minLength<=selected.size)) {break;}
				term.previousLine(0);
				term.eraseLine();
				if (
					target.options.strict &&
					target.options.autocomplete.length !== 0 &&
					!target.options.autocomplete.includes(input)
				) {continue;}
				if (selected.has(input)) {
					selected.delete(input);
					continue;
				}
				if (target.options.maxLength===undefined||selected.size<target.options.maxLength) {
					selected.add(input);
				}
			}
			term.eraseLine();
			term.previousLine(0);
			term.eraseLine();
			result = [...selected.values()] as processedType<t>;
			break;
		}
		case "aspects":{
			// FIXME: minTypes and maxTypes are not inforced
			const aspectNames = getAllAspects();
			const tempResult: types.aspects = {};
			let aspect = "";
			let count = "";
			term("\n");
			const autocompleteList = (input: string): string|string[]=>{
				return generateAutocomplete(
					generateCommandNames(aspectNames, "\\."),
					input,
				);
			};
			while (true) {
				// print current result
				term.previousLine(0);
				term.eraseLine();
				term(`${target.name}: ${JSON.stringify(tempResult)}\n`);
				// input
				term.eraseLine();
				term("aspect> ");
				aspect = await term.inputField({
					autoComplete: autocompleteList,
					autoCompleteMenu: true,
					autoCompleteHint: true,
					cancelable: true,
				}).promise ?? "";
				if (aspect==="") {break;}
				if (!aspectNames.includes(aspect)) {continue;}
				while (true) {
					term.eraseLine();
					term.column(0);
					term("count> ");
					count = await term.inputField({
						cancelable: true,
					}).promise ?? "";
					if (count === "") {break;}
					const countNumber = Number(count);
					if (!Number.isSafeInteger(countNumber)) {continue;}
					// add to result
					tempResult[aspect]=countNumber;
					// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
					if (tempResult[aspect] <= 0) {delete tempResult[aspect];}
					break;
				}
			}
			// clear the user input line
			term.eraseLine();
			term.previousLine(0);
			term.eraseLine();
			result = tempResult as processedType<t>;
			break;
		}
		case "integer":{
			let tempResult: number|undefined = undefined;
			term("");
			while (true) {
				term(target.name+"> ");
				const input = await term.inputField({
					cancelable: true,
				}).promise ?? "";
				term.eraseLine();
				term.column(0);
				if (input === "") {
					if (target.options.default !== undefined) {
						tempResult = target.options.default;
						break;
					}
					continue;
				}
				const num = Number(input);
				if (isNaN(num)) {continue;}
				if (!Number.isSafeInteger(num)) {continue;}
				if (
					target.options.min!==undefined && target.options.min > num ||
					target.options.max!==undefined && target.options.max < num
				) {continue;}
				tempResult = num;
				break;
			}
			result = tempResult as processedType<t>;
			break;
		}
		default:{
			throw TypeError("unknown type given");
		}
	}
	// clear the user input line
	term.eraseLine();
	term.column(0);
	term(`${target.name}: ${JSON.stringify(result)}\n`);
	return result;
}
