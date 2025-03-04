import type {elementStackCreationCommand} from "./saveTypes.js";
import type {stackExtraInfo} from "./types.js";
import type {Terminal} from "terminal-kit";
import {config, jsonSpacing, markupItems, markupReplaceList} from "./config.js";

export const itemDisplaySelection = ["full", "aspects", "rooms", "counts"] as const;


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

export function displayItemList(term: Terminal, items: (elementStackCreationCommand & stackExtraInfo)[], type?: typeof itemDisplaySelection[number]): void {
	switch (type??config.defaultItemDisplay) {
		case "full": {
			term(JSON.stringify(items, null, jsonSpacing)+"\n");
			return;
		}
		case "aspects": {
			term(items.map(item=>{
				return `${markupItems.item}${item.entityid}^:: ${
					[...Object.entries(item.aspects)]
						.map(([aspect, count])=>`${markupReplace(aspect)}: ${count}`).join(", ")
				}\n`;
			}).join(""));
			return;
		}
		case "rooms": {
			term([...items.reduce((hopper, item)=>{
				if (hopper.has(item.entityid)) {
					(hopper.get(item.entityid)??[]).push(item.room);
				} else {
					hopper.set(item.entityid, [item.room]);
				}
				return hopper;
			}, new Map<string, string[]>()).entries()]
				.map(([item, rooms]): string=>`${markupItems.item}${item}^:: [${rooms.join(", ")}]\n`).join(""));
			return;
		}
		case "counts": {
			term([...items.reduce((hopper, item)=>{
				const prev = hopper.get(item.entityid)??0;
				hopper.set(item.entityid, prev+item.quantity);
				return hopper;
			}, new Map<string, number>()).entries()]
				.map(([item, count]): string=>`${markupItems.item}${item}^:: ${count}\n`).join(""));
			return;
		}
		default: {
			term.red("ERR. Unknown item display function.\n");
			return;
		}
	}
}

/*

.forEach(entry=>{
		const key = entry.entityid;
		if (!result.has(key)) {result.set(key, []);}
		const values = result.get(key);
		if (values===undefined) {return;}
		if (!values.includes(entry.room)) {
			values.push(entry.room);
		}
	});


	findItems(args).forEach(item=>{
		counts.set(item.entityid, (counts.get(item.entityid)??0)+1);
	});
		.sort(([_a, countA], [_b, countB]): number=>countA-countB)
		.map(([name, count]): string=>`${name}: ${count}\n`)
		.join(""));

*/
