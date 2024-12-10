import { validateOrGetInput, itemFilter, aspectTarget } from "../commandHelpers.js";
import { getAllVerbs, findItems } from "../dataProcessing.js";
import { markupReplace } from "../dataVisualizationFormatting.js";
const tables = [["tables"], [
        [["maxAspects"], maxAspects, "shows max aspects available."],
        [["maxAspectsPreset"], maxAspectsPreset, "shows max aspects available for a given workbench."],
        // list max aspects possible for given crafting bench.
    ], "display's tables of info"];
async function maxAspects(term, parts) {
    // get input
    const args = await validateOrGetInput(term, parts.join(" "), {
        id: "object",
        name: "options",
        options: {},
        subType: [
            ["row", true, {
                    id: "array",
                    name: "slot",
                    options: {},
                    subType: itemFilter,
                }],
            ["col", false, aspectTarget],
        ],
    });
    // calculate
    const result = calcMaxAspects(args.row, args.col);
    // print result
    term.table(result, { contentHasMarkup: true });
    if (parts.length === 0) {
        return JSON.stringify(args);
    }
    return;
}
async function maxAspectsPreset(term, parts) {
    // TODO: grab all possible stations
    // TODO: allow prototypes (_assistance.*)
    const verbs = getAllVerbs();
    // get input
    const args = await validateOrGetInput(term, parts.join(" "), {
        id: "object",
        name: "options",
        options: {},
        subType: [
            ["verb", true, {
                    id: "string",
                    name: "preset",
                    options: {
                        autocomplete: verbs.map(verb => verb.id),
                        autocompleteDelimiter: "\\.",
                        strict: true,
                    },
                }],
            ["col", false, aspectTarget],
        ],
    });
    const [verbId, aspects] = [args.verb, args.col];
    // get station info
    const targetVerb = verbs.find(verb => verb.id === verbId);
    if (targetVerb === undefined) {
        throw new Error("verb not found");
    }
    // calculate
    const slots = targetVerb.slot ? [targetVerb.slot] : targetVerb.slots ? targetVerb.slots : [];
    const result = calcMaxAspects(slots.map(slot => {
        const options = {};
        if (slot.essential) {
            options.min = slot.essential;
        }
        ;
        if (slot.required) {
            options.any = slot.required;
        }
        ;
        if (slot.forbidden) {
            const max = {};
            Object.keys(slot.forbidden).forEach(forbidden => max[forbidden] = 0);
            options.max = max;
        }
        ;
        return options;
    }), aspects);
    // print result
    term.table(result, { contentHasMarkup: true });
    if (parts.length === 0) {
        return JSON.stringify([verbId, aspects]);
    }
    return;
}
// Shared code
function calcMaxAspects(rowFilters, aspects = []) {
    const rowContents = [];
    const aspectsToUse = aspects.length !== 0 ? aspects : [
        "lantern",
        "forge",
        "edge",
        "winter",
        "heart",
        "grail",
        "moth",
        "knock",
        "sky",
        "moon",
        "nectar",
        "scale",
        "rose",
    ];
    const header = ["filter query", ...markupReplace(aspectsToUse)];
    const counts = new Array(aspectsToUse.length).fill(0);
    for (const rowFilter of rowFilters) {
        const rowContent = [];
        const foundItems = findItems(rowFilter);
        for (const aspect of aspectsToUse) {
            let name = "-";
            let max = 0;
            for (const item of foundItems) {
                const itemAspect = item.aspects.get(aspect) ?? 0;
                if (itemAspect > max) {
                    name = item.entityid;
                    max = itemAspect;
                }
            }
            rowContent.push([name, max]);
        }
        rowContents.push(rowContent);
        for (let i = 0; i < rowContent.length; i++) {
            counts[i] += rowContent[i][1];
        }
    }
    return [
        // TODO: color cells based on aspect
        header,
        ...rowContents.map((row, rowIndex) => {
            // TODO: color the cells
            return [JSON.stringify(rowFilters[rowIndex]), ...row.map(cell => `^c${cell[0]}^::\n^b${cell[1]}^:`)];
        }),
        ["totals", ...counts.map(count => "^b" + count.toString() + "^:")],
    ];
}
export default tables;
