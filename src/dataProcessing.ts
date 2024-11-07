import type * as types from "./types.js";

import {debug} from "./config.js";

// FIXME: replace all console.* calls with terminal calls

const DATA_ITEMS: types.dataItem[] = [];
const DATA_RECIPES: types.dataRecipe[] = [];
const DATA_VERBS: types.dataVerb[] = [];
const DATA_DECKS: types.dataDeck[] = [];
const DATA_ASPECTS = new Set<string>();

let SAVE_RAW: types.saveData|undefined;
const SAVE_ROOMS: types.saveRoom[] = [];
const SAVE_ITEMS: types.foundItems[] = [];
const SAVE_RECIPES = new Set<string>();
const SAVE_VERBS = new Set<string>();
// const SAVE_INVENTORY: types.foundItems[] = []; // TODO: stub


function setUnlockedRooms(rooms:types.saveRoom[]): void {
	SAVE_ROOMS.length = 0;
	rooms.forEach(room=>{
		SAVE_ROOMS.push(room);
	});
}
function setSaveRecipes(recipes:string[]): void {
	SAVE_RECIPES.clear();
	recipes.forEach(recipe=>{
		if(debug && !DATA_RECIPES.some(dataRecipe=>dataRecipe.id===recipe)){
			console.warn(`recipe ${recipe} could not be found.`);
		}
		SAVE_RECIPES.add(recipe);
	});
}
function setSaveVerbs(verbs:string[]): void {
	SAVE_VERBS.clear();
	verbs.forEach(verb=>{
		if(debug && !DATA_VERBS.some(dataVerb=>dataVerb.id===verb)){
			console.warn(`verb ${verb} could not be found.`);
		}
		SAVE_VERBS.add(verb);
	});
}
function setSaveItems(items:types.foundItems[]):void{
	SAVE_ITEMS.length = 0;
	for(const item of items) {
		Object.entries(item.aspects).forEach(aspect=>DATA_ASPECTS.add(aspect[0]));
		SAVE_ITEMS.push(item);
	}
}
function getHand(json:types.saveData): types.foundItems[] {
	const getSphere = (id:string):types.saveRoom[]=>json.rootpopulationcommand.spheres.find(
		(sphere):boolean=>sphere.governingspherespec.id===id
	)?.tokens ?? [];
	const cards = [
		getSphere("hand.abilities"),
		getSphere("hand.skills"),
		getSphere("hand.memories"),
		getSphere("hand.misc"),
	].flatMap(tokens=>tokens.map((token):types.foundItems=>{
		const aspects = [token.payload.mutations, ...grabAllAspects(token.payload.entityid)];
		const mergedAspects = mergeAspects(aspects);
		// remove typing
		delete mergedAspects["$type"];
		return {
			entityid:token.payload.entityid,
			aspects:mergedAspects,
			count:token.payload.quantity,
			room:"hand",
		}
	}));
	return cards;
}
function getUnlockedRoomsFromSave(json:types.saveData): types.saveRoom[] {
	// FIXME: can't keep track of parent relationships due to filtering arrays
	const library = json.rootpopulationcommand.spheres.find((sphere):boolean=>sphere.governingspherespec.id==="library")
	if(!library){return [];}
	// library.Tokens === _Rooms_
	// library.Tokens[number].Payload.IsSealed === _is not unlocked_
	// library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
	return library.tokens.filter((room):boolean=>!room.payload.issealed);
}
function getVerbsFromSave(): string[]{
	return SAVE_ROOMS.flatMap((room): string[]=>{
		// const roomX = room.location.localposition.x;
		// const roomY = room.location.localposition.y;
		// const roomName = room.payload.id;
		const itemDomain = room.payload.dominions.find((dominion):boolean=>dominion.identifier==="roomcontentsdominion");
		if(!itemDomain){return [];}
		const verbs = itemDomain.spheres.flatMap(
			// TODO: check if $type === "SituationCreationCommand" could be an easier way to find this
			sphere=>sphere.tokens.filter(token=>token.payload["$type"]==="situationcreationcommand")
		);
		return verbs.map(token=>token.payload.verbid);
	});
}
function getItemsFromSave(): types.foundItems[]{
	return SAVE_ROOMS.flatMap((room):types.foundItems[]=>{
		// const roomX = room.location.localposition.x;
		// const roomY = room.location.localposition.y;
		const roomName = room.payload.id;
		const itemDomain = room.payload.dominions.find((dominion):boolean=>dominion.identifier==="roomcontentsdominion");
		if(!itemDomain){return [];}
		// TODO: check if $type === "ElementStackCreationCommand" could be an easier way to find this
		const containers = itemDomain.spheres.filter((container):boolean=>{
			// FIXME: false negatives
			// the others are strange
			return ["bookshelf","wallart","things","comfort"].includes(container.governingspherespec.label);
		});
		const allItems = containers.flatMap((container):types.foundItems[]=>{
			const items = container.tokens
			const itemIds = items.map((item):types.foundItems=>{
				const aspects = [item.payload.mutations, ...grabAllAspects(item.payload.entityid)];
				const mergedAspects = mergeAspects(aspects);
				// remove typing
				delete mergedAspects["$type"];
				return {
					entityid: item.payload.entityid,
					aspects: mergedAspects,
					count: 1,
					// x: roomX + item.location.localposition.x,
					// y: roomY + item.location.localposition.y,
					room: roomName,
				};
			});
			return itemIds;
		})
		return allItems;
	});
}
// exports
export function lookupItem(id: string):[types.dataItem,types.aspects]|undefined {
	const item = DATA_ITEMS.find((check):boolean=>check.id===id);
	if(!item){return;}
	const aspects = mergeAspects(grabAllAspects(id));
	return [item,aspects];
}
export function loadSave(save:types.saveData): void {
	SAVE_RAW = save;
	setUnlockedRooms(getUnlockedRoomsFromSave(save));
	setSaveItems([getItemsFromSave(),getHand(save)].flat());
	setSaveVerbs(getVerbsFromSave());
	setSaveRecipes(save.charactercreationcommands.flatMap(
		character=>character.ambittablerecipesunlocked
	));
}
// getters
export function getAllAspects():string[] {
	return [...DATA_ASPECTS.values()];
}
export function getAllVerbs():types.dataVerb[] {
	return [...DATA_VERBS];
}
export function getSaveItems(): types.foundItems[]{
	return [...SAVE_ITEMS];
}
export function getSaveRecipes(): string[]{
	return [...SAVE_RECIPES];
}
export function getDataRecipes(): types.dataRecipe[]{
	return [...DATA_RECIPES];
}
export function getDataDecks(): types.dataDeck[]{
	return [...DATA_DECKS];
}
export function getSaveRaw(): types.saveData|undefined{
	return SAVE_RAW;
}
export function getDataItems(): types.dataItem[]{
	return [...DATA_ITEMS];
}
export function mergeAspects(aspects: types.aspects[]): types.aspects {
	// FIXME: overlaped aspects don't get merged
	return aspects.map(aspects=>Object.entries(aspects)).reduce((res:types.aspects,entries):types.aspects=>{
		for(const [aspect,count] of entries) {
			if(!res[aspect]){
				res[aspect] = 0;
			}
			res[aspect]+=count;
		}
		return res;
	},{})
}

export function grabAllAspects(id: string): types.aspects[] {
	const results: types.aspects[] = [];
	const itemLookup = DATA_ITEMS.find((check):boolean=>check.id===id);
	if(!itemLookup){
		console.warn(`item ${id} could not be found.`);
		return results;
	}
	results.push(itemLookup.aspects);
	if(itemLookup.inherits){
		results.push(...grabAllAspects(itemLookup.inherits));
	}
	return results;
}

export function setDataRecipes(recipes:types.dataRecipe[]):void{
	DATA_RECIPES.length = 0;
	const names = new Set<string>;
	for(const recipe of recipes) {
		Object.entries(recipe?.aspects??{}).forEach(aspect=>DATA_ASPECTS.add(aspect[0]));
		if(debug && names.has(recipe.id)){
			console.warn("dupe recipe found: "+recipe.id);
		}
		names.add(recipe.id);
		DATA_RECIPES.push(recipe);
	}
}
export function setDataVerbs(verbs:types.dataVerb[]):void{
	DATA_VERBS.length = 0;
	const names = new Set<string>;
	for(const verb of verbs) {
		// skip spontaneous verbs as they don't fit the normal structure of verbs
		if(verb.spontaneous){continue;}
		if(debug && names.has(verb.id)){
			console.warn("dupe verb found: "+verb.id);
		}
		names.add(verb.id);
		DATA_VERBS.push(verb);
	}
}
export function setDataDecks(decks:types.dataDeck[]):void{
	DATA_DECKS.length = 0;
	const names = new Set<string>;
	for(const deck of decks) {
		if(debug && names.has(deck.id)){
			console.warn("dupe deck found: "+deck.id);
		}
		names.add(deck.id);
		DATA_DECKS.push(deck);
	}
}
export function setDataItems(items:types.dataItem[]):void{
	DATA_ITEMS.length = 0;
	const names = new Set<string>;
	for(const item of items) {
		Object.entries(item.aspects).forEach(aspect=>DATA_ASPECTS.add(aspect[0]));
		if(debug && names.has(item.id)){
			console.warn("dupe item found: "+item.id);
		}
		names.add(item.id);
		DATA_ITEMS.push(item);
	}
}

// search/find

export function findVerbs(options:{
	slotMeta?:{
		minCount?: number;
		maxCount?: number;
	};
	slots?:{
		required?:string[];
		essential?:string[];
		forbidden?:string[];
		missingRequired?:string[];
		missingEssential?:string[];
		missingForbidden?:string[];
	}[];
}): types.dataVerb[] {
	// code is unverified
	return DATA_VERBS.filter(verb=>{
		if(!SAVE_VERBS.has(verb.id)){return false;}
		const slots = verb.slots ?? (verb.slot!==undefined?[verb.slot!]:[]);
		if(options.slotMeta){
			if(options.slotMeta.minCount && options.slotMeta.minCount > slots.length){return false;}
			if(options.slotMeta.maxCount && options.slotMeta.maxCount < slots.length){return false;}
		}
		if(options.slots){
			// FIXME: a slot can match multiple filters. it needs to be changed to do a 1:1 match.
			const validSlot = options.slots.find((oSlot):boolean=>{
				// are there any filters that don't match ANY verb slots
				const validMatch = slots.find((vSlot):boolean=>{
					// for each check, check if the check fails. if so then move onto the next vSlot
					if(oSlot.required?.some(check=>vSlot.required?.[check]===undefined)??false){return false;}
					if(oSlot.essential?.some(check=>vSlot.essential?.[check]===undefined)??false){return false;}
					if(oSlot.forbidden?.some(check=>vSlot.forbidden?.[check]===undefined)??false){return false;}
					if(oSlot.missingRequired?.some(check=>vSlot.required?.[check]!==undefined)??false){return false;}
					if(oSlot.missingEssential?.some(check=>vSlot.essential?.[check]!==undefined)??false){return false;}
					if(oSlot.missingForbidden?.some(check=>vSlot.forbidden?.[check]!==undefined)??false){return false;}
					return true;
				})
				// return true if we couldn't find a valid match
				return validMatch===undefined;
			})
			if(validSlot===undefined){return false;}
		}
		return true;
	});
}
export function findItems(options:types.itemSearchOptions): types.foundItems[] {
	const regexValid = options.nameValid? new RegExp(options.nameValid) : undefined;
	const regexInvalid = options.nameInvalid? new RegExp(options.nameInvalid) : undefined;
	return SAVE_ITEMS.filter(item=>{
		for (const [aspect, amount] of Object.entries(options.min??{})) {
			const aspectCount = item.aspects[aspect];
			if(aspectCount===undefined || aspectCount < amount){return false;}
		}
		for (const [aspect, amount] of Object.entries(options.max??{})) {
			const aspectCount = item.aspects[aspect];
			if(aspectCount!==undefined && aspectCount > amount){return false;}
		}
		if (
			options.any &&
			Object.entries(options.any).length>0 &&
			!Object.entries(options.any).some(([aspect, amount]):boolean=>{
				const aspectCount = item.aspects[aspect];
				return !(aspectCount===undefined || aspectCount < amount);
			})
		) {return false;}
		if(regexValid && !regexValid.test(item.entityid)){return false;}
		if(regexInvalid && regexInvalid.test(item.entityid)){return false;}
		return true;
	});
}
export function findRecipes(options:{
	reqs?: {
		min?: types.aspects;
		max?: types.aspects;
	}
	output?: {
		min?: types.aspects;
		max?: types.aspects;
	}
}): [types.dataRecipe,types.aspects][] {
	// code is unverified
	return [...SAVE_RECIPES]
		.map(recipeName=>DATA_RECIPES.find(dataRecipe=>dataRecipe.id===recipeName))
		.map((recipe):[types.dataRecipe,types.aspects]|undefined=>{
			if(!recipe){return undefined;}
			if(options.reqs) {
				if(options.reqs.min) {
					for (const [aspect, amount] of Object.entries(options.reqs.min)) {
						const aspectCount = recipe.reqs[aspect];
						if(aspectCount===undefined || aspectCount < amount){return undefined;}
					}
				}
				if(options.reqs.max) {
					for (const [aspect, amount] of Object.entries(options.reqs.max)) {
						const aspectCount = recipe.reqs[aspect];
						if(aspectCount!==undefined && aspectCount > amount){return undefined;}
					}
				}
			}
			// FIXME: what do we do for deck effects?
			const recipeOutputId = Object.entries(recipe.effects??{})?.[0]?.[0];
			if(options.output && !recipeOutputId){return undefined;}
			const outputLookup = mergeAspects(grabAllAspects(recipeOutputId));
			if(options.output){
				if(options.output.min) {
					for (const [aspect, amount] of Object.entries(options.output.min)) {
						const aspectCount = outputLookup[aspect];
						if(aspectCount===undefined || aspectCount < amount){return undefined;}
					}
				}
				if(options.output.max) {
					for (const [aspect, amount] of Object.entries(options.output.max)) {
						const aspectCount = outputLookup[aspect];
						if(aspectCount===undefined || aspectCount < amount){return undefined;}
					}
				}
			}
			return [recipe,outputLookup];
		})
		.filter(recipe=>recipe!==undefined);
}

//advanced
