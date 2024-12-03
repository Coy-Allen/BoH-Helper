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

// FIXME: not correct
export interface dataItem {
		id: string;
		uniquenessgroup?: undefined | string;
		label: string;
		desc?: undefined | string;
		inherits?: undefined | string;
		audio?: undefined | string;
		aspects?: undefined | aspects;
		xtriggers?: undefined | Record<string, {
			id: string;
			morpheffect: string;
			level?: undefined | number;
		}[]>;
		xexts?: undefined | object;
		isaspect?: boolean;
}


export interface stackExtraInfo {
	aspects: Map<string, number>;
	room: string;
}

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
