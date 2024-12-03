type dictionaryStringInt =
	{"$type": "system.collections.generic.dictionary`2[[system.string, mscorlib],[system.int32, mscorlib]], mscorlib"} &
	Record<string, number>;
interface dictionaryStringString {
	"$type": "system.collections.generic.dictionary`2[[system.string, mscorlib],[system.string, mscorlib]], mscorlib";
	[key: string]: string;
}
type aspectsDictionary =
	{"$type": "secrethistories.core.aspectsdictionary, secrethistories.main"} &
	Record<string, number>;

export interface persistedGameState {
	"$type": "persistedgamestate";
	charactercreationcommands: characterCreationCommand[];
	rootpopulationcommand: rootPopulationCommand;
	populatexamanekcommand: populateXamanekCommand;
	notificationcommands: []; // TODO: save file does not have an example
	version: versionNumber;
	isfresh: boolean;
}
interface versionNumber {
	"$type": "secrethistories.entities.versionnumber, secrethistories.main";
	version: string;
}
interface enviroFxCommand {
	"$type": "secrethistories.commands.envirofxcommand, secrethistories.main";
	concern: string;
	effect: string;
	parameter: string;
	getfullfx: string;
}
interface populateXamanekCommand {
	"$type": "populatexamanekcommand";
	currentitineraries:
		{"$type": "system.collections.generic.dictionary`2[[system.string, mscorlib],[secrethistories.assets.scripts.application.tokens.travelitineraries.tokenitinerary, secrethistories.main]], mscorlib"} &
		Record<string, tokenItinerary>;
	currentenvirofxcommands:
		{"$type": "system.collections.generic.dictionary`2[[system.string, mscorlib],[secrethistories.commands.envirofxcommand, secrethistories.main]], mscorlib"} &
		Record<string, enviroFxCommand>;
	currentsphereblocks: []; // TODO: save file does not have an example
}
interface characterCreationCommand {
	"$type": "charactercreationcommand";
	name: string;
	profession: string;
	activelegacyid: string;
	endingtriggeredid: null; // TODO: save file does not have an example
	datetimecreated: string;
	inprogresshistoryrecords: dictionaryStringString;
	previouscharacterhistoryrecords: dictionaryStringString;
	uniqueelementsmanifested: string[];
	ambittablerecipesunlocked: string[];
	createdinversion: versionNumber;
	currentfocus: focus;
	currenthouses: []; // TODO: save file does not have an example
}
interface focus {
	"$type": "secrethistories.entities.focus, secrethistories.main";
	x: number;
	y: number;
	z: number;
}
interface rootPopulationCommand {
	"$type": "rootpopulationcommand";
	mutations: dictionaryStringInt;
	spheres: sphereCreationCommand[];
	dealerstable: populateDominionCommand;
	tokensatarbitrarypaths: []; // TODO: save file does not have an example
}
interface populateDominionCommand {
	"$type": "populatedominioncommand";
	identifier: string;
	spheres: sphereCreationCommand[];
}
interface sphereCreationCommand {
	"$type": "spherecreationcommand";
	ownersphereidentifier: null; // TODO: save file does not have an example
	governingspherespec: sphereSpec;
	tokens: tokenCreationCommand[];
	shrouded: boolean;
	persistentspheredata: null|uIHandSphereData;
	illuminations: dictionaryStringString;
}
interface sphereSpec {
	"$type": "secrethistories.entities.spherespec, secrethistories.main";
	label: string;
	actionid: string;
	description: string;
	availablefromhouse: string;
	essential: aspectsDictionary;
	required: aspectsDictionary;
	forbidden: aspectsDictionary;
	ifaspectspresent: dictionaryStringString;
	greedy: boolean;
	angels: []; // TODO: save file does not have an example
	frompath: fucinePath;
	enroutespherepath: fucinePath;
	windowsspherepath: fucinePath;
	spheretype: string;
	allowanytoken: boolean;
	id: string;
	lever: string;
}
// TODO: stub. save file does not have an example
type tokenItinerary = Record<string, unknown>;
export interface tokenCreationCommand {
	"$type": "tokencreationcommand";
	location: tokenLocation;
	homelocation: null|tokenLocation;
	payload: elementStackCreationCommand|situationCreationCommand|populateNxCommand|populateTerrainFeatureCommand;
	placementalreadychronicled: boolean;
	defunct: boolean;
	currentstate: droppedInSphereState|travelledToSphere;
}
interface fucinePath {
	"$type": "secrethistories.fucine.fucinepath, secrethistories.main";
	filter: null; // TODO: save file does not have an example
	path: string;
}
interface vector3 {
	"$type": "unityengine.vector3, unityengine.coremodule";
	x: number;
	y: number;
	z: number;
	normalized?: vector3;
	magnitude: number;
	sqrMagnitude: number;
}
interface tokenLocation {
	"$type": "secrethistories.ui.tokenlocation, secrethistories.main";
	localposition: vector3;
	atspherepath: fucinePath;
}
interface travelledToSphere {
	"$type": "secrethistories.states.tokenstates.travelledtosphere, secrethistories.main";
	// TODO: stub. save file does not have an example
}
interface droppedInSphereState {
	"$type": "secrethistories.states.tokenstates.droppedinspherestate, secrethistories.main";
	// TODO: stub. save file does not have an example
}
interface uIHandSphereData {
	"$type": "secrethistories.spheres.uihandspheredata, secrethistories.main";
	defaultposition: number;
	currentposition: number;
}
export interface elementStackCreationCommand extends payloadTemplate {
	"$type": "elementstackcreationcommand";
	entityid: string;
	illuminations: dictionaryStringString;
	defunct: boolean;
	isshrouded: boolean;
	lifetimeremaining: number;
}
export interface situationCreationCommand extends payloadTemplate {
	"$type": "situationcreationcommand";
	lastsituationcreated: null; // TODO: save file does not have an example
	verbid: string;
	outputpath: null; // TODO: save file does not have an example
	currentrecipeid: string;
	fallbackrecipeid: string;
	stateidentifier: number;
	timeremaining: number;
	isopen: boolean;
	hasghostnote: boolean;
	commandqueue: unknown[]; // TODO: save file does not have an example
}
export interface populateNxCommand extends payloadTemplate {
	"$type": "populatenxcommand";
	outcomemessage: string;
	isshrouded: boolean;
	issealed: boolean;
	isopen: boolean;
	lockedinrecipe: nullRecipe;
	lastrunrecipe: nullRecipe;
}
export interface populateTerrainFeatureCommand extends payloadTemplate {
	"$type": "populateterrainfeaturecommand";
	edensenacted: string[];
	issealed: boolean;
	isshrouded: boolean;
	haspreviouslyunshrouded: boolean;
}
interface payloadTemplate {
	"$type": string;
	id: string;
	dominions: populateDominionCommand[];
	quantity: number;
	mutations: dictionaryStringInt;
}
interface nullRecipe {
	"$type": "secrethistories.entities.nullrecipe, secrethistories.main";
	priority: number;
	actionid: string;
	blocks: boolean;
	reqs: dictionaryStringString;
	extantreqs: dictionaryStringString;
	greq: dictionaryStringString;
	ngreq: dictionaryStringString;
	fxreqs: dictionaryStringString;
	seeking: dictionaryStringString;
	effects: dictionaryStringString;
	xpans: dictionaryStringInt;
	fx: dictionaryStringString;
	aspects: aspectsDictionary;
	mutations: dictionaryStringInt;
	purge: dictionaryStringInt;
	haltverb: dictionaryStringInt;
	deleteverb: dictionaryStringInt;
	achievements: unknown[]; // TODO: save file does not have an example
	signalimportantloop: boolean;
	audiooneshot: null; // TODO: save file does not have an example
	signalendingflavour: number;
	craftable: boolean;
	notable: boolean;
	hintonly: boolean;
	ambittable: boolean;
	warmup: number;
	inherits: string;
	preface: string;
	startlabel: string;
	label: string;
	startdescription: string;
	desc: string;
	comments: string;
	deckeffects: dictionaryStringString;
	alt: unknown[]; // TODO: save file does not have an example
	lalt: unknown[]; // TODO: save file does not have an example
	inductions: unknown[]; // TODO: save file does not have an example
	linked: unknown[]; // TODO: save file does not have an example
	ending: string;
	icon: string;
	burnimage: null; // TODO: save file does not have an example
	run: string;
	preslots: unknown[]; // TODO: save file does not have an example
	slots: unknown[]; // TODO: save file does not have an example
	internaldeck: deckSpec;
	id: string;
	lever: string;
}
interface deckSpec {
	"$type": "secrethistories.entities.deckspec, secrethistories.main";
	defaultcard: string;
	resetonexhaustion: boolean;
	label: string;
	desc: string;
	cover: string;
	comments: string;
	ishidden: boolean;
	draws: number;
	spec: []; // TODO: save file does not have an example
	drawmessages: dictionaryStringString;
	defaultdrawmessages: dictionaryStringString;
	id: string;
	lever: string;
}
