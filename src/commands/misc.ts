import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {jsonSpacing, markupItems} from "../config.js";
import {save, data, mergeAspects} from "../dataProcessing.js";
import {validateOrGetInput, itemFilter} from "../commandHelpers.js";


type availableMemoriesResult = Partial<Record<
	"recipes"|`items${"Reusable"|"Consumable"}${"Inspect"|"Talk"}`, // obtain group
	[string, string[]][] // memory id, specific item needed
>>;

const misc: types.inputNode = [["misc"], [
	[["missingCraftable"], missingCraftable, "lists all known recipes & ALL gathering spots that create items you don't have."],
	[["availableMemories"], availableMemories, "shows all memories that can be obtained."],
], "things I couldn't categorize. CAN CONTAIN SPOILERS!"];

export async function missingCraftable(term: Terminal, parts: string[]): Promise<string> {
	const groupings = [
		["skillRecipes", "otherRecipes", "unknownRecipes"],
		["decks", "decksExtra"],
		["talk", "consider"],
	] as const;
	const isIntersecting = (a: readonly string[], b: readonly string[]): boolean=>a.some(str=>b.includes(str));
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["sources", true, {
				id: "stringArray",
				name: "craftable sources",
				options: {
					autocomplete: groupings.flat(),
					strict: true,
				},
			}],
			["detailed", true, {
				id: "boolean",
				name: "list item names",
				options: {default: false},
			}],
			["maxOwned", false, {
				id: "integer",
				name: "max items owned",
				options: {
					min: 0,
					default: 0,
				},
			}],
		],
	});
	// processing
	const sources = args.sources as (typeof groupings[number][number])[];
	const result: [string, string[]][] = [];
	const extraDecks = [
		"sweetbones.employables",
		"incidents",
		"incidents.numa",
		"numa.possibility",
		"d.books.dawn",
		"d.books.solar",
		"d.books.baronial",
		"d.books.curia",
		"d.books.nocturnal",
		"d.books.nocturnal.everyman",
		"d.books.divers",
		"d.challenges.opportunities",
	];
	const otherRecipes = [
		"examine",
		"open",
		"chandlery",
		"disassemble",
		"pumps",
		"draw",
		"salon",
		"cook",
		"gather",
		"well",
		"fire",
		"sea",
	];
	/*
	const metaRecipes = [
		"setup",
		"catalogue",
		"legacy",
		"remove",
		"study",
		"block",
		"year",
		"ch",
		"trn",
		"letter",
		"unveil",
		"evolve",
		"lighthouse",
		// DLC? i've not gotten to this stuff so IDK
		"meddle", // maybe keep?
		"wc",
		"open",
		// IDK what these are. but there's a lot of them
		"nxs",
		"nxh",
		"nx",
		"slnev",
		"village",
		"talk",
		"u",
		"acquaintance",
		"postoffice",
		"split",
		"recruit",
		"clean",
		"rest",
		"work",
	];
	*/
	// get combined count of items
	const saveItems = new Map<string, number>();
	for (const saveItem of save.elements.values()) {
		saveItems.set(saveItem.entityid, (saveItems.get(saveItem.entityid)??0)+saveItem.quantity);
	}
	const beginsWith = (recipe: types.dataRecipe, arr: string[]): boolean=>arr.includes(recipe.id.split(".", 1)[0]);
	if (isIntersecting(sources, groupings[0])) {
		for (const recipe of data.recipes.values()) {
			// TODO: filter out all garbage recipes
			const isSkillRecipe = beginsWith(recipe, ["craft"]) && Object.keys(recipe.reqs??{}).find(key=>key.startsWith("s."));
			const isOtherRecipe = beginsWith(recipe, otherRecipes);
			const isUnknown = !(isSkillRecipe!==undefined||isOtherRecipe);
			if (isSkillRecipe && (!sources.includes("skillRecipes") || !save.elements.find(item=>item.entityid===isSkillRecipe))) {continue;}
			if (isOtherRecipe && !sources.includes("otherRecipes")) {continue;}
			if (isUnknown && !sources.includes("unknownRecipes")) {continue;}
			const effects = recipe.effects;
			if (effects) {result.push([recipe.id, Object.keys(effects)]);}
		};
	}
	if (isIntersecting(sources, groupings[1])) {
		for (const deck of data.decks.values()) {
			const isExtra = extraDecks.includes(deck.id);
			if (isExtra && !sources.includes("decksExtra")) {continue;}
			if (!isExtra && !sources.includes("decks")) {continue;}
			result.push([deck.id, deck.spec]);
		};
	}
	if (isIntersecting(sources, groupings[2])) {
		const saveItemUnique = new Set(save.elements.values().map(item=>item.entityid));
		for (const itemId of saveItemUnique) {
			const item = data.elements.get(itemId);
			if (!item) {
				term.yellow(`save item ${itemId} could not be found.\n`);
				continue;
			}
			if (sources.includes("talk")) {
				// TODO: stub. check item's data.
			}
			if (sources.includes("consider")) {
				// TODO: stub. check item's data.
			}
		}
	}
	const uniqueItemsSave = save.raw?.charactercreationcommands[0].uniqueelementsmanifested ?? [];
	const allItems = new Set<string>(result.flatMap(groups=>groups[1]));
	const validItems = new Set<string>([...allItems.values()].filter(item=>{
		const foundItem = data.elements.find(itemData=>itemData.id===item);
		if (!foundItem) {
			term.yellow(`item ${foundItem} could not be found.\n`);
			// keep it by default
			return false;
		}
		const aspects = mergeAspects(data.elements.getInheritedProperty(item, "aspects"));
		if (aspects["memory"]||aspects["correspondence"]||aspects["invitation"]) {
			return false;
		}
		// if item exists in library
		const countOwned = saveItems.get(item);
		if ((countOwned??0) > (args.maxOwned??0)) {return false;}
		// if it's unique value already exists
		if (uniqueItemsSave.includes(item)) {return false;}
		return true;
	}));
	const found = result
		.map(([name, items]): [string, string[]]=>{
			const uniqueItems = new Set<string>(items);
			return [name, [...uniqueItems.values()].filter(item=>validItems.has(item))];
		})
		.filter(target=>{
			if (target[1].length===0) {return false;}
			return true;
		});

	// output
	for (const [name, items] of found) {
		const detail = args.detailed?items.join(", "):items.length.toString();
		term(`${markupItems.item}${name}^:: ${detail}\n`);
	}
	return JSON.stringify(args);
}
export async function availableMemories(term: Terminal, parts: string[]): Promise<string> {
	const maxTargLen = 15;
	const genListOutput = (memories: [string, string[]][]): void=>{
		for (const [memId, targs] of memories) {
			term(`${jsonSpacing}${markupItems.item}${memId}^:: `);
			if (targs.length <= maxTargLen) {
				term(targs.join(", ")+"\n");
			} else {
				targs.length = maxTargLen;
				term(targs.join(", ")+", ");
				term.gray("...\n");
			}
		}
	};
	// input
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["inputs", true, {
				id: "stringArray",
				name: "memory sources",
				options: {
					autocomplete: ["recipes", "itemsReusable", "itemsConsumable", "books"],
					strict: true,
				},
			}],
			["filter", false, itemFilter],
			["owned", true, {
				id: "boolean",
				name: "include already obtained",
				options: {
					default: false,
				},
			}],
		],
	});
	// processing
	const appendToMap = (map: Map<string, string[]>, key: string, value: string): void=>{
		if (!map.has(key)) {map.set(key, []);}
		const array = map.get(key);
		if (!array) {return;}
		array.push(value);
	};
	const isValid = (itemId: string): boolean=>{
		const aspects = mergeAspects(data.elements.getInheritedProperty(itemId, "aspects"));
		if (!aspects["memory"]) {return false;}
		// FIXME: use all filter options
		if (args.filter?.any !== undefined) {
			const filterEntries = Object.entries(args.filter.any);
			for (const [aspect, count] of filterEntries) {
				if ((aspects[aspect]??0) < count) {return false;}
			}
		}
		if (!args.owned) {
			const alreadyObtained = save.elements.find(item=>item.entityid===itemId);
			if (alreadyObtained) {return false;}
		}
		return true;
	};
	const result: availableMemoriesResult = {};
	if (args.inputs.includes("recipes")) {
		const foundRecipes = new Map<string, string[]>();
		const recipes = data.recipes.filter(recipe=>save.recipes.has(recipe.id));
		for (const recipe of recipes) {
			for (const [cardId, _count] of Object.entries(recipe.effects??{})) {
				if (isValid(cardId)) {
					appendToMap(foundRecipes, cardId, recipe.id);
				}
			}
		}
		if (foundRecipes.size>0) {
			result.recipes = [...foundRecipes.entries()];
		}
	}
	// FIXME: items are broken
	if (
		args.inputs.includes("itemsReusable") ||
		args.inputs.includes("itemsConsumable") ||
		args.inputs.includes("books")
	) {
		const foundReusableInspect = new Map<string, string[]>();
		const foundReusableTalk = new Map<string, string[]>();
		const foundConsumableInspect = new Map<string, string[]>();
		const foundConsumableTalk = new Map<string, string[]>();
		const items = [...new Set(save.elements.values().map(item=>item.entityid))]
			.map(itemId=>data.elements.find(itemData=>itemData.id===itemId))
			.filter(itemData=>itemData!==undefined);
		for (const item of items) {
			if (!item.xtriggers) {
				continue;
			}
			for (const [type, infoArr] of Object.entries(item.xtriggers)) {
				for (const info of infoArr) {
					if (typeof info === "string" || info.morpheffect !== "spawn") {continue;}
					if (!isValid(info.id)) {continue;}
					// ignore books if asked
					if (type.startsWith("reading.")) {
						if (args.inputs.includes("books")) {
							// FIXME: filter out non-mastered books
							appendToMap(foundReusableInspect, info.id, item.id);
						}
						continue;
					}
					// FIXME: can't figure out what determines if something gets "used up"
					// TEMP: just treat them as the same for now.
					if (
						!args.inputs.includes("itemsReusable") &&
						!args.inputs.includes("itemsConsumable")
					) {
						continue;
					}

					if (type==="dist") {
						appendToMap(foundConsumableTalk, info.id, item.id);
						continue;
					}
					if (type==="scrutiny") {
						appendToMap(foundConsumableInspect, info.id, item.id);
						continue;
					}
				}
			}
		}
		if (foundReusableInspect.size>0) {
			result.itemsReusableInspect = [...foundReusableInspect.entries()];
		}
		if (foundReusableTalk.size>0) {
			result.itemsReusableTalk = [...foundReusableTalk.entries()];
		}
		if (foundConsumableInspect.size>0) {
			result.itemsConsumableInspect = [...foundConsumableInspect.entries()];
		}
		if (foundConsumableTalk.size>0) {
			result.itemsConsumableTalk = [...foundConsumableTalk.entries()];
		}
	}
	// TODO: filter out wrong aspected memories
	// TODO: filter out already obtained
	// output
	if (result.recipes) {
		term.blue("Recipes");
		term(":\n");
		genListOutput(result.recipes);
	}
	if (result.itemsConsumableInspect) {
		term.blue("Consumables (Inspect)");
		term(":\n");
		genListOutput(result.itemsConsumableInspect);
	}
	if (result.itemsConsumableTalk) {
		term.blue("Consumables (Talk)");
		term(":\n");
		genListOutput(result.itemsConsumableTalk);
	}
	if (result.itemsReusableInspect) {
		term.blue("Reusables (Inspect)");
		term(":\n");
		genListOutput(result.itemsReusableInspect);
	}
	if (result.itemsReusableTalk) {
		term.blue("Reusables (Talk)");
		term(":\n");
		genListOutput(result.itemsReusableTalk);
	}
	return JSON.stringify(args);
}

export default misc;
