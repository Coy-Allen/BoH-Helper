
import type * as types from "./types.js";

const DATA_ITEMS: types.dataItem[] = [];
const DATA_RECIPES: types.dataRecipe[] = [];
const DATA_ASPECTS = new Set<string>();

const SAVE_ITEMS: types.foundItems[] = [];
const SAVE_RECIPES = new Set<string>();
function setSaveRecipes(recipes:string[]): void {
	SAVE_RECIPES.clear();
	recipes.forEach(recipe=>{
		if(!DATA_RECIPES.some(dataRecipe=>dataRecipe.id===recipe)){
			console.warn(`recipe ${recipe} could not be found.`);
		}
		SAVE_RECIPES.add(recipe);
	});
}
function setSaveItems(items:types.foundItems[]):void{
	SAVE_ITEMS.length = 0;
	for(const item of items) {
		Object.entries(item.aspects).forEach(aspect=>DATA_ASPECTS.add(aspect[0]));
		SAVE_ITEMS.push(item);
	}
}
function getItemsFromSave(json:types.saveData): types.foundItems[]{
	// FIXME: can't keep track of parent relationships due to filtering arrays
	const library = json.rootpopulationcommand.spheres.find((sphere):boolean=>sphere.governingspherespec.id==="library")
	if(!library){return [];}
	// library.Tokens === _Rooms_
	// library.Tokens[number].Payload.IsSealed === _is not unlocked_
	// library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
	const unlockedRooms = library.tokens.filter((room):boolean=>!room.payload.issealed)
	return unlockedRooms.flatMap((room):types.foundItems[]=>{
		const roomX = room.location.localposition.x;
		const roomY = room.location.localposition.y;
		const roomName = room.payload.id;
		const itemDomain = room.payload.dominions.find((dominion):boolean=>dominion.identifier==="roomcontentsdominion");
		if(!itemDomain){return [];}
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
				// FIXME: overlaped aspects don't get merged
				// remove typing
				delete mergedAspects["$type"];
				return {
					entityid: item.payload.entityid,
					aspects: mergedAspects,
					count: 1,
					x: roomX + item.location.localposition.x,
					y: roomY + item.location.localposition.y,
					room: roomName,
				};
			});
			return itemIds;
		})
		return allItems;
	});
}
function mergeAspects(aspects: types.aspects[]): types.aspects {
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

function grabAllAspects(id: string): types.aspects[] {
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

// exports
export function lookupItem(id: string):[types.dataItem,types.aspects]|undefined {
	const item = DATA_ITEMS.find((check):boolean=>check.id===id);
	if(!item){return;}
	const aspects = mergeAspects(grabAllAspects(id));
	return [item,aspects];
}
export function loadSave(save:types.saveData): void {
	setSaveItems(getItemsFromSave(save));
	setSaveRecipes(save.charactercreationcommands.flatMap(
		character=>character.ambittablerecipesunlocked
	));
}
export function getAllAspects():SetIterator<string> {
	return DATA_ASPECTS.values();
}
export function setDataRecipes(recipes:types.dataRecipe[]):void{
	DATA_RECIPES.length = 0;
	const names = new Set<string>;
	for(const recipe of recipes) {
		Object.entries(recipe?.aspects??{}).forEach(aspect=>DATA_ASPECTS.add(aspect[0]));
		if(names.has(recipe.id)){
			console.warn("dupe recipe found: "+recipe.id);
		}
		names.add(recipe.id);
		DATA_RECIPES.push(recipe);
	}
}
export function setDataItems(items:types.dataItem[]):void{
	DATA_ITEMS.length = 0;
	const names = new Set<string>;
	for(const item of items) {
		Object.entries(item.aspects).forEach(aspect=>DATA_ASPECTS.add(aspect[0]));
		if(names.has(item.id)){
			console.warn("dupe item found: "+item.id);
		}
		names.add(item.id);
		DATA_ITEMS.push(item);
	}
}
export function findItems(min: types.aspects={}, max: types.aspects={}): types.foundItems[] {
	return SAVE_ITEMS.filter(item=>{
		for (const [aspect, amount] of Object.entries(min)) {
			const aspectCount = item.aspects[aspect];
			if(aspectCount===undefined || aspectCount < amount){return false;}
		}
		for (const [aspect, amount] of Object.entries(max)) {
			const aspectCount = item.aspects[aspect];
			if(aspectCount!==undefined && aspectCount > amount){return false;}
		}
		return true;
	})
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
			const recipeOutputId = Object.entries(recipe.effects)?.[0]?.[0];
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
