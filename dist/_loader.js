const DATA_ITEMS = [];
const DATA_RECIPES = [];
const DATA_ASPECTS = new Set();
const SAVE_ITEMS = [];
const SAVE_RECIPES = new Set();
function setSaveRecipes(recipes) {
    SAVE_RECIPES.clear();
    recipes.forEach(recipe => {
        if (!DATA_RECIPES.some(dataRecipe => dataRecipe.id === recipe)) {
            console.warn(`recipe ${recipe} could not be found.`);
        }
        SAVE_RECIPES.add(recipe);
    });
}
function setSaveItems(items) {
    SAVE_ITEMS.length = 0;
    for (const item of items) {
        Object.entries(item.aspects).forEach(aspect => DATA_ASPECTS.add(aspect[0]));
        SAVE_ITEMS.push(item);
    }
}
function getItemsFromSave(json) {
    // FIXME: can't keep track of parent relationships due to filtering arrays
    const library = json.rootpopulationcommand.spheres.find((sphere) => sphere.governingspherespec.id === "library");
    if (!library) {
        return [];
    }
    // library.Tokens === _Rooms_
    // library.Tokens[number].Payload.IsSealed === _is not unlocked_
    // library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
    const unlockedRooms = library.tokens.filter((room) => !room.payload.issealed);
    return unlockedRooms.flatMap((room) => {
        const roomX = room.location.localposition.x;
        const roomY = room.location.localposition.y;
        const roomName = room.payload.id;
        const itemDomain = room.payload.dominions.find((dominion) => dominion.identifier === "roomcontentsdominion");
        if (!itemDomain) {
            return [];
        }
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
        });
        return allItems;
    });
}
function mergeAspects(aspects) {
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
    setSaveItems(getItemsFromSave(save));
    setSaveRecipes(save.charactercreationcommands.flatMap(character => character.ambittablerecipesunlocked));
}
export function getAllAspects() {
    return DATA_ASPECTS.values();
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
export function findItems(min = {}, max = {}) {
    return SAVE_ITEMS.filter(item => {
        for (const [aspect, amount] of Object.entries(min)) {
            const aspectCount = item.aspects[aspect];
            if (aspectCount === undefined || aspectCount < amount) {
                return false;
            }
        }
        for (const [aspect, amount] of Object.entries(max)) {
            const aspectCount = item.aspects[aspect];
            if (aspectCount !== undefined && aspectCount > amount) {
                return false;
            }
        }
        return true;
    });
}
export function findRecipes(options) {
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
        const recipeOutputId = Object.entries(recipe.effects)?.[0]?.[0];
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
