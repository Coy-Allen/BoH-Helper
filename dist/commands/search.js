import { aspectTarget, itemFilter, validateOrGetInput } from "../commandHelpers.js";
import { findVerbs, findItems, findRecipes } from "../dataProcessing.js";
import { jsonSpacing } from "../config.js";
import * as dataVis from "../dataVisualizationFormatting.js";
const search = [["search"], [
        [["verbs"], searchVerbs, "search found popups and their card inputs."],
        // locked rooms
        [["items"], searchItems, "search owned items and their aspects."],
        [["itemPresets"], searchItemPresets, "search owned items using preset filters."],
        [["recipes"], searchRecipes, "search discovered (non-???) recipes and their outputs."],
    ], "finds unlocked things in your save file. load your save file 1st."];
async function searchVerbs(term, parts) {
    const args = await validateOrGetInput(term, parts.join(" "), {
        id: "object",
        name: "options",
        options: {},
        subType: [
            ["slotMin", false, {
                    id: "integer",
                    name: "min slots",
                    options: {
                        min: 0,
                    },
                }],
            ["slotMax", false, {
                    id: "integer",
                    name: "max slots",
                    options: {
                        min: 0,
                    },
                }],
            ["slots", false, {
                    id: "array",
                    name: "slots",
                    options: {},
                    subType: {
                        id: "object",
                        name: "slot",
                        options: {},
                        subType: [
                            ["required", false, aspectTarget],
                            ["essential", false, aspectTarget],
                            ["forbidden", false, aspectTarget],
                            ["missingRequired", false, aspectTarget],
                            ["missingEssential", false, aspectTarget],
                            ["missingForbidden", false, aspectTarget],
                        ],
                    },
                }],
        ],
    });
    const result = findVerbs(args);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
}
async function searchItems(term, parts) {
    const args = await validateOrGetInput(term, parts.join(" "), {
        id: "object",
        name: "options",
        options: {},
        subType: [
            ["filter", true, itemFilter],
            ["output", true, {
                    id: "string",
                    name: "output format",
                    options: {
                        autocomplete: [...dataVis.itemDisplaySelection],
                        default: "full",
                        strict: true,
                    },
                }],
        ],
    });
    const items = findItems(args.filter);
    dataVis.displayItemList(term, items, args.output);
    if (parts.length === 0) {
        return JSON.stringify(args);
    }
    return;
}
async function searchItemPresets(term, parts) {
    /* eslint-disable @typescript-eslint/naming-convention */
    const presets = new Map([
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
    const args = await validateOrGetInput(term, parts.join(" "), {
        id: "object",
        name: "options",
        options: {},
        subType: [
            ["preset", true, {
                    id: "string",
                    name: "preset",
                    options: {
                        autocomplete: [...presets.keys()],
                        strict: true,
                    },
                }],
            ["output", true, {
                    id: "string",
                    name: "output format",
                    options: {
                        autocomplete: [...dataVis.itemDisplaySelection],
                        default: "rooms",
                        strict: true,
                    },
                }],
        ],
    });
    const targetPreset = presets.get(args.preset);
    if (targetPreset === undefined) {
        throw Error("preset not found");
    }
    const items = findItems(targetPreset);
    dataVis.displayItemList(term, items, args.output);
    if (parts.length === 0) {
        return JSON.stringify(args);
    }
    return;
}
async function searchRecipes(term, parts) {
    const args = await validateOrGetInput(term, parts.join(" "), {
        id: "object",
        name: "options",
        options: {},
        subType: [
            ["reqs", false, {
                    id: "object",
                    name: "input requirements",
                    options: {},
                    subType: [
                        ["min", false, { id: "aspects", name: "min", options: {} }],
                        ["max", false, { id: "aspects", name: "max", options: {} }],
                    ],
                }],
            ["out", false, {
                    id: "object",
                    name: "output requirements",
                    options: {},
                    subType: [
                        ["min", false, { id: "aspects", name: "min", options: {} }],
                        ["max", false, { id: "aspects", name: "max", options: {} }],
                    ],
                }],
        ],
    });
    const result = findRecipes(args).map(recipe => [recipe[0].reqs, recipe[1]]);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
    if (parts.length === 0) {
        return JSON.stringify(args);
    }
    return;
}
export default search;
