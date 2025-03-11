import type {Terminal} from "terminal-kit";
import {getInput} from "../commandHelpers.ts";
import type * as types from "../types.ts";
import {save, data} from "../dataProcessing.ts";
/* getSaveRaw, getDataItems, getDataRecipes, getAllVerbs, getDataDecks*/
import * as util from "node:util";

const debug: types.inputNode = [["debug"], [
	[["devQuickCommand", "dqc"], devQuickCommand, "used by dev for quick testing/prototyping. could do anything, SHOULD do nothing..."],
	[["color"], colorSpace, "show all colors"],
	[["devTestSave"], devTestSave, "reads the loaded save file and alerts of differences between the save and saveTypes.ts file."],
	[["devTestData"], devTestData, "reads the data files and gives statistics of how they are formatted."],
], "debug/dev commands. these can break or crash the program. don't run unless you are a dev."];


export async function devQuickCommand(term: Terminal): Promise<string> {
	console.log(getInput(term, {
		id: "object",
		name: "testObject",
		options: {
		},
		subType: [
			["string", true, {
				id: "string",
				name: "first name",
				options: {
					autocomplete: [],
					strict: false,
				},
			}],
			["integer", true, {
				id: "integer",
				name: "age",
				options: {
					min: 1,
					max: 99,
					default: 10,
				},
			}],
			["bool", true, {
				id: "boolean",
				name: "is evil",
				options: {
					default: true,
				},
			}],
			["array", true, {
				id: "array",
				name: "aspect slots",
				subType: {
					id: "aspects",
					name: "aspects",
					options: {
						minTypes: 1,
						maxTypes: 4,
					},
				},
				options: {
					minLength: 1,
					maxLength: 5,
				},
			}],
			["stringArray", true, {
				id: "stringArray",
				name: "foods",
				options: {
					autocomplete: ["bread", "apple", "corn", "candy"],
					default: ["apple"],
					minLength: 1,
					maxLength: 99,
					strict: false,
				},
			}],
		],
	}));
	return Promise.resolve("");
}
export async function devTestSave(_term: Terminal): Promise<string> {
	/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unnecessary-condition */
	const saveRaw = save.raw;
	if (saveRaw===undefined) {
		console.log("no save loaded.");
		return "";
	}
	// save
	console.log("checking save.");
	if (checkKeys(saveRaw, [
		"$type", "charactercreationcommands", "rootpopulationcommand", "populatexamanekcommand", "notificationcommands", "version", "isfresh",
	])) {return "";}
	if (saveRaw?.$type !== "persistedgamestate") {console.error(`save.$type = ${saveRaw.$type}`);}
	// save.charactercreationcommands
	// save.rootpopulationcommand
	// save.populatexamanekcommand
	// save.notificationcommands
	// save.version
	// save.isfresh
	/* eslint-enable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unnecessary-condition */
	console.log("done.");
	return Promise.resolve("");
}
export async function devTestData(_term: Terminal): Promise<string> {
	console.log("\nNEXT: getDataItems");
	console.log(util.inspect(countKeys(data.elements.values()), {showHidden: false, depth: null, colors: true}));
	console.log("\nNEXT: getDataRecipes");
	console.log(util.inspect(countKeys(data.recipes.values()), {showHidden: false, depth: null, colors: true}));
	console.log("\nNEXT: getAllVerbs");
	console.log(util.inspect(countKeys(data.verbs.values()), {showHidden: false, depth: null, colors: true}));
	console.log("\nNEXT: getDataDecks");
	console.log(util.inspect(countKeys(data.decks.values()), {showHidden: false, depth: null, colors: true}));
	return Promise.resolve("");
}

export function colorSpace(term: Terminal): string {
	for (let r=0;r<256;r+=5) {
		for (let g=0;g<256;g+=5) {
			for (let b=0;b<256;b+=5) {
				term.colorRgb(r, g, b, "#");
			}
		}
		term("\n");
	}
	return "";
}

type keyCountMap = Map<string, [number, [unknown[], keyCountMap]|undefined]>;
function countKeys(objs: unknown[], keyCounts: keyCountMap = new Map()): keyCountMap {
	for (const obj of objs) {
		if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {continue;}
		for (const key of Object.keys(obj)) {
			if (!keyCounts.has(key)) {keyCounts.set(key, [0, undefined]);}
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const keyCount = keyCounts.get(key)!;
			keyCount[0]++;
			if (checkKeyForObject(obj, key)) {
				if (keyCount[1] === undefined) {keyCount[1] = [[], new Map() as keyCountMap];}
				if (Array.isArray(obj[key])) {
					const arr = obj[key] as unknown[];
					if (arr.length === 0 || typeof arr[0] !== "object" || arr[0] === null) {continue;}
					keyCount[1][0].push(...(obj[key] as unknown[]));
				} else {
					keyCount[1][0].push(obj[key]);
				}
			}
		}
	}
	keyCounts.forEach((keyCount, _key): void=>{
		if (keyCount[1]===undefined) {return;}
		countKeys(...keyCount[1]);
		keyCount[1][0]=[];
	});
	return keyCounts;
}

function checkKeys(obj: object, keys: string[]): boolean {
	const targKeys = new Set(keys);
	const extra: string[] = [];
	[...Object.keys(obj)].forEach(key=>{
		if (targKeys.has(key)) {
			targKeys.delete(key);
		} else {
			extra.push(key);
		}
	});
	const missing = [...targKeys.keys()];
	const isValid = missing.length+extra.length===0;
	if (!isValid) {
		console.warn(`invalid Keys: missing ${JSON.stringify(missing)}, extra ${JSON.stringify(extra)}.`);
	}
	return isValid;
};

function checkKeyForObject<t extends object, u extends string>(obj: t, key: u): obj is t & Record<u, object> {
	if (!Object.hasOwn(obj, key)) {return false;}
	const value = (obj as t & Record<u, unknown>)[key];
	if (typeof value !== "object" || value === null) {return false;}
	return true;
}

export default debug;
