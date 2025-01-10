import type terminalKit from "terminal-kit";

export type commandFunc = ((term: terminalKit.Terminal, args: string[]) => Promise<string>|string);
export type inputNode = [string[], inputNode[]|commandFunc, string];

export type aspects = Record<string, number>;
export type cards = Record<string, number>;
export interface slot {
	id: string;
	label: string;
	required?: aspects;
	essential?: aspects;
	forbidden?: aspects;
}

export interface itemSearchOptions {
	min?: aspects;
	any?: aspects;
	max?: aspects;
	nameValid?: string;
	nameInvalid?: string;
}

export interface stackExtraInfo {
	aspects: aspects; // Map<string, number>;
	room: string;
}

// game data
export interface dataSlot {
	id: string;
	label?: string;
	actionid: string;
	required?: aspects;
	description?: string;
	forbidden?: aspects;
	essential?: aspects;
	ifaspectspresent?: {skill: number};
}
export interface dataElement {
	id: string;
	uniquenessgroup?: string;
	label?: string;
	desc?: string;
	inherits?: string;
	audio?: string;
	aspects?: aspects;
	isaspect?: boolean;
	icon?: string;
	ambits?: aspects;
	ishidden?: boolean;
	unique?: boolean;
	slots?: dataSlot[];
	lifetime?: number;
	noartneeded?: boolean;
	metafictional?: boolean;
	reverseambittablesdisplay?: boolean;
	manifestationtype?: string;
	comments?: string;
	sort?: string;
	imms?: {
		reqs: aspects;
		effects: {inspired: 1}|{rank: "tally"};
	}[];
	commute?: string[];
	decayto?: string;
	resaturate?: boolean;
	verbicon?: string;
	achievements?: string[];
	alphalabeloverride?: string;
	// xtriggers: if [key] is present in this item's aspects:
		// if [value] is string: treat it like a basic transform.
		// if [morpheffect] = "spawn": create item with entityId=[id].
		// if [morpheffect] = "mutate": edit the aspects on this item.
			// if [additive] = true: add the specified level instead of replacing the original level.
		// if [morpheffect] = "transform": turn this into the item with entityId=[id].
	xtriggers?: Record<string, string|{
		id: string;
		morpheffect: string;
		level: string;
		additive?: boolean;
	}[]>;
	// xexts: if [key] exists as an aspect on the item, then show text [value].
	xexts?: Record<string, string>;
}
export interface dataRecipe {
	id: string;
	actionid?: string;
	label?: string;
	startdescription?: string;
	desc?: string;
	reqs?: aspects;
	effects?: cards;
	deckeffects?: cards;
	aspects?: aspects;
	linked?:	{
		id: string;
	}[];
	warmup?: number;
	craftable?: boolean; // set to false for "hint" recipes. these are not real recipes and are filtered out.
	mutations?: {
		filter: string;
		mutate: string;
		level: number;
		additive?: boolean;
	}[];
	xpans?: aspects; // MAYBE the card that shows up for .2 seconds when the cards transform into new cards
	fx?: Record<string, string|number>; // sound effects. string can be "set"
	hintonly?: boolean;
	achievements?: string;
	ending?: string;
	extantreqs?: aspects; // MAYBE extra requirements. (seasons, time)
	comments?: string;
	ambittable?: boolean;
	purge?: aspects; // MAYBE will remove these aspects/cards from the recipe
	inherits?: string;
	alt?: {id: string}[];
	slots?: dataSlot[];
	internaldeck?: {
		spec: string[];
		draws: number;
		defaultcard: string[];
		resetonexhaustion: boolean;
	};
	audiooneshot?: string;
	notable?: boolean;
	ngreq?: aspects;
	greq?: aspects;
	startlabel?: string;
	icon?: string;
	blocks?: boolean;

	preface?: string;
	preslots?: dataSlot[];
	lalt?: string;
	run?: string;
	fxreqs?: Record<string, string>; // MAYBE extra requirements for sound effects? (weather, season)
}
export interface dataVerb {

	id: string;
	label: string;
	icon?: string;
	desc?: string;
	maxnotes?: number;
	multiple?: boolean;
	category?: string;
	xtriggers?: Record<string, string>;
	slots?: slot[];
	slot?: slot;
	aspects?: aspects;
	ambits?: boolean; // default false
	audio?: string;
	hints?: string[];
	comments?: string;
	// spontaneous verbs are filtered out and will never be fully loaded.
	spontaneous?: boolean;
}
export interface dataDeck {
	id: string;
	label: string;
	resetonexhaustion: boolean;
	spec: string[];
	desc?: string;
	defaultcard?: string;
}
