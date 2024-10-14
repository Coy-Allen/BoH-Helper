import type terminalKit from "terminal-kit";


export type commandFunc = ((term:terminalKit.Terminal,args: string[])=>Promise<void>|void);
export type inputNode = [string,inputNode[]|commandFunc,string];


export type aspects = Record<string,number>;
export type cards = Record<string,number>;
export interface slot {
	id: string;
	label: string;
	required?: aspects;
	essential?: aspects;
	forbidden?: aspects;
}

export interface dataItem {
		id: string;
		uniquenessgroup: string;
		label: string;
		desc: string;
		inherits: string;
		audio: string;
		aspects: aspects;
		xtriggers: object;
		xexts: object;
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
	xtriggers?: Record<string,string>;
	maxnotes?: number;
	// spontaneous verbs are filtered out and will never be loaded
	spontaneous?: boolean; // default false
	multiple?: boolean // default false
}

export interface saveRoom {
	location: {
		$type: string,
		localposition: {
			$type: string;
			x: number;
			y: number;
			z: number;
			normalized?: unknown,
			magnitude: number;
			sqrmagnitude: number;
		},
		atspherepath: {
			$type: string;
			filter: null;
			path: string;
		}
	};
	payload: {
		id: string;
		issealed: boolean;
		isshrouded: boolean;
		dominions: {
			$type: string;
			identifier: string;
			spheres: {
				governingspherespec: {
					$type: string;
					label: string;
				};
				tokens: {
					location: {
						$type: string,
						localposition: {
							$type: string;
							x: number;
							y: number;
							z: number;
							normalized?: unknown,
							magnitude: number;
							sqrmagnitude: number;
						};
						atspherepath: {
							$type: string;
							filter: null;
							path: string;
						}
					},
					payload: {
						$type: string,
						mutations: aspects;
						entityid: string;
						verbid: string;
					}
				}[];
			}[];
		}[];
	}
}

export interface saveData {
	$type: string;
	charactercreationcommands: {
		$type: string
		name: string
		profession: string
		activelegacyid: string
		endingtriggeredid: unknown;
		datetimecreated: string;
		inprogresshistoryrecords: unknown;
		previouscharacterhistoryrecords: unknown;
		uniqueelementsmanifested: string[];
		ambittablerecipesunlocked: string[];
		createdinversion: unknown;
		currentfocus: unknown;
		currenthouses: unknown[];
	}[];
	rootpopulationcommand: {
		spheres: {
			governingspherespec: {
				$type: string;
				id: string;
				label: string;
			};
			tokens: saveRoom[];
		}[];
	};
	populatexamanekcommand: unknown;
	notificationcommands: unknown[];
	version: unknown;
	isfresh: boolean;
};
