import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {data} from "../dataProcessing.js";

const list: types.inputNode = [["list"], [
	[["aspects"], listAspects, "displays all aspects in the game (even hidden ones)"],
	// locked recipes? maybe. could cause spoiler issues
	// shorthands for empty searches. see "search *" commands
	// remaining draws in decks. (RootPopulationCommand.DealersTable)
], "lists things in the game. CAN CONTAIN SPOILERS!"];


export function listAspects(term: Terminal): string {
	// TODO: output filtering
	term(data.aspects.values().sort().join(", ")+"\n");
	return "";
}

export default list;
