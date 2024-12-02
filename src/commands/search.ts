import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {aspectTarget, itemFilter, validateOrGetInput} from "../commandHelpers.js";
import {findVerbs, findItems, findRecipes} from "../dataProcessing.js";
import {jsonSpacing} from "../config.js";

const search: types.inputNode = [["search"], [
	[["verbs"], searchVerbs, "search found popups and their card inputs."],
	// locked rooms
	[["items"], searchItems, "search owned items and their aspects."],
	[["itemCounts"], searchItemCounts, "list owned item counts."], // counts of items in house
	[["recipes"], searchRecipes, "search discovered (non-???) recipes and their outputs."],
], "finds unlocked things in your save file. load your save file 1st."];

export async function searchVerbs(term: Terminal, parts: string[]): Promise<undefined> {
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
export async function searchItems(term: Terminal, parts: string[]): Promise<string|undefined> {
	const args = await validateOrGetInput(term, parts.join(" "), itemFilter);
	const result = findItems(args);
	term(JSON.stringify(result, null, jsonSpacing));
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return;
}
export async function searchItemCounts(term: Terminal, parts: string[]): Promise<string|undefined> {
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
export async function searchRecipes(term: Terminal, parts: string[]): Promise<string|undefined> {
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
