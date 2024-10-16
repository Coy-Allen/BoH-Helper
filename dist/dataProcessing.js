// FIXME: replace all console.* calls with terminal calls
const DATA_ITEMS = [];
const DATA_RECIPES = [];
const DATA_VERBS = [];
const DATA_DECKS = [];
const DATA_ASPECTS = new Set();
let SAVE_RAW;
const SAVE_ROOMS = [];
const SAVE_ITEMS = [];
const SAVE_RECIPES = new Set();
const SAVE_VERBS = new Set();
function setUnlockedRooms(rooms) {
    SAVE_ROOMS.length = 0;
    rooms.forEach(room => {
        SAVE_ROOMS.push(room);
    });
}
function setSaveRecipes(recipes) {
    SAVE_RECIPES.clear();
    recipes.forEach(recipe => {
        if (!DATA_RECIPES.some(dataRecipe => dataRecipe.id === recipe)) {
            console.warn(`recipe ${recipe} could not be found.`);
        }
        SAVE_RECIPES.add(recipe);
    });
}
function setSaveVerbs(verbs) {
    SAVE_VERBS.clear();
    verbs.forEach(verb => {
        if (!DATA_VERBS.some(dataVerb => dataVerb.id === verb)) {
            console.warn(`verb ${verb} could not be found.`);
        }
        SAVE_VERBS.add(verb);
    });
}
function setSaveItems(items) {
    SAVE_ITEMS.length = 0;
    for (const item of items) {
        Object.entries(item.aspects).forEach(aspect => DATA_ASPECTS.add(aspect[0]));
        SAVE_ITEMS.push(item);
    }
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
    return library.tokens.filter((room) => !room.payload.issealed);
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
        const verbs = itemDomain.spheres.flatMap(
        // TODO: check if $type === "SituationCreationCommand" could be an easier way to find this
        sphere => sphere.tokens.filter(token => token.payload["$type"] === "situationcreationcommand"));
        return verbs.map(token => token.payload.verbid);
    });
}
function getItemsFromSave() {
    return SAVE_ROOMS.flatMap((room) => {
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
        const allItems = containers.flatMap((container) => {
            const items = container.tokens;
            const itemIds = items.map((item) => {
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
        });
        return allItems;
    });
}
function mergeAspects(aspects) {
    // FIXME: overlaped aspects don't get merged
    return aspects.map(aspects => Object.entries(aspects)).reduce((res, entries) => {
        for (const [aspect, count] of entries) {
            if (!res[aspect]) {
                res[aspect] = 0;
            }
            res[aspect] += count;
        }
        return res;
    }, {});
}
function grabAllAspects(id) {
    const results = [];
    const itemLookup = DATA_ITEMS.find((check) => check.id === id);
    if (!itemLookup) {
        console.warn(`item ${id} could not be found.`);
        return results;
    }
    results.push(itemLookup.aspects);
    if (itemLookup.inherits) {
        results.push(...grabAllAspects(itemLookup.inherits));
    }
    return results;
}
// exports
export function lookupItem(id) {
    const item = DATA_ITEMS.find((check) => check.id === id);
    if (!item) {
        return;
    }
    const aspects = mergeAspects(grabAllAspects(id));
    return [item, aspects];
}
export function loadSave(save) {
    SAVE_RAW = save;
    setUnlockedRooms(getUnlockedRoomsFromSave(save));
    setSaveItems(getItemsFromSave());
    setSaveVerbs(getVerbsFromSave());
    setSaveRecipes(save.charactercreationcommands.flatMap(character => character.ambittablerecipesunlocked));
}
export function getAllAspects() {
    return [...DATA_ASPECTS.values()];
}
export function setDataRecipes(recipes) {
    DATA_RECIPES.length = 0;
    const names = new Set;
    for (const recipe of recipes) {
        Object.entries(recipe?.aspects ?? {}).forEach(aspect => DATA_ASPECTS.add(aspect[0]));
        if (names.has(recipe.id)) {
            console.warn("dupe recipe found: " + recipe.id);
        }
        names.add(recipe.id);
        DATA_RECIPES.push(recipe);
    }
}
export function setDataVerbs(verbs) {
    DATA_VERBS.length = 0;
    const names = new Set;
    for (const verb of verbs) {
        // skip spontaneous verbs as they don't fit the normal structure of verbs
        if (verb.spontaneous) {
            continue;
        }
        if (names.has(verb.id)) {
            console.warn("dupe verb found: " + verb.id);
        }
        names.add(verb.id);
        DATA_VERBS.push(verb);
    }
}
export function setDataDecks(decks) {
    DATA_DECKS.length = 0;
    const names = new Set;
    for (const deck of decks) {
        if (names.has(deck.id)) {
            console.warn("dupe deck found: " + deck.id);
        }
        names.add(deck.id);
        DATA_DECKS.push(deck);
    }
}
export function setDataItems(items) {
    DATA_ITEMS.length = 0;
    const names = new Set;
    for (const item of items) {
        Object.entries(item.aspects).forEach(aspect => DATA_ASPECTS.add(aspect[0]));
        if (names.has(item.id)) {
            console.warn("dupe item found: " + item.id);
        }
        names.add(item.id);
        DATA_ITEMS.push(item);
    }
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
        console.log(`${verb.id}: ${JSON.stringify(slots)}`);
        return true;
    });
}
export function findItems(options) {
    const regexValid = options.nameValid ? new RegExp(options.nameValid) : undefined;
    const regexInvalid = options.nameInvalid ? new RegExp(options.nameInvalid) : undefined;
    return SAVE_ITEMS.filter(item => {
        for (const [aspect, amount] of Object.entries(options.min ?? {})) {
            const aspectCount = item.aspects[aspect];
            if (aspectCount === undefined || aspectCount < amount) {
                return false;
            }
        }
        for (const [aspect, amount] of Object.entries(options.max ?? {})) {
            const aspectCount = item.aspects[aspect];
            if (aspectCount !== undefined && aspectCount > amount) {
                return false;
            }
        }
        if (options.any &&
            Object.entries(options.any).length > 0 &&
            !Object.entries(options.any).some(([aspect, amount]) => {
                const aspectCount = item.aspects[aspect];
                return !(aspectCount === undefined || aspectCount < amount);
            })) {
            return false;
        }
        if (regexValid && !regexValid.test(item.entityid)) {
            return false;
        }
        if (regexInvalid && regexInvalid.test(item.entityid)) {
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
                    const aspectCount = recipe.reqs[aspect];
                    if (aspectCount === undefined || aspectCount < amount) {
                        return undefined;
                    }
                }
            }
            if (options.reqs.max) {
                for (const [aspect, amount] of Object.entries(options.reqs.max)) {
                    const aspectCount = recipe.reqs[aspect];
                    if (aspectCount !== undefined && aspectCount > amount) {
                        return undefined;
                    }
                }
            }
        }
        // FIXME: what do we do for deck effects?
        const recipeOutputId = Object.entries(recipe.effects ?? {})?.[0]?.[0];
        if (options.output && !recipeOutputId) {
            return undefined;
        }
        const outputLookup = mergeAspects(grabAllAspects(recipeOutputId));
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
export function availiableMemories(options) {
    const appendToMap = (map, key, value) => {
        if (!map.has(key)) {
            map.set(key, []);
        }
        const array = map.get(key);
        if (!array) {
            return;
        }
        array.push(value);
    };
    const result = {};
    if (options.inputs?.includes("recipes")) {
        const foundRecipes = new Map();
        const recipes = DATA_RECIPES.filter(recipe => SAVE_RECIPES.has(recipe.id));
        for (const recipe of recipes) {
            for (const [cardId, _count] of Object.entries(recipe.effects ?? {})) {
                const aspects = mergeAspects(grabAllAspects(cardId));
                if (aspects["memory"]) {
                    appendToMap(foundRecipes, cardId, recipe.id);
                }
            }
        }
        if (foundRecipes.size > 0) {
            result.recipes = [...foundRecipes.entries()];
        }
    }
    // FIXME: items are broken
    if (options.inputs?.includes("itemsReusable") ||
        options.inputs?.includes("itemsConsumable") ||
        options.inputs?.includes("books")) {
        const foundReusableInspect = new Map();
        const foundReusableTalk = new Map();
        const foundConsumableInspect = new Map();
        const foundConsumableTalk = new Map();
        const items = [...new Set(SAVE_ITEMS.map(item => item.entityid))]
            .map(itemId => DATA_ITEMS.find(itemData => itemData.id === itemId))
            .filter(itemData => itemData !== undefined);
        for (const item of items) {
            for (const [type, infoArr] of Object.entries(item.xtriggers)) {
                for (const info of infoArr) {
                    if (info.morpheffect !== "spawn") {
                        continue;
                    }
                    if (!mergeAspects(grabAllAspects(info.id))["memory"]) {
                        continue;
                    }
                    // ignore books if asked
                    if (/^reading\./.test(type)) {
                        if (options.inputs?.includes("books")) {
                            // FIXME: filter out non-mastered books
                            appendToMap(foundReusableInspect, info.id, item.id);
                        }
                        continue;
                    }
                    // FIXME: can't figure out what determines if something gets "used up"
                    // TEMP: just treat them as the same for now.
                    if (!options.inputs?.includes("itemsReusable") &&
                        !options.inputs?.includes("itemsConsumable")) {
                        continue;
                    }
                    if (type === "dist") {
                        appendToMap(foundConsumableTalk, info.id, item.id);
                        continue;
                    }
                    if (type === "scrutiny") {
                        appendToMap(foundConsumableInspect, info.id, item.id);
                        continue;
                    }
                }
            }
        }
        if (foundReusableInspect.size > 0) {
            result.itemsReusableInspect = [...foundReusableInspect.entries()];
        }
        if (foundReusableTalk.size > 0) {
            result.itemsReusableTalk = [...foundReusableTalk.entries()];
        }
        if (foundConsumableInspect.size > 0) {
            result.itemsConsumableInspect = [...foundConsumableInspect.entries()];
        }
        if (foundConsumableTalk.size > 0) {
            result.itemsConsumableTalk = [...foundConsumableTalk.entries()];
        }
    }
    // TODO: filter out wrong aspected memories
    // TODO: filter out already obtained
    return result;
}
export function missingCraftable(options) {
    const result = [];
    const saveItems = new Map();
    for (const saveItem of SAVE_ITEMS) {
        saveItems.set(saveItem.entityid, (saveItems.get(saveItem.entityid) ?? 0) + (saveItem.count ?? 1));
    }
    for (const recipe of SAVE_RECIPES) {
        const recipeData = DATA_RECIPES.find(recipeInfo => recipeInfo.id === recipe);
        if (!recipeData) {
            console.warn(`recipe ${recipe} could not be found.`);
            continue;
        }
        const effects = recipeData.effects;
        if (effects) {
            result.push([recipeData.id, Object.keys(effects)]);
        }
    }
    ;
    for (const deck of DATA_DECKS) {
        // we don't want ALL decks... maybe? might make this an optional filter. filters out all non-gather decks
        if ([
            "sweetbones.employables",
            "incidents",
            "incidents.numa",
            "numa.possibility",
            "d.books.dawn",
            "d.books.solar",
            "d.books.baronial",
            "d.books.curia",
            "d.books.nocturnal",
            "d.books.divers",
            "d.challenges.opportunities",
        ].includes(deck.id)) {
            continue;
        }
        result.push([deck.id, deck.spec]);
    }
    ;
    const uniqueItemsSave = SAVE_RAW?.charactercreationcommands[0].uniqueelementsmanifested ?? [];
    const allItems = new Set(result.flatMap(groups => groups[1]));
    const validItems = new Set([...allItems.values()].filter(item => {
        const foundItem = DATA_ITEMS.find(itemData => itemData.id === item);
        if (!foundItem) {
            console.warn(`item ${foundItem} could not be found.`);
            // keep it by default
            return false;
        }
        const aspects = mergeAspects(grabAllAspects(item));
        if (aspects["memory"] || aspects["correspondence"] || aspects["invitation"]) {
            return false;
        }
        // if item exists in library
        const countOwned = saveItems.get(item);
        if ((countOwned ?? 0) > (options.maxOwned ?? 0)) {
            return false;
        }
        // if it's unique value already exists
        if (uniqueItemsSave.includes(item)) {
            return false;
        }
        return true;
    }));
    return result
        .map(([name, items]) => {
        const uniqueItems = new Set(items);
        return [name, [...uniqueItems.values()].filter(item => validItems.has(item))];
    })
        .filter(target => {
        if (target[1].length === 0) {
            return false;
        }
        return true;
    });
}
