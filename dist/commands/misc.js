import { jsonSpacing } from "../config.js";
import * as dataProcessing from "../dataProcessing.js";
const misc = [["misc"], [
        [["missingCraftable"], missingCraftable, "lists all known recipes & ALL gathering spots that create items you don't have."],
        [["availableMemories"], availableMemories, "shows all memories that can be obtained."],
    ], "things I couldn't categorize. CAN CONTAIN SPOILERS!"];
export async function missingCraftable(term, parts) {
    // input
    const options = JSON.parse(parts.join(" "));
    // TODO: input requesting if parts don't exist
    // processing
    const result = [];
    const SAVE_ITEMS = dataProcessing.getSaveItems();
    const DATA_ITEMS = dataProcessing.getDataItems();
    const SAVE_RECIPES = dataProcessing.getSaveRecipes();
    const DATA_RECIPES = dataProcessing.getDataRecipes();
    const DATA_DECKS = dataProcessing.getDataDecks();
    const SAVE_RAW = dataProcessing.getSaveRaw();
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
        const aspects = dataProcessing.mergeAspects(dataProcessing.grabAllAspects(item));
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
    const found = result
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
    // output
    for (const [name, items] of found) {
        const detail = options.detailed ? items.join(", ") : items.length.toString();
        term.cyan(`${name}`);
        term(`: ${detail}\n`);
    }
}
export async function availableMemories(term, parts) {
    const maxTargLen = 15;
    const genListOutput = (memories) => {
        for (const [memId, targs] of memories) {
            term(jsonSpacing);
            term.cyan(memId);
            if (targs.length <= maxTargLen) {
                term(": " + targs.join(", ") + "\n");
            }
            else {
                targs.length = maxTargLen;
                term(": " + targs.join(", ") + ", ");
                term.gray("...\n");
            }
        }
    };
    // input
    const options = JSON.parse(parts.join(" "));
    // TODO: input requesting if parts don't exist
    // processing
    const SAVE_ITEMS = dataProcessing.getSaveItems();
    const DATA_ITEMS = dataProcessing.getDataItems();
    const SAVE_RECIPES = dataProcessing.getSaveRecipes();
    const DATA_RECIPES = dataProcessing.getDataRecipes();
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
    const isValid = (itemId) => {
        const aspects = dataProcessing.mergeAspects(dataProcessing.grabAllAspects(itemId));
        if (!aspects["memory"]) {
            return false;
        }
        if (options.memFilter?.any !== undefined) {
            const filterEntries = Object.entries(options.memFilter.any);
            for (const [aspect, count] of filterEntries) {
                if ((aspects[aspect] ?? 0) < count) {
                    return false;
                }
            }
        }
        if ((options.memFilter?.ignoreObtained ?? false) === true) {
            const alreadyObtained = SAVE_ITEMS.find(item => item.entityid === itemId);
            if (alreadyObtained) {
                return false;
            }
        }
        return true;
    };
    const result = {};
    if (options.inputs?.includes("recipes")) {
        const foundRecipes = new Map();
        const recipes = DATA_RECIPES.filter(recipe => SAVE_RECIPES.includes(recipe.id));
        for (const recipe of recipes) {
            for (const [cardId, _count] of Object.entries(recipe.effects ?? {})) {
                if (isValid(cardId)) {
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
                    if (!isValid(info.id)) {
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
    // output
    if (result.recipes) {
        term.blue("Recipes");
        term(":\n");
        genListOutput(result.recipes);
    }
    if (result.itemsConsumableInspect) {
        term.blue("Consumables (Inspect)");
        term(":\n");
        genListOutput(result.itemsConsumableInspect);
    }
    if (result.itemsConsumableTalk) {
        term.blue("Consumables (Talk)");
        term(":\n");
        genListOutput(result.itemsConsumableTalk);
    }
    if (result.itemsReusableInspect) {
        term.blue("Reusables (Inspect)");
        term(":\n");
        genListOutput(result.itemsReusableInspect);
    }
    if (result.itemsReusableTalk) {
        term.blue("Reusables (Talk)");
        term(":\n");
        genListOutput(result.itemsReusableTalk);
    }
}
export default misc;
