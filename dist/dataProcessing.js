import { isDebug } from "./config.js";
// TODO: maybe put these into nested objects? like save.verbs.get()?
// FIXME: replace all console.* calls with terminal calls
/* eslint-disable @typescript-eslint/naming-convention */
/* DATA */
const DATA_ITEMS = [];
const DATA_RECIPES = [];
const DATA_VERBS = [];
const DATA_DECKS = [];
const DATA_ASPECTS = new Set();
// Data Aspects
export function addAspects(aspects) {
    aspects.forEach(aspect => DATA_ASPECTS.add(aspect));
}
export function getAllAspects() {
    return [...DATA_ASPECTS.values()];
}
export function doesAspectExist(aspectName) {
    return DATA_ASPECTS.has(aspectName);
}
// Data Verbs
export function setDataVerbs(verbs) {
    DATA_VERBS.length = 0;
    const names = new Set;
    for (const verb of verbs) {
        // skip spontaneous verbs as they don't fit the normal structure of verbs
        if (verb.spontaneous) {
            continue;
        }
        if (isDebug && names.has(verb.id)) {
            console.warn("dupe verb found: " + verb.id);
        }
        names.add(verb.id);
        DATA_VERBS.push(verb);
    }
}
export function getAllVerbs() {
    return [...DATA_VERBS];
}
// Data Recipes
export function setDataRecipes(recipes) {
    DATA_RECIPES.length = 0;
    const names = new Set;
    for (const recipe of recipes) {
        if (recipe.aspects) {
            Object.entries(recipe.aspects).forEach(aspect => DATA_ASPECTS.add(aspect[0]));
        }
        if (isDebug && names.has(recipe.id)) {
            console.warn("dupe recipe found: " + recipe.id);
        }
        names.add(recipe.id);
        DATA_RECIPES.push(recipe);
    }
}
export function getDataRecipes() {
    return [...DATA_RECIPES];
}
// Data Decks
export function setDataDecks(decks) {
    DATA_DECKS.length = 0;
    const names = new Set;
    for (const deck of decks) {
        if (isDebug && names.has(deck.id)) {
            console.warn("dupe deck found: " + deck.id);
        }
        names.add(deck.id);
        DATA_DECKS.push(deck);
    }
}
export function getDataDecks() {
    return [...DATA_DECKS];
}
// Data Items
export function setDataItems(items) {
    DATA_ITEMS.length = 0;
    const names = new Set;
    for (const item of items) {
        if (item.aspects) {
            Object.entries(item.aspects).forEach(aspect => DATA_ASPECTS.add(aspect[0]));
        }
        if (isDebug && names.has(item.id)) {
            console.warn("dupe item found: " + item.id);
        }
        names.add(item.id);
        DATA_ITEMS.push(item);
    }
}
export function getDataItems() {
    return [...DATA_ITEMS];
}
export function lookupItem(id) {
    const item = DATA_ITEMS.find((check) => check.id === id);
    if (!item) {
        return;
    }
    const aspects = mergeAspects(getDataItemAspects(id));
    return [item, aspects];
}
export function getDataItemAspects(id) {
    const results = [];
    const itemLookup = DATA_ITEMS.find((check) => check.id === id);
    if (!itemLookup) {
        console.warn(`item ${id} could not be found.`);
        return results;
    }
    results.push(itemLookup.aspects ?? {});
    if (itemLookup.inherits) {
        results.push(...getDataItemAspects(itemLookup.inherits));
    }
    return results;
}
// SAVE interaction
let SAVE_RAW;
const SAVE_ROOMS = [];
const SAVE_ITEMS = [];
const SAVE_RECIPES = new Set();
const SAVE_VERBS = new Set();
// const SAVE_INVENTORY: (saveTypes.elementStackCreationCommand & types.stackExtraInfo)[] = []; // TODO: stub
/* eslint-enable @typescript-eslint/naming-convention */
export function loadSave(save) {
    SAVE_RAW = save;
    setUnlockedRooms(getUnlockedRoomsFromSave(save));
    setSaveItems([getItemsFromSave(), getHand(save)].flat());
    setSaveVerbs(getVerbsFromSave());
    setSaveRecipes(save.charactercreationcommands.flatMap(character => character.ambittablerecipesunlocked));
}
function setUnlockedRooms(rooms) {
    SAVE_ROOMS.length = 0;
    rooms.forEach(room => {
        SAVE_ROOMS.push(room);
    });
}
function setSaveRecipes(recipes) {
    SAVE_RECIPES.clear();
    recipes.forEach(recipe => {
        if (isDebug && !DATA_RECIPES.some(dataRecipe => dataRecipe.id === recipe)) {
            console.warn(`recipe ${recipe} could not be found.`);
        }
        SAVE_RECIPES.add(recipe);
    });
}
function setSaveVerbs(verbs) {
    SAVE_VERBS.clear();
    verbs.forEach(verb => {
        if (isDebug && !DATA_VERBS.some(dataVerb => dataVerb.id === verb)) {
            console.warn(`verb ${verb} could not be found.`);
        }
        SAVE_VERBS.add(verb);
    });
}
function setSaveItems(items) {
    SAVE_ITEMS.length = 0;
    for (const item of items) {
        if (isDebug) {
            Object.entries(item.aspects).forEach(aspect => {
                if (!DATA_ASPECTS.has(aspect[0])) {
                    console.warn(`aspect ${aspect[0]} could not be found. aspect was listed in item ${item.entityid} - ${item.id}.`);
                }
            });
        }
        SAVE_ITEMS.push(item);
    }
}
function getHand(json) {
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
        const aspects = [payload.mutations, ...getDataItemAspects(payload.entityid)];
        const mergedAspects = mergeAspects(aspects);
        // remove typing
        delete mergedAspects["$type"];
        return Object.assign({}, payload, {
            aspects: new Map(Object.entries(mergedAspects)),
            room: "hand",
        });
    }));
    return cards;
}
function getUnlockedRoomsFromSave(json) {
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
    return SAVE_ROOMS.flatMap((room) => {
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
    return SAVE_ROOMS
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
            const items = container.tokens
                .map(token => token.payload)
                .filter((item) => item.$type === "elementstackcreationcommand");
            const itemIds = items.map(item => {
                const aspects = [item.mutations, ...getDataItemAspects(item.entityid)];
                const mergedAspects = mergeAspects(aspects);
                // remove typing
                delete mergedAspects["$type"];
                return Object.assign({}, item, {
                    aspects: new Map(Object.entries(mergedAspects)),
                    room: roomName,
                });
            });
            return itemIds;
        });
        return allItems;
    });
}
export function getSaveItems() {
    return [...SAVE_ITEMS];
}
export function getSaveRecipes() {
    return [...SAVE_RECIPES];
}
export function getSaveRaw() {
    return SAVE_RAW;
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
// search/find
export function findVerbs(options) {
    // code is unverified
    return DATA_VERBS.filter(verb => {
        if (!SAVE_VERBS.has(verb.id)) {
            return false;
        }
        const slots = verb.slots ?? (verb.slot !== undefined ? [verb.slot] : []);
        if (options.slotMeta) {
            if (options.slotMeta.minCount && options.slotMeta.minCount > slots.length) {
                return false;
            }
            if (options.slotMeta.maxCount && options.slotMeta.maxCount < slots.length) {
                return false;
            }
        }
        if (options.slots) {
            // FIXME: a slot can match multiple filters. it needs to be changed to do a 1:1 match.
            const validSlot = options.slots.find((oSlot) => {
                // are there any filters that don't match ANY verb slots
                const validMatch = slots.find((vSlot) => {
                    // for each check, check if the check fails. if so then move onto the next vSlot
                    if (oSlot.required?.some(check => vSlot.required?.[check] === undefined) ?? false) {
                        return false;
                    }
                    if (oSlot.essential?.some(check => vSlot.essential?.[check] === undefined) ?? false) {
                        return false;
                    }
                    if (oSlot.forbidden?.some(check => vSlot.forbidden?.[check] === undefined) ?? false) {
                        return false;
                    }
                    if (oSlot.missingRequired?.some(check => vSlot.required?.[check] !== undefined) ?? false) {
                        return false;
                    }
                    if (oSlot.missingEssential?.some(check => vSlot.essential?.[check] !== undefined) ?? false) {
                        return false;
                    }
                    if (oSlot.missingForbidden?.some(check => vSlot.forbidden?.[check] !== undefined) ?? false) {
                        return false;
                    }
                    return true;
                });
                // return true if we couldn't find a valid match
                return validMatch === undefined;
            });
            if (validSlot === undefined) {
                return false;
            }
        }
        return true;
    });
}
export function findItems(options) {
    // FIXME: doesn't work?
    const regexValid = options.nameValid ? new RegExp(options.nameValid) : undefined;
    const regexInvalid = options.nameInvalid ? new RegExp(options.nameInvalid) : undefined;
    return SAVE_ITEMS.filter(item => {
        for (const [aspect, amount] of Object.entries(options.min ?? {})) {
            const aspectCount = item.aspects.get(aspect);
            if (aspectCount === undefined || aspectCount < amount) {
                return false;
            }
        }
        for (const [aspect, amount] of Object.entries(options.max ?? {})) {
            const aspectCount = item.aspects.get(aspect);
            if (aspectCount !== undefined && aspectCount > amount) {
                return false;
            }
        }
        if (options.any &&
            Object.entries(options.any).length > 0 &&
            !Object.entries(options.any).some(([aspect, amount]) => {
                const aspectCount = item.aspects.get(aspect);
                return !(aspectCount === undefined || aspectCount < amount);
            })) {
            return false;
        }
        if (regexValid && !regexValid.test(item.entityid)) {
            return false;
        }
        if (regexInvalid?.test(item.entityid)) {
            return false;
        }
        return true;
    });
}
export function findRecipes(options) {
    // code is unverified
    return [...SAVE_RECIPES]
        .map(recipeName => DATA_RECIPES.find(dataRecipe => dataRecipe.id === recipeName))
        .map((recipe) => {
        if (!recipe) {
            return undefined;
        }
        if (options.reqs) {
            if (options.reqs.min) {
                for (const [aspect, amount] of Object.entries(options.reqs.min)) {
                    const aspectCount = recipe.reqs?.[aspect];
                    if (aspectCount === undefined || aspectCount < amount) {
                        return undefined;
                    }
                }
            }
            if (options.reqs.max) {
                for (const [aspect, amount] of Object.entries(options.reqs.max)) {
                    const aspectCount = recipe.reqs?.[aspect];
                    if (aspectCount !== undefined && aspectCount > amount) {
                        return undefined;
                    }
                }
            }
        }
        // FIXME: what do we do for deck effects?
        const recipeOutputId = Object.entries(recipe.effects ?? {})[0]?.[0];
        if (options.output && !recipeOutputId) {
            return undefined;
        }
        const outputLookup = mergeAspects(getDataItemAspects(recipeOutputId));
        if (options.output) {
            if (options.output.min) {
                for (const [aspect, amount] of Object.entries(options.output.min)) {
                    const aspectCount = outputLookup[aspect];
                    if (aspectCount === undefined || aspectCount < amount) {
                        return undefined;
                    }
                }
            }
            if (options.output.max) {
                for (const [aspect, amount] of Object.entries(options.output.max)) {
                    const aspectCount = outputLookup[aspect];
                    if (aspectCount === undefined || aspectCount < amount) {
                        return undefined;
                    }
                }
            }
        }
        return [recipe, outputLookup];
    })
        .filter(recipe => recipe !== undefined);
}
