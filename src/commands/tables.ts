import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {validateOrGetInput} from "../commandHelpers.js";
import {itemFilter, aspectTarget} from "../commandHelperPresets.js";
import {data, element, filterBuilders, save} from "../dataProcessing.js";
import {markupReplace} from "../dataVisualizationFormatting.js";
import {markupItems} from "../config.js";

const tables: types.inputNode = [["tables"], [
	[["maxAspects"], maxAspects, "shows max aspects available."],
	[["maxAspectsPreset"], maxAspectsPreset, "shows max aspects available for a given workbench."],
	[["maxAspectsAssistance"], maxAspectsAssistance, "shows max aspects available using assistance. Memories are excluded, checks all helpers, everything else only checks owned items/omens."],
	[["minAspectRoomUnlock"], minAspectUnlockableRooms, "shows the minimum aspects needed to unlock a room. might break for strange rooms."],
	[["minAspectBooks"], minAspectBooks, "shows the mimimum required aspects to read a book from your owned books."],
	[["maxAspectsAllVerbs"], maxAspectVerbs, "shows max aspects possible using all known verbs"],
	// list max aspects possible for given crafting bench.
], "display's tables of info"];

async function maxAspects(term: Terminal, parts: string[]): Promise<string> {
	// get input
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["row", true, {
				id: "array",
				name: "slot",
				options: {},
				subType: itemFilter,
			}],
			["col", false, aspectTarget],
		],
	});
	// calculate
	const tableObj = new table(args.col??defaultAspects);
	args.row.forEach(row=>{tableObj.addRow(JSON.stringify(row), row, maxAspectCheck);});
	tableObj.print(term);
	return JSON.stringify(args);
}

async function maxAspectsPreset(term: Terminal, parts: string[]): Promise<string> {
	// TODO: grab all possible stations
	const verbs = data.verbs.values();
	// get input
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		name: "options",
		options: {},
		subType: [
			["verb", true, {
				id: "string",
				name: "preset",
				options: {
					autocomplete: verbs.map(verb=>verb.id),
					autocompleteDelimiter: "\\.",
					strict: true,
				},
			}],
			["col", false, aspectTarget],
		],
	});
	// get station info
	const targetVerb = verbs.find(verb=>verb.id===args.verb);
	if (targetVerb===undefined) {throw new Error("verb not found");}
	// calculate
	const slots = targetVerb.slot?[targetVerb.slot]:targetVerb.slots?targetVerb.slots:[];
	const filters = slots.map(slot=>{
		const options: types.itemSearchOptions = {};
		if (slot.essential) {options.min=slot.essential;};
		if (slot.required) {options.any=slot.required;};
		if (slot.forbidden) {
			const max: Record<string, number> = {};
			Object.keys(slot.forbidden).forEach(forbidden=>max[forbidden]=0);
			options.max = max;
		};
		return options;
	});
	const tableObj = new table(args.col??defaultAspects);
	filters.forEach(row=>{tableObj.addRow(JSON.stringify(row), row, maxAspectCheck);});
	tableObj.print(term);
	return JSON.stringify(args);
}

function maxAspectsAssistance(term: Terminal, parts: string[]): string {
	// TODO: figure out how to make this NOT hard coded
	const types = [ // prototype element, aspect
		["_assistance", undefined],
		["_assistance.usescandles", "candle"],
		["_assistance.useswood", "wood"],
		["_assistance.usesfabric", "fabric"],
		["_assistance.usesmetal", "metal"],
		["_assistance.usesfuel", "fuel"],
		["_assistance.usesomen", "omen"],
		["_assistance.usespigment", "pigment"],
		["_assistance.usesflower", "flower"],
		// neither of these 2 are used in game
		["_assistance.usescooperative", "cooperative"],
		["_assistance.usessound", "sound"],
	] as const;

	const sharedAspects = ["ability", "memory", "tool", "sustenance", "beverage"]; // Memory won't be listed. due to memories being created as needed by the user.
	const sharedCalc = new table(defaultAspects);
	sharedAspects.forEach(aspect=>{sharedCalc.addRow(aspect, {min: {[aspect]: 1}}, maxAspectCheck);});
	const allTables: table<typeof defaultAspects>[] = [];
	for (const [prototype, aspect] of types) {
		const people = data.elements.findAll(elem=>elem.inherits===prototype);
		if (people.length===0) {continue;}

		const tableCalc = new table(defaultAspects);
		tableCalc.addRow("assistance", people, maxAspectCheck);
		if (aspect) {tableCalc.addRow("extra", {min: {[aspect]: 1}}, maxAspectCheck);}
		allTables.push(tableCalc);
	}
	const finalTable = table.append([sharedCalc, table.merge(allTables)]);
	finalTable.print(term);
	return parts.join(" ");
}

function minAspectUnlockableRooms(term: Terminal, parts: string[]): string {
	// TODO: rewrite this to use minAspectCheck
	// const minAspect: [string, number|undefined][] = defaultAspects.map(_=>["-", undefined]);
	const requirements = save.roomsUnlockable.map((room): types.dataElement|undefined=>{
		const recipe = data.recipes.find(entry=>entry.id===`terrain.${room.payload.id}`);
		if (recipe===undefined) {
			console.log(`failed to find unlock requirement for ${room.payload.id}.`);
			return;
		}
		const aspects = recipe.preslots?.[0]?.required;
		if (aspects===undefined) {
			console.log(`failed to find aspect requirements for ${room.payload.id}.`);
			return;
		}
		return {
			id: recipe.id,
			aspects: aspects,
		};
	}).filter(req=>req!==undefined);
	const tableObj = new table(defaultAspects);
	tableObj.addRow("Room", requirements, minAspectCheck);
	tableObj.print(term);
	return parts.join(" ");
}

function minAspectBooks(term: Terminal, parts: string[]): string {
	// FIXME: exclude books we don't have the language for
	const tableObj = new table(defaultAspects.map(aspect=>"mystery."+aspect));
	tableObj.addRow("book", {
		any: Object.fromEntries(defaultAspects.map(aspect=>["mystery."+aspect, 1])),
		max: Object.fromEntries(defaultAspects.map(aspect=>["mastery."+aspect, 0])),
	}, minAspectCheck);
	tableObj.print(term);
	return parts.join(" ");
}
async function maxAspectVerbs(term: Terminal, parts: string[]): Promise<string> {
	// FIXME: doesn't have all rows
	// TODO: option to skip over specific slots (skill).
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "object",
		options: {},
		name: "args",
		subType: [
			["skipSkill", true, {
				id: "boolean",
				options: {
					default: false,
				},
				name: "skip skill slot",
			}],
		],
	});
	const ownedVerbs = save.verbs.values();
	const verbTables = data.verbs
		.filter(verb=>ownedVerbs.includes(verb.id))
		.map(verb=>{
			const tableObj = new table(defaultAspects);
			const filters = ((verb.slot?[verb.slot]:verb.slots)??[]).map((slot): filter=>{
				if (
					args.skipSkill &&
					(slot.essential?.["skill"]??0) > 0
				) {
					return [];

				}
				const filter: types.itemSearchOptions = {};
				if (slot.forbidden) {
					filter.max = Object.fromEntries(Object.entries(slot.forbidden).map(entry=>[entry[0], 0]));
				}
				if (slot.required) {
					filter.any = slot.required;
				}
				if (slot.essential) {
					filter.min = slot.essential;
				}
				return filter;
			});
			filters.forEach(row=>{tableObj.addRow(JSON.stringify(row), row, maxAspectCheck);});
			return tableObj;
		});
	const titles = ["Soul (usually)", "Skill (usually)", "Memory (usually)"];
	const result = table.merge(verbTables, titles);
	result.print(term);
	return JSON.stringify(args);
}

// Shared code
type cell = ([string[], number]|[]);
const defaultAspects = [
	"lantern",
	"forge",
	"edge",
	"winter",
	"heart",
	"grail",
	"moth",
	"knock",
	"sky",
	"moon",
	"nectar",
	"scale",
	"rose",
];
function maxAspectCheck(item: types.dataElement | element, aspect: string, targ: cell): [number, number] {
	const itemAspects = item.aspects;
	if (
		itemAspects?.[aspect] === undefined ||
		itemAspects[aspect] === 0
	) {return [-1, 0];}
	if (targ.length===0) {return [itemAspects[aspect], itemAspects[aspect]];}
	const diff = itemAspects[aspect] - targ[1];
	return [diff, itemAspects[aspect]];
}
function minAspectCheck(item: types.dataElement | element, aspect: string, targ: cell): [number, number] {
	const itemAspects = item.aspects;
	if (
		itemAspects?.[aspect] === undefined ||
		itemAspects[aspect] === 0
	) {return [-1, 0];}
	if (targ.length===0) {return [itemAspects[aspect], itemAspects[aspect]];}
	const diff = targ[1] - itemAspects[aspect];
	return [diff, itemAspects[aspect]];
}

export default tables;

// TODO: turn all of this into a class

interface tableCol {
	name: string;
	data: string[][]; // data[rowIndex][nameIndex] // all rowIndex arrays should have the same length
	total: number;
};
type filter = types.itemSearchOptions|types.dataElement[];

class table<headers extends string[]> {
	cols: tableCol[] = [];
	rowNames: string[] = []; // all cols[number].data[number] and rowNames should have the same length at all times!
	constructor(headers: headers) {
		this.cols = headers.map(header=>({
			name: header,
			data: [],
			total: 0,
		}));
	}
	addRow(
		rowName: string,
		rowFilter: filter,
		check: (item: types.dataElement | element, aspect: string, targ: cell) => [number, number], // [sort, target count]
	): void {
		const foundItems = Array.isArray(rowFilter) ? rowFilter : save.elements.filter(filterBuilders.saveItemFilter(rowFilter));
		for (const col of this.cols) {
			let max: cell = [];
			for (const item of foundItems) {
				const [compSort, itemAspect] = check(item, col.name, max);
				const name =  "entityid" in item ? item.entityid : item.id;
				if (compSort > 0) {
					max = [[name], itemAspect];
					continue;
				} else if (compSort === 0) {
					if (max.length===0) {
						max = [[], itemAspect];
					}
					max[0].push(name);
					max[1] = itemAspect;
					continue;
				}
				// ignore all compSort < 0
			}
			col.data.push(max[0]??[]);
			col.total+= max[1]??0;
		}
		this.rowNames.push(rowName);
	}
	print(term: Terminal): void {
		const tableFormatted: string[][] = [["", ...this.cols.map(col=>markupReplace(col.name))]];
		for (let i=0; i<this.rowNames.length; i++) {
			const rowName = this.rowNames[i] ?? `slot ${i+1}`;
			tableFormatted.push([
				rowName,
				...this.cols.map(col=>{
					const colData = col.data[i] ?? [];
					return colData.length===0?
						"":
						`${markupItems.item}${colData.join(`^:/${markupItems.item}`)}^:`; // :\n^b${/* TODO: count */}^:`;
				}),
			]);
		}
		tableFormatted.push(["totals", ...this.cols.map(col=>markupItems.totals+col.total.toString()+"^:")]);
		term.table(tableFormatted, {contentHasMarkup: true});
	}
	static append<u extends string[]>(tableList: table<u>[]): table<u> {
		const firstTable = tableList[0];
		if (firstTable===undefined) {return new table(defaultAspects);}
		if (tableList.length===1) {return firstTable;}
		const resultTable = new table(firstTable.cols.map(col=>col.name));
		resultTable.rowNames = tableList.flatMap(entry=>entry.rowNames);

		for (const tableEntry of tableList) {
			const colNames = [...new Set([...resultTable.cols.map(col=>col.name), ...resultTable.cols.map(col=>col.name)])];
			for (const colName of colNames) {
				const resultCol = resultTable.cols.find(col=>col.name===colName);
				const entryCol = tableEntry.cols.find(col=>col.name===colName);
				if (entryCol!==undefined && resultCol!==undefined) {
					resultCol.data.push(...entryCol.data);
					resultCol.total+=entryCol.total;
				}
				if (entryCol!==undefined && resultCol===undefined) {
					resultTable.cols.push({
						name: entryCol.name,
						data: [...entryCol.data],
						total: entryCol.total,
					});
				}
				if (entryCol===undefined && resultCol!==undefined) {
					resultCol.data.push(
						...new Array(tableEntry.rowNames.length)
							.fill(undefined)
							// we must use map to make sure each cell is it's own object.
							.map((_): string[]=>[]),
					);
				}
				if (entryCol===undefined && resultCol===undefined) {
					throw new Error("impossible code path found");
				}
			}
		}
		return resultTable;
	}
	static merge<u extends string[]>(tableList: table<u>[], rowNames?: string[]): table<u> {
		// FIXME: the rowNames param can be a different length than the data
		const firstTable = tableList[0];
		if (firstTable===undefined) {return new table(defaultAspects);}
		if (tableList.length===1) {return firstTable;}
		const resultTable = new table(firstTable.cols.map(col=>col.name));
		for (const col of resultTable.cols) {
			const maxFound: tableCol[] = [];
			// find max
			for (const tableEntry of tableList) {
				const tableCol = tableEntry.cols.find(entryCol=>entryCol.name===col.name);
				if (tableCol===undefined) {throw new Error(`Failed to find header ${col.name}.`);}
				const maxFoundFirst = maxFound[0];
				if (maxFoundFirst===undefined || maxFoundFirst.total < tableCol.total) {
					maxFound.length = 0;
					maxFound.push(tableCol);
					continue;
				}
				if (maxFoundFirst.total > tableCol.total) {continue;}
				if (maxFoundFirst.total===tableCol.total) {
					maxFound.push(tableCol);
					continue;
				}
			}
			// TODO: select which col of the maxed cols to use
			const selectedMaxCol = maxFound[0];
			if (selectedMaxCol===undefined) {continue;}
			col.data = selectedMaxCol.data;
			col.total = selectedMaxCol.total;
		}
		// FIXME: make sure all cols & rowNames are the correct length
		const maxRows = Math.max(...resultTable.cols.map(col=>col.data.length));
		for (const col of resultTable.cols) {
			while (col.data.length < maxRows) {
				col.data.push([]);
			}
		}
		const rowNamesFinal = rowNames ?
			rowNames :
			new Array(maxRows).fill("").map((_, i): string=>`slot ${i+1}`);
		rowNamesFinal.length = Math.min(maxRows, rowNamesFinal.length);
		resultTable.rowNames = rowNamesFinal;
		return resultTable;
	}
}
