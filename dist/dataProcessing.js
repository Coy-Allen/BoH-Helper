import { isDebug } from "./config.js";
// TODO: maybe put these into nested objects? like save.verbs.get()?
// FIXME: replace all console.* calls with terminal calls
class dataWrapper {
    _data;
    _keyFunc;
    constructor(keyFunc, data = []) {
        this._keyFunc = keyFunc;
        this._data = new Map();
        this.addAll(data);
        // data.map(item=>[keyFunc(item), item]);
    }
    overwrite(items) {
        this.clear();
        this.addAll(items);
    }
    clear() { this._data.clear(); }
    size() { return this._data.size; }
    get(key) { return this._data.get(key); }
    has(item) { return this.hasKey(this._keyFunc(item)); }
    hasKey(key) { return this._data.has(key); }
    hasValue(item) { return this.values().includes(item); }
    addAll(items) { items.forEach(item => this.add(item)); }
    add(item) {
        const key = this._keyFunc(item);
        const isPresent = this.hasKey(key);
        if (isDebug && isPresent) {
            console.warn("dupe found: " + key);
        }
        this._data.set(key, item);
        return isPresent;
    }
    some(filter) { return this.find(filter) !== undefined; }
    find(filter) { return this.values().find(filter); }
    findAll(filter) { return this.filter(filter); }
    filter(...filters) {
        return filters.reduce((values, filter) => values.filter(filter), this.values());
    }
    keys() { return [...this._data.keys()]; }
    values() { return [...this._data.values()]; }
}
class dataWrapperInherits extends dataWrapper {
    getInherited(key) {
        const result = [];
        let target = key;
        while (true) {
            const lookup = this.get(target);
            if (lookup === undefined) {
                break;
            }
            result.push(lookup);
            if (!lookup.inherits) {
                break;
            }
            target = lookup.inherits;
        }
        return result;
    }
    getInheritedProperty(key, property) {
        return this.getInherited(key)
            .map(obj => obj[property])
            .filter((prop) => prop !== undefined && prop !== null);
    }
}
/* DATA */
export const data = {
    elements: new dataWrapperInherits(item => item.id),
    recipes: new dataWrapperInherits(item => item.id),
    verbs: new dataWrapper(item => item.id),
    decks: new dataWrapper(item => item.id),
    aspects: new dataWrapper(item => item),
};
export const save = {
    raw: undefined,
    rooms: new dataWrapper(item => item.payload.id),
    elements: new dataWrapper(item => item.id),
    recipes: new dataWrapper(item => item),
    verbs: new dataWrapper(item => item),
};
export function loadSave(saveFile) {
    save.raw = saveFile;
    save.rooms.overwrite(getUnlockedRoomsFromSave(saveFile));
    save.elements.overwrite([getItemsFromSave(), getHand(saveFile)].flat());
    save.verbs.overwrite(getVerbsFromSave());
    save.recipes.overwrite(saveFile.charactercreationcommands.flatMap(character => character.ambittablerecipesunlocked));
}
function getHand(json) {
    // TODO: rewrite this
    const getSphere = (id) => json.rootpopulationcommand.spheres.find((sphere) => sphere.governingspherespec.id === id)?.tokens ?? [];
    const cards = [
        getSphere("hand.abilities"),
        getSphere("hand.skills"),
        getSphere("hand.memories"),
        getSphere("hand.misc"),
    ].flatMap(tokens => tokens
        .map(token => token.payload)
        .filter((payload) => payload.$type === "elementstackcreationcommand")
        .map(payload => {
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
function getUnlockedRoomsFromSave(json) {
    // TODO: rewrite this
    // FIXME: can't keep track of parent relationships due to filtering arrays
    const library = json.rootpopulationcommand.spheres.find((sphere) => sphere.governingspherespec.id === "library");
    if (!library) {
        return [];
    }
    // library.Tokens === _Rooms_
    // library.Tokens[number].Payload.IsSealed === _is not unlocked_
    // library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
    return library.tokens.filter((room) => {
        const payload = room.payload;
        if (payload.$type === "elementstackcreationcommand" ||
            payload.$type === "situationcreationcommand") {
            return false;
        }
        return !payload.issealed;
    });
}
function getVerbsFromSave() {
    // TODO: rewrite this
    return save.rooms.values().flatMap((room) => {
        // const roomX = room.location.localposition.x;
        // const roomY = room.location.localposition.y;
        // const roomName = room.payload.id;
        const itemDomain = room.payload.dominions.find((dominion) => dominion.identifier === "roomcontentsdominion");
        if (!itemDomain) {
            return [];
        }
        const verbs = itemDomain.spheres.flatMap(sphere => sphere.tokens
            .map(token => token.payload)
            .filter(payload => payload.$type === "situationcreationcommand"));
        return verbs.map(payload => payload.verbid);
    });
}
function getItemsFromSave() {
    // TODO: rewrite this
    return save.rooms.values()
        .flatMap(room => {
        // const roomX = room.location.localposition.x;
        // const roomY = room.location.localposition.y;
        const roomName = room.payload.id;
        const itemDomain = room.payload.dominions.find((dominion) => dominion.identifier === "roomcontentsdominion");
        if (!itemDomain) {
            return [];
        }
        // TODO: check if $type === "ElementStackCreationCommand" could be an easier way to find this
        const containers = itemDomain.spheres.filter((container) => {
            // FIXME: false negatives
            // the others are strange
            return ["bookshelf", "wallart", "things", "comfort"].includes(container.governingspherespec.label);
        });
        // FIXME: filter out non stack items
        const allItems = containers.flatMap(container => {
            // TODO: move this to saveElementExtentionMerging
            const items = container.tokens
                .map(token => token.payload)
                .filter((item) => item.$type === "elementstackcreationcommand");
            const itemIds = items.map(item => {
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
export function mergeAspects(aspects) {
    return aspects
        .map(aspect => Object.entries(aspect))
        .reduce((res, entries) => {
        for (const [aspect, count] of entries) {
            if (!res[aspect]) {
                res[aspect] = 0;
            }
            res[aspect] += count;
        }
        return res;
    }, {});
}
/*

// search/find

function findVerbs(options: {
    slotMeta?: {
        minCount?: number;
        maxCount?: number;
    };
    slots?: {
        required?: string[];
        essential?: string[];
        forbidden?: string[];
        missingRequired?: string[];
        missingEssential?: string[];
        missingForbidden?: string[];
    }[];
}): types.dataVerb[] {
    // code is unverified
    return data.verbs.filter(verb=>{
        if (!save.verbs.has(verb.id)) {return false;}
        const slots = verb.slots ?? (verb.slot!==undefined?[verb.slot]:[]);
        if (options.slotMeta) {
            if (options.slotMeta.minCount && options.slotMeta.minCount > slots.length) {return false;}
            if (options.slotMeta.maxCount && options.slotMeta.maxCount < slots.length) {return false;}
        }
        if (options.slots) {
            // FIXME: a slot can match multiple filters. it needs to be changed to do a 1:1 match.
            const validSlot = options.slots.find((oSlot): boolean=>{
                // are there any filters that don't match ANY verb slots
                const validMatch = slots.find((vSlot): boolean=>{
                    // for each check, check if the check fails. if so then move onto the next vSlot
                    if (oSlot.required?.some(check=>vSlot.required?.[check]===undefined)??false) {return false;}
                    if (oSlot.essential?.some(check=>vSlot.essential?.[check]===undefined)??false) {return false;}
                    if (oSlot.forbidden?.some(check=>vSlot.forbidden?.[check]===undefined)??false) {return false;}
                    if (oSlot.missingRequired?.some(check=>vSlot.required?.[check]!==undefined)??false) {return false;}
                    if (oSlot.missingEssential?.some(check=>vSlot.essential?.[check]!==undefined)??false) {return false;}
                    if (oSlot.missingForbidden?.some(check=>vSlot.forbidden?.[check]!==undefined)??false) {return false;}
                    return true;
                });
                // return true if we couldn't find a valid match
                return validMatch===undefined;
            });
            if (validSlot===undefined) {return false;}
        }
        return true;
    });
}

function findRecipes(options: {
    reqs?: {
        min?: types.aspects;
        max?: types.aspects;
    };
    output?: {
        min?: types.aspects;
        max?: types.aspects;
    };
}): [types.dataRecipe, types.aspects][] {
    // code is unverified
    return save.recipes.values()
        .map(recipeName=>data.recipes.find(dataRecipe=>dataRecipe.id===recipeName))
        .map((recipe): [types.dataRecipe, types.aspects]|undefined=>{
            if (!recipe) {return undefined;}
            if (options.reqs) {
                if (options.reqs.min) {
                    for (const [aspect, amount] of Object.entries(options.reqs.min)) {
                        const aspectCount = recipe.reqs?.[aspect];
                        if (aspectCount===undefined || aspectCount < amount) {return undefined;}
                    }
                }
                if (options.reqs.max) {
                    for (const [aspect, amount] of Object.entries(options.reqs.max)) {
                        const aspectCount = recipe.reqs?.[aspect];
                        if (aspectCount!==undefined && aspectCount > amount) {return undefined;}
                    }
                }
            }
            // FIXME: what do we do for deck effects?
            const recipeOutputId = Object.entries(recipe.effects??{})[0]?.[0];
            if (options.output && !recipeOutputId) {return undefined;}
            const outputLookup = mergeAspects(getDataItemAspects(recipeOutputId));
            if (options.output) {
                if (options.output.min) {
                    for (const [aspect, amount] of Object.entries(options.output.min)) {
                        const aspectCount = outputLookup[aspect] as undefined|number;
                        if (aspectCount===undefined || aspectCount < amount) {return undefined;}
                    }
                }
                if (options.output.max) {
                    for (const [aspect, amount] of Object.entries(options.output.max)) {
                        const aspectCount = outputLookup[aspect] as undefined|number;
                        if (aspectCount===undefined || aspectCount < amount) {return undefined;}
                    }
                }
            }
            return [recipe, outputLookup];
        })
        .filter(recipe=>recipe!==undefined);
}
*/
// filters
export const filterBuilders = {
    aspectFilter: (options, aspectFunc) => {
        return (item) => {
            const aspects = aspectFunc(item);
            for (const [aspect, amount] of Object.entries(options.min ?? {})) {
                const aspectCount = aspects[aspect];
                if (aspectCount === undefined || aspectCount < amount) {
                    return false;
                }
            }
            for (const [aspect, amount] of Object.entries(options.max ?? {})) {
                const aspectCount = aspects[aspect];
                if (aspectCount !== undefined && aspectCount > amount) {
                    return false;
                }
            }
            if (options.any &&
                Object.entries(options.any).length > 0 &&
                !Object.entries(options.any).some(([aspect, amount]) => {
                    const aspectCount = aspects[aspect];
                    return !(aspectCount === undefined || aspectCount < amount);
                })) {
                return false;
            }
            return false;
        };
    },
    /*
        basicItemFilter: (options: types.itemSearchOptions): ((item: element) => boolean) => {
            return (item: element): boolean => {
                if (options.nameInvalid?.test(item.entityid)) {return false;}
                if (options.nameValid && !options.nameValid.test(item.entityid)) {return false;}
                return aspectFilter(options, item.aspects);
            };
        },
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
