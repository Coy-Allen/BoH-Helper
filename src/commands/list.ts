import type {Terminal} from "terminal-kit";
import type * as types from "../types.ts";

import {markupItems} from "../config.ts";
import {data, save} from "../dataProcessing.ts";

const list: types.inputNode = [["list"], [
	[["aspects"], listAspects, "displays all aspects in the game (even hidden ones)"],
	[["decks"], listDecks, "displays all decks and their contents in the save file."],
	// locked recipes?
	// shorthands for empty searches. see "search *" commands
	// remaining draws in decks. (RootPopulationCommand.DealersTable)
], "lists things in the game."];


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
