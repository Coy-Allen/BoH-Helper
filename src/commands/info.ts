import type * as types from "../types.js";
import type {Terminal} from "terminal-kit";

import {validateOrGetInput} from "../commandHelpers.js";
import {jsonSpacing} from "../config.js";
import {data} from "../dataProcessing.js";

const info: types.inputNode = [["info"], [
	[["items"], items, "info on item aspects and results for inspect/talk."],
], "give detailed info on something. does not need save file. CAN CONTAIN SPOILERS!"];
async function items(term: Terminal, parts: string[]): Promise<string|undefined> {
	// TODO: move "parts" into a custom input handler
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "string",
		name: "item name",
		options: {
			autocomplete: [],
			strict: false,
		},
	});
	const result = data.elements.getInherited(args);
	term(JSON.stringify(result, null, jsonSpacing)+"\n");
	if (parts.length === 0) {
		return JSON.stringify(args);
	}
	return;
}

export default info;
