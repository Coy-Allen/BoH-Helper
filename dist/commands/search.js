import { getItemSearchOptions, getAspects, getStrArray, getNum, getArray } from "../commandHelpers.js";
import { findVerbs, findItems, findRecipes, getAllAspects } from "../dataProcessing.js";
import { jsonSpacing } from "../config.js";
const search = [["search"], [
        [["verbs"], searchVerbs, "search found popups and their card inputs."],
        // locked rooms
        [["items"], searchItems, "search owned items and their aspects."],
        [["itemCounts"], searchItemCounts, "list owned item counts."], // counts of items in house
        [["recipes"], searchRecipes, "search discovered (non-???) recipes and their outputs."],
    ], "finds unlocked things in your save file. load your save file 1st."];
export async function searchVerbs(term, parts) {
    const strArrayOptions = { min: 0, autocomplete: getAllAspects(), autocompleteDelimiter: "\\." };
    // TODO: move "parts" into a custom input handler
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const args = parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        {
            slotMeta: {
                minCount: await getNum(term, "min slot count", { min: 0, default: 1 }),
                maxCount: await getNum(term, "max slot count", { min: 0, default: 256 }),
            },
            slots: await getArray(term, "slots", async () => ({
                required: await getStrArray(term, jsonSpacing + "in required", strArrayOptions),
                essential: await getStrArray(term, jsonSpacing + "in essential", strArrayOptions),
                forbidden: await getStrArray(term, jsonSpacing + "in forbidden", strArrayOptions),
                missingRequired: await getStrArray(term, jsonSpacing + "not in required", strArrayOptions),
                missingEssential: await getStrArray(term, jsonSpacing + "not in essential", strArrayOptions),
                missingForbidden: await getStrArray(term, jsonSpacing + "not in forbidden", strArrayOptions),
            })),
        };
    const result = findVerbs(args);
    term(`res: ${result.length}\n`);
}
export async function searchItems(term, parts) {
    // TODO: move "parts" into a custom input handler
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arg = parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        await getItemSearchOptions(term);
    const result = findItems(arg);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
    if (parts.length === 0) {
        return JSON.stringify(arg);
    }
    return;
}
export async function searchItemCounts(term, parts) {
    // TODO: move "parts" into a custom input handler
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arg = parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        await getItemSearchOptions(term);
    const counts = new Map();
    findItems(arg).forEach(item => {
        counts.set(item.entityid, (counts.get(item.entityid) ?? 0) + 1);
    });
    term([...counts.entries()]
        .sort(([_a, countA], [_b, countB]) => countA - countB)
        .map(([name, count]) => `${name}: ${count}\n`)
        .join(""));
    if (parts.length === 0) {
        return JSON.stringify(arg);
    }
    return;
}
export async function searchRecipes(term, parts) {
    // TODO: move "parts" into a custom input handler
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arg = parts.length !== 0 ?
        JSON.parse(parts.join(" ")) :
        {
            reqs: {
                min: await getAspects(term, "Min input"),
                max: await getAspects(term, "Max input"),
            },
            output: {
                min: await getAspects(term, "Min output"),
                max: await getAspects(term, "Max output"),
            },
        };
    const result = findRecipes(arg).map(recipe => [recipe[0].reqs, recipe[1]]);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
    if (parts.length === 0) {
        return JSON.stringify(arg);
    }
    return;
}
export default search;
