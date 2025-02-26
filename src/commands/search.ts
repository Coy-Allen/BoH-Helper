import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {itemFilter, validateOrGetInput} from "../commandHelpers.js";
import {data, save, filterBuilders, filterPresets} from "../dataProcessing.js";
import {jsonSpacing} from "../config.js";
import * as dataVis from "../dataVisualizationFormatting.js";

const search: types.inputNode = [["search"], [
	[["verbs"], searchVerbs, "search found popups and their card inputs."],
	// locked rooms
	[["items"], searchItems, "search owned items and their aspects."],
	[["itemPresets"], searchItemPresets, "search owned items using preset filters."],
	[["recipes"], searchRecipes, "search discovered (non-???) recipes and their outputs."],
], "finds unlocked things in your save file. load your save file 1st."];

async function searchVerbs(term: Terminal, parts: string[]): Promise<string> {
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
			/*
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
			*/
		],
	});
	// FIXME: need to figure out how to do this
	const result = data.verbs.filter(
		verb=>save.verbs.has(verb.id),
		verb=>{
			const slotCount = verb.slots ? verb.slots.length : verb.slot ? 1 : 0;
			if (args.slotMax && args.slotMax < slotCount) {return false;}
			if (args.slotMin && args.slotMin > slotCount) {return false;}
			return true;
		},
		// TODO: filter via args.slots
	);
	// TODO: have alternative outputs
	term(JSON.stringify(result, null, jsonSpacing)+"\n");
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return parts.join(" ");
}
async function searchItems(term: Terminal, parts: string[]): Promise<string> {
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["filter", true, itemFilter],
			["output", true, {
				id: "string",
				name: "output format",
				options: {
					autocomplete: [...dataVis.itemDisplaySelection],
					default: "rooms",
					strict: true,
				},
			}],
		],
	});
	const items = save.elements.filter(filterBuilders.saveItemFilter(args.filter));
	dataVis.displayItemList(term, items, args.output);
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return parts.join(" ");
}
async function searchItemPresets(term: Terminal, parts: string[]): Promise<string> {
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["preset", true, {
				id: "string",
				name: "preset",
				options: {
					autocomplete: [...filterPresets.keys()],
					strict: true,
				},
			}],
			["output", true, {
				id: "string",
				name: "output format",
				options: {
					autocomplete: [...dataVis.itemDisplaySelection],
					default: "rooms",
					strict: true,
				},
			}],
		],
	});
	const targetPreset = filterPresets.get(args.preset);
	if (targetPreset===undefined) {
		throw Error("preset not found");
	}
	const items = save.elements.filter(
		filterBuilders.saveItemFilter(targetPreset),
	);
	dataVis.displayItemList(term, items, args.output);
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return parts.join(" ");
}
async function searchRecipes(term: Terminal, parts: string[]): Promise<string> {
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
	const result = data.recipes.filter(
		recipe=>save.recipes.has(recipe.id),
		// remember aspectFilter does not take inheritance into account
		filterBuilders.aspectFilter(args.reqs??{}, recipe=>recipe.reqs??{}),
	).map(recipe=>[recipe, recipe.reqs]);
	term(JSON.stringify(result, null, jsonSpacing)+"\n");
	return JSON.stringify(args);
}

export default search;
