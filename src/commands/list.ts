import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {getAllAspects} from "../dataProcessing.js";

const list: types.inputNode = [["list"],[
	[["aspects"],listAspects,"displays all aspects in the game (even hidden ones)"],
	// locked recipes? maybe. could cause spoiler issues
	// shorthands for empty searches. see "search *" commands
	// remaining draws in decks. (RootPopulationCommand.DealersTable)
],"lists things in the game. CAN CONTAIN SPOILERS!"];


export function listAspects(term: Terminal):void {
	// TODO: output filtering
	term(getAllAspects().sort().join(", ")+"\n");
}

export default list;
