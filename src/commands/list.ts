import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

import {markupItems} from "../config.js";
import {data, save} from "../dataProcessing.js";

const list: types.inputNode = [["list"], [
	[["aspects"], listAspects, "displays all aspects in the game (even hidden ones)"],
	[["decks"], listDecks, "displays all decks and their contents in the save file."],
	// locked recipes? maybe. could cause spoiler issues
	// shorthands for empty searches. see "search *" commands
	// remaining draws in decks. (RootPopulationCommand.DealersTable)
], "lists things in the game. CAN CONTAIN SPOILERS!"];


function listAspects(term: Terminal): string {
	// TODO: output filtering
	term(data.aspects.values().sort().join(", ")+"\n");
	return "";
}

function listDecks(term: Terminal): string {
	// TODO: output filtering
	term(save.decks.values().map(deck=>{
		return `${markupItems.deck}${deck[0]}^:: ${deck[1].map(item=>`${markupItems.item}${item}^:`).join(", ")}\n`;
	}).join(""));
	return "";
}


export default list;
