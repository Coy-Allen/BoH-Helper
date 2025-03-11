import type * as types from "../types.ts";
import type {Terminal} from "terminal-kit";

import {validateOrGetInput} from "../commandHelpers.ts";
import {config} from "../config.ts";
import {data} from "../dataProcessing.ts";

const info: types.inputNode = [["info"], [
	[["items"], items, "info on item aspects and results for inspect/talk."],
], "give detailed info on something. does not need save file."];
async function items(term: Terminal, parts: string[]): Promise<string> {
	const args = await validateOrGetInput(term, parts.join(" "), {
		id: "string",
		name: "item name",
		options: {
			autocomplete: data.elements.keys(),
			autocompleteDelimiter: "\\.",
			strict: false,
		},
	});
	const result = data.elements.getInherited(args);
	term(JSON.stringify(result, null, config.jsonSpacing)+"\n");
	return JSON.stringify(args);
}

export default info;
