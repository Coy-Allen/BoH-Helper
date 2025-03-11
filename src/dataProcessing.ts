import type * as types from "./types.ts";
import type * as saveTypes from "./saveTypes.ts";

import {config} from "./config.ts";

export type element = saveTypes.elementStackCreationCommand & types.stackExtraInfo;

// TODO: replace all console.* calls with terminal calls

class dataWrapper<t> {
	private _data;
	private _keyFunc;
	constructor(keyFunc: (item: t) => string, data: t[] = []) {
		this._keyFunc = keyFunc;
		this._data = new Map<string, t>();
		this.addAll(data);
		// data.map(item=>[keyFunc(item), item]);
	}
	overwrite(items: t[]): void {
		this.clear();
		this.addAll(items);
	}
	clear(): void {this._data.clear();}
	size(): number {return this._data.size;}
	get(key: string): Readonly<t>|undefined {return this._data.get(key);}
	has(item: t): boolean {return this.hasKey(this._keyFunc(item));}
	hasKey(key: string): boolean {return this._data.has(key);}
	hasValue(item: t): boolean {return this.values().includes(item);}
	addAll(items: t[]): void {items.forEach(item=>this.add(item));}
	add(item: t): boolean {
		const key = this._keyFunc(item);
		const isPresent = this.hasKey(key);
		if (config.isDebug && isPresent) {
			console.warn("dupe found: "+key);
		}
		this._data.set(key, item);
		return isPresent;
	}
	map<u>(func: (item: t) => u): u[] {return this.values().map(func);}
	some(filter: (item: t) => boolean): boolean {return this.find(filter)!==undefined;}
	find(filter: (item: t) => boolean): Readonly<t>|undefined {return this.values().find(filter);}
	findAll(filter: (item: t) => boolean): Readonly<t>[] {return this.filter(filter);}
	filter(...filters: ((item: Readonly<t>) => boolean)[]): Readonly<t>[] {
		return filters.reduce((values, filter): t[]=>values.filter(filter), this.values());
	}
	keys(): string[] {return [...this._data.keys()];}
	values(): Readonly<t>[] {return [...this._data.values()];}
}
class dataWrapperInherits<t extends {inherits?: string}> extends dataWrapper<t> {
	getInherited(key: string): t[] {
		const result: t[] = [];
		let target = key;
		while (true) {
			const lookup = this.get(target);
			if (lookup===undefined) {break;}
			result.push(lookup);
			if (!lookup.inherits) {break;}
			target = lookup.inherits;
		}
		return result;
	}
	getInheritedProperty<u extends keyof t>(key: string, property: u): NonNullable<t[u]>[] {
		return this.getInherited(key)
			.map(obj=>obj[property])
			.filter((prop): prop is NonNullable<t[u]>=>prop!==undefined&&prop!==null);
	}
}

/* DATA */

export const data = {
	elements: new dataWrapperInherits<types.dataElement>(item=>item.id),
	recipes: new dataWrapperInherits<types.dataRecipe>(item=>item.id),
	verbs: new dataWrapper<types.dataVerb>(item=>item.id),
	decks: new dataWrapper<types.dataDeck>(item=>item.id),
	aspects: new dataWrapper<string>(item=>item),
};
export const save = {
	raw: undefined as saveTypes.persistedGameState|undefined,
	rooms: new dataWrapper<saveTypes.tokenCreationCommand>(item=>item.payload.id),
	roomsUnlockable: new dataWrapper<saveTypes.tokenCreationCommand>(item=>item.payload.id),
	elements: new dataWrapper<(element)>(item=>item.id),
	recipes: new dataWrapper<string>(item=>item),
	decks: new dataWrapper<[string, string[]]>(item=>item[0]),
	verbs: new dataWrapper<string>(item=>item),
};

export function loadSave(saveFile: saveTypes.persistedGameState): void {
	save.raw = saveFile;
	save.rooms.overwrite(getUnlockedRoomsFromSave(saveFile));
	save.roomsUnlockable.overwrite(getUnlockableRoomsFromSave(saveFile));
	save.elements.overwrite([getItemsFromSave(), getHand(saveFile)].flat());
	save.verbs.overwrite(getVerbsFromSave());
	save.decks.overwrite(getDecksFromSave(saveFile));
	save.recipes.overwrite(saveFile.charactercreationcommands.flatMap(
		character=>character.ambittablerecipesunlocked,
	));
}

function getHand(json: saveTypes.persistedGameState): (element)[] {
	// TODO: rewrite this
	const getSphere = (id: string): saveTypes.tokenCreationCommand[]=>json.rootpopulationcommand.spheres.find(
		(sphere): boolean=>sphere.governingspherespec.id===id,
	)?.tokens ?? [];
	const cards = [
		getSphere("hand.abilities"),
		getSphere("hand.skills"),
		getSphere("hand.memories"),
		getSphere("hand.misc"),
	].flatMap(tokens=>tokens
		.map(token=>token.payload)
		.filter((payload): payload is saveTypes.elementStackCreationCommand=>payload.$type === "elementstackcreationcommand")
		.map(payload=>{
			// TODO: move this to saveElementExtentionMerging
			const aspects = [payload.mutations, ...data.elements.getInheritedProperty(payload.entityid, "aspects")];
			const mergedAspects = mergeAspects(aspects);
			// remove typing
			delete mergedAspects["$type"];
			return Object.assign({}, payload, {
				aspects: mergedAspects,
				room: "hand",
			});
		}));
	return cards;
}
function getUnlockedRoomsFromSave(json: saveTypes.persistedGameState): saveTypes.tokenCreationCommand[] {
	// TODO: rewrite this
	// FIXME: can't keep track of parent relationships due to filtering arrays
	const library = json.rootpopulationcommand.spheres.find((sphere): boolean=>sphere.governingspherespec.id==="library");
	if (!library) {return [];}
	// library.Tokens === _Rooms_
	// library.Tokens[number].Payload.IsSealed === _is not unlocked_
	// library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
	return library.tokens.filter((room): boolean=>{
		const payload = room.payload;
		if (
			payload.$type === "elementstackcreationcommand" ||
			payload.$type === "situationcreationcommand"
		) {return false;}
		return !payload.issealed && !payload.isshrouded;
	});
}
function getUnlockableRoomsFromSave(json: saveTypes.persistedGameState): saveTypes.tokenCreationCommand[] {
	// TODO: rewrite this
	// FIXME: can't keep track of parent relationships due to filtering arrays
	const library = json.rootpopulationcommand.spheres.find((sphere): boolean=>sphere.governingspherespec.id==="library");
	if (!library) {return [];}
	// library.Tokens === _Rooms_
	// library.Tokens[number].Payload.IsSealed === _is not unlocked_
	// library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
	return library.tokens.filter((room): boolean=>{
		const payload = room.payload;
		if (
			payload.$type === "elementstackcreationcommand" ||
			payload.$type === "situationcreationcommand"
		) {return false;}
		return !payload.issealed && payload.isshrouded;
	});
}
function getVerbsFromSave(): string[] {
	// TODO: rewrite this
	return save.rooms.values().flatMap((room): string[]=>{
		// const roomX = room.location.localposition.x;
		// const roomY = room.location.localposition.y;
		// const roomName = room.payload.id;
		const itemDomain = room.payload.dominions.find((dominion): boolean=>dominion.identifier==="roomcontentsdominion");
		if (!itemDomain) {return [];}
		const verbs = itemDomain.spheres.flatMap(
			sphere=>sphere.tokens
				.map(token=>token.payload)
				.filter(payload=>payload.$type==="situationcreationcommand"),
		);
		return verbs.map(payload=>payload.verbid);
	});
}
function getDecksFromSave(json: saveTypes.persistedGameState): [string, string[]][] {
	return json.rootpopulationcommand.dealerstable.spheres.map(deckData=>{
		const name = deckData.governingspherespec.actionid;
		const cards = deckData.tokens.map(card=>{
			if (card.payload.$type !== "elementstackcreationcommand") {return undefined;}
			return card.payload.entityid;
		}).filter(card=>card!==undefined);
		return [name, cards];
	});
}
function getItemsFromSave(): (element)[] {
	// TODO: rewrite this
	return save.rooms.values()
		.flatMap(room=>{
			// const roomX = room.location.localposition.x;
			// const roomY = room.location.localposition.y;
			const roomName = room.payload.id;
			const itemDomain = room.payload.dominions.find((dominion): boolean=>dominion.identifier==="roomcontentsdominion");
			if (!itemDomain) {return [];}
			// TODO: check if $type === "ElementStackCreationCommand" could be an easier way to find this
			const containers = itemDomain.spheres.filter((container): boolean=>{
				// FIXME: false negatives
				// the others are strange
				return (
					["bookshelf", "wallart", "things", "comfort"].includes(container.governingspherespec.label) &&
					!container.shrouded
				);
			});
			// FIXME: filter out non stack items
			const allItems = containers.flatMap(container=>{
				// TODO: move this to saveElementExtentionMerging
				const items = container.tokens
					.map(token=>token.payload)
					.filter((item): item is saveTypes.elementStackCreationCommand=>item.$type === "elementstackcreationcommand");
				const itemIds = items.map(item=>{
					const aspects = [item.mutations, ...data.elements.getInheritedProperty(item.entityid, "aspects")];
					const mergedAspects = mergeAspects(aspects);
					// remove typing
					delete mergedAspects["$type"];
					return Object.assign({}, item, {
						aspects: mergedAspects,
						room: roomName,
					});
				});
				return itemIds;
			});
			return allItems;
		});
}
// utility

export function mergeAspects(aspects: types.aspects[]): types.aspects {
	return aspects
		.map(aspect=>Object.entries(aspect))
		.reduce((res: types.aspects, entries): types.aspects=>{
			for (const [aspect, count] of entries) {
				if (!res[aspect]) {
					res[aspect] = 0;
				}
				res[aspect]+=count;
			}
			return res;
		}, {});
}

// filters

export const filterBuilders = {
	aspectFilter: <t>(
		options: {
			min?: types.aspects;
			any?: types.aspects;
			max?: types.aspects;
		},
		aspectFunc: (item: t) => types.aspects,
	): ((item: t) => boolean) => {
		return (item: t): boolean=>{
			const aspects = aspectFunc(item);
			for (const [aspect, amount] of Object.entries(options.min??{})) {
				const aspectCount = aspects[aspect] as number|undefined;
				if (aspectCount===undefined || aspectCount < amount) {return false;}
			}
			for (const [aspect, amount] of Object.entries(options.max??{})) {
				const aspectCount = aspects[aspect] as number|undefined;
				if (aspectCount!==undefined && aspectCount > amount) {return false;}
			}
			if (
				options.any &&
				Object.entries(options.any).length>0 &&
				!Object.entries(options.any).some(([aspect, amount]): boolean=>{
					const aspectCount = aspects[aspect] as number|undefined;
					return !(aspectCount===undefined || aspectCount < amount);
				})
			) {return false;}
			return true;
		};
	},
	saveItemFilter: (options: types.itemSearchOptions): ((item: element) => boolean) => {
		const aspectFilter = filterBuilders.aspectFilter(options, (aspects: types.aspects): types.aspects=>aspects);
		const nameInvalid = options.nameInvalid ? new RegExp(options.nameInvalid) : undefined;
		const nameValid = options.nameValid ? new RegExp(options.nameValid) : undefined;
		return (item: element): boolean => {
			if (nameInvalid?.test(item.entityid)) {return false;}
			if (nameValid && !nameValid.test(item.entityid)) {return false;}
			const dataAspects = data.elements.getInheritedProperty(item.entityid, "aspects");
			return aspectFilter(mergeAspects([item.aspects, ...dataAspects]));
		};
	},
	dataItemFilter: (options: types.itemSearchOptions): ((itemId: string) => boolean) => {
		const aspectFilter = filterBuilders.aspectFilter(options, (aspects: types.aspects): types.aspects=>aspects);
		const nameInvalid = options.nameInvalid ? new RegExp(options.nameInvalid) : undefined;
		const nameValid = options.nameValid ? new RegExp(options.nameValid) : undefined;
		return (itemId: string): boolean => {
			if (nameInvalid?.test(itemId)) {return false;}
			if (nameValid && !nameValid.test(itemId)) {return false;}
			return aspectFilter(mergeAspects(data.elements.getInheritedProperty(itemId, "aspects")));
		};
	},
/*
	basicRecipeFilter: (options: types.itemSearchOptions): ((item: types.dataRecipe) => boolean) => {
		return (item: types.dataRecipe): boolean => {
			if (options.nameInvalid?.test(item.id)) {return false;}
			if (options.nameValid && !options.nameValid.test(item.id)) {return false;}
			return aspectFilter(options, item.reqs??{});
		};
	},
};
*/
};

/* eslint-disable @typescript-eslint/naming-convention */
export const filterPresets = new Map<string, types.itemSearchOptions>([
	["unreadBooks", {
		any: {
			"mystery.lantern": 1,
			"mystery.forge": 1,
			"mystery.edge": 1,
			"mystery.winter": 1,
			"mystery.heart": 1,
			"mystery.grail": 1,
			"mystery.moth": 1,
			"mystery.knock": 1,
			"mystery.sky": 1,
			"mystery.moon": 1,
			"mystery.nectar": 1,
			"mystery.scale": 1,
			"mystery.rose": 1,
		},
		max: {
			"mastery.lantern": 0,
			"mastery.forge": 0,
			"mastery.edge": 0,
			"mastery.winter": 0,
			"mastery.heart": 0,
			"mastery.grail": 0,
			"mastery.moth": 0,
			"mastery.knock": 0,
			"mastery.sky": 0,
			"mastery.moon": 0,
			"mastery.nectar": 0,
			"mastery.scale": 0,
			"mastery.rose": 0,
		},
	}],
	["cursedBooks", {
		any: {
			"contamination.actinic": 1,
			"contamination.bloodlines": 1,
			"contamination.chionic": 1,
			"contamination.curse.fifth.eye": 1,
			"contamination.keeperskin": 1,
			"contamination.sthenic.taint": 1,
			"contamination.winkwell": 1,
			"contamination.witchworms": 1,
		},
	}],
]);
/* eslint-enable @typescript-eslint/naming-convention */
