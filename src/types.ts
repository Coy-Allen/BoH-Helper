import type terminalKit from "terminal-kit";


export type commandFunc = ((term: terminalKit.Terminal, args: string[]) => Promise<undefined|string>|undefined|string);
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

export interface dataSlot {
	// TODO: stub
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
	slots?: dataSlot;
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
	// if [key] exists as an aspect when item is used in a verb, then add [value] as an aspect to the item.
	xtriggers?: Record<string, string|Record<"id"|"morpheffect"|"level", string>[]>;
	// if [key] exists as an aspect on the item, then show text [value].
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
	craftable?: boolean;

	mutations?: unknown;
	xpans?: unknown;
	fx?: unknown;
	hintonly?: unknown;
	achievements?: unknown;
	ending?: unknown;
	extantreqs?: unknown;
	comments?: unknown;
	ambittable?: unknown;
	purge?: unknown;
	inherits?: unknown;
	alt?: unknown;
	slots?: unknown;
	internaldeck?: unknown;
	audiooneshot?: unknown;
	notable?: unknown;
	ngreq?: unknown;
	greq?: unknown;
	startlabel?: unknown;
	icon?: unknown;
	blocks?: unknown;
	preface?: unknown;
	preslots?: unknown;
	lalt?: unknown;
	run?: unknown;
	fxreqs?: unknown;
}


export interface stackExtraInfo {
	aspects: Map<string, number>;
	room: string;
}
/*
export interface foundItems {
	entityid: string;
	aspects: aspects;
	count: number;
	room: string;
	// x: number;
	// y: number;
}
export interface dataRecipe {
	id: string;
	actionid: string;
	label: string;
	startdescription: string;
	desc: string;
	reqs: aspects;
	effects?: cards;
	deckeffects?: cards;
	aspects?: aspects;
	linked:	{
		id: string;
	}[];
	warmup: number;
	craftable: boolean;
}
*/

export interface dataDeck {
	id: string;
	label: string;
	resetonexhaustion: boolean;
	spec: string[];
}

export interface dataVerb {
	id: string;
	category: string;
	label: string;
	desc: string;
	audio: string;
	slot?: slot;
	slots?: slot[];
	comments?: string;
	hints?: string[];
	aspects?: aspects;
	ambits?: boolean; // default false
	xtriggers?: Record<string, string>;
	maxnotes?: number;
	// spontaneous verbs are filtered out and will never be loaded
	spontaneous?: boolean; // default false
	multiple?: boolean; // default false
}
