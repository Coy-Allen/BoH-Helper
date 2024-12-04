import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {aspectTarget, itemFilter, validateOrGetInput} from "../commandHelpers.js";
import {findVerbs, findItems, findRecipes} from "../dataProcessing.js";
import {jsonSpacing} from "../config.js";

const search: types.inputNode = [["search"], [
	[["verbs"], searchVerbs, "search found popups and their card inputs."],
	// locked rooms
	[["items"], searchItems, "search owned items and their aspects."],
	[["itemPresets"], searchItemPresets, "search owned items using preset filters."],
	[["itemCounts"], searchItemCounts, "list owned item counts."], // counts of items in house
	[["recipes"], searchRecipes, "search discovered (non-???) recipes and their outputs."],
], "finds unlocked things in your save file. load your save file 1st."];

async function searchVerbs(term: Terminal, parts: string[]): Promise<undefined> {
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["slotMin", false, {
				id: "integer",
				name: "min slots",
				options: {
					min: 0,
				},
			}],
			["slotMax", false, {
				id: "integer",
				name: "max slots",
				options: {
					min: 0,
				},
			}],
			["slots", false, {
				id: "array",
				name: "slots",
				options: {},
				subType: {
					id: "object",
					name: "slot",
					options: {},
					subType: [
						["required", false, aspectTarget],
						["essential", false, aspectTarget],
						["forbidden", false, aspectTarget],
						["missingRequired", false, aspectTarget],
						["missingEssential", false, aspectTarget],
						["missingForbidden", false, aspectTarget],
					],
				},
			}],
		],
	});
	const result = findVerbs(args);
	term(JSON.stringify(result));
}
async function searchItems(term: Terminal, parts: string[]): Promise<string|undefined> {
	const args = await validateOrGetInput(term, parts.join(" "), itemFilter);
	const result = new Map<string, string[]>();
	findItems(args).forEach(entry=>{
		const key = entry.entityid;
		if (!result.has(key)) {result.set(key, []);}
		const values = result.get(key);
		if (values===undefined) {return;}
		if (!values.includes(entry.room)) {
			values.push(entry.room);
		}
	});
	term(JSON.stringify([...result.entries()], null, jsonSpacing));
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return;
}
async function searchItemPresets(term: Terminal, parts: string[]): Promise<string|undefined> {
	const result = new Map<string, string[]>();
	/* eslint-disable @typescript-eslint/naming-convention */
	const presets = new Map<string, types.itemSearchOptions>([
		["unreadBooks", {
			any: {
				"mystery.lantern": 1,
				"mystery.forge": 1,
				"mystery.edge": 1,
				"mystery.winter": 1,
				"mystery.heart": 1,
				"mystery.grail": 1,
				"mystery.moth": 1,
				"mystery.knock": 1,
				"mystery.sky": 1,
				"mystery.moon": 1,
				"mystery.nectar": 1,
				"mystery.scale": 1,
				"mystery.rose": 1,
			},
			max: {
				"mastery.lantern": 0,
				"mastery.forge": 0,
				"mastery.edge": 0,
				"mastery.winter": 0,
				"mastery.heart": 0,
				"mastery.grail": 0,
				"mastery.moth": 0,
				"mastery.knock": 0,
				"mastery.sky": 0,
				"mastery.moon": 0,
				"mastery.nectar": 0,
				"mastery.scale": 0,
				"mastery.rose": 0,
			},
		}],
		["cursedBooks", {
			any: {
				"contamination.actinic": 1,
				"contamination.bloodlines": 1,
				"contamination.chionic": 1,
				"contamination.curse.fifth.eye": 1,
				"contamination.keeperskin": 1,
				"contamination.sthenic.taint": 1,
				"contamination.winkwell": 1,
				"contamination.witchworms": 1,
			},
		}],
	]);
	/* eslint-enable @typescript-eslint/naming-convention */
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "string",
		name: "preset",
		options: {
			autocomplete: [...presets.keys()],
			strict: true,
		},
	});
	const targetPreset = presets.get(args);
	if (targetPreset===undefined) {
		throw Error("preset not found");
	}
	findItems(targetPreset).forEach(entry=>{
		const key = entry.entityid;
		if (!result.has(key)) {result.set(key, []);}
		const values = result.get(key);
		if (values===undefined) {return;}
		if (!values.includes(entry.room)) {
			values.push(entry.room);
		}
	});
	term(JSON.stringify([...result.entries()], null, jsonSpacing));
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return;
}
async function searchItemCounts(term: Terminal, parts: string[]): Promise<string|undefined> {
	const args = await validateOrGetInput(term, parts.join(" "), itemFilter);
	const counts = new Map<string, number>();
	findItems(args).forEach(item=>{
		counts.set(item.entityid, (counts.get(item.entityid)??0)+1);
	});
	term([...counts.entries()]
		.sort(([_a, countA], [_b, countB]): number=>countA-countB)
		.map(([name, count]): string=>`${name}: ${count}\n`)
		.join(""));
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return;
}
async function searchRecipes(term: Terminal, parts: string[]): Promise<string|undefined> {
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["reqs", false, {
				id: "object",
				name: "input requirements",
				options: {},
				subType: [
					["min", false, {id: "aspects", name: "min", options: {}}],
					["max", false, {id: "aspects", name: "max", options: {}}],
				],
			}],
			["out", false, {
				id: "object",
				name: "output requirements",
				options: {},
				subType: [
					["min", false, {id: "aspects", name: "min", options: {}}],
					["max", false, {id: "aspects", name: "max", options: {}}],
				],
			}],
		],
	});
	const result = findRecipes(args).map(recipe=>[recipe[0].reqs, recipe[1]]);
	term(JSON.stringify(result, null, jsonSpacing)+"\n");
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return;
}

export default search;
