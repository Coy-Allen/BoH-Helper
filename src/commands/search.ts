import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {itemFilter, validateOrGetInput} from "../commandHelpers.js";
import {data, save, filterBuilders} from "../dataProcessing.js";
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
	dataVis.displayItemList(term, items, args.output as typeof dataVis.itemDisplaySelection[number]);
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return parts.join(" ");
}
async function searchItemPresets(term: Terminal, parts: string[]): Promise<string> {
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
		id: "object",
		name: "options",
		options: {},
		subType: [
			["preset", true, {
				id: "string",
				name: "preset",
				options: {
					autocomplete: [...presets.keys()],
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
	const targetPreset = presets.get(args.preset);
	if (targetPreset===undefined) {
		throw Error("preset not found");
	}
	const items = save.elements.filter(
		filterBuilders.aspectFilter(targetPreset, item=>item.aspects),
	);
	dataVis.displayItemList(term, items, args.output as typeof dataVis.itemDisplaySelection[number]);
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
		filterBuilders.aspectFilter(args.reqs??{}, recipe=>recipe.reqs??{}),
	).map(recipe=>[recipe, recipe.reqs]);
	term(JSON.stringify(result, null, jsonSpacing)+"\n");
	return JSON.stringify(args);
}

export default search;
