
export type aspects = Record<string,number>;
export type cards = Record<string,number>;

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
	x: number;
	y: number;
}

export interface dataRecipe {
	id: string;
	actionid: string;
	label: string;
	startdescription: string;
	desc: string;
	reqs: aspects;
	effects: cards;
	aspects?: aspects;
	linked:	{
		id: string;
	}[];
	warmup: number;
	craftable: boolean;
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
									mutations: aspects;
									entityid: string;
								}
							}[];
						}[];
					}[];
				}
			}[];
		}[];
	};
	populatexamanekcommand: unknown;
	notificationcommands: unknown[];
	version: unknown;
	isfresh: boolean;
};
