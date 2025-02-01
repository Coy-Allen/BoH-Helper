import { validateOrGetInput, itemFilter, aspectTarget } from "../commandHelpers.js";
import { data, filterBuilders, save } from "../dataProcessing.js";
import { markupReplace } from "../dataVisualizationFormatting.js";
const tables = [["tables"], [
        [["maxAspects"], maxAspects, "shows max aspects available."],
        [["maxAspectsPreset"], maxAspectsPreset, "shows max aspects available for a given workbench."],
        [["maxAspectsAssistance"], maxAspectsAssistance, "shows max aspects available using assistance. Memories are excluded, checks all helpers, everything else only checks owned items/omens."],
        [["minAspectRoomUnlock"], minAspectUnlockableRooms, "shows the minimum aspects needed to unlock a room. might break for strange rooms."],
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
    const calc = calcMaxAspects(args.row, args.col);
    // print result
    printMaxAspects(term, calc.header, args.row.map(row => JSON.stringify(row)), calc.data, calc.totals);
    return JSON.stringify(args);
}
async function maxAspectsPreset(term, parts) {
    // TODO: grab all possible stations
    const verbs = data.verbs.values();
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
    const filters = slots.map(slot => {
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
    });
    const calc = calcMaxAspects(filters, aspects);
    printMaxAspects(term, calc.header, filters.map(row => JSON.stringify(row)), calc.data, calc.totals);
    return JSON.stringify([verbId, aspects]);
}
function maxAspectsAssistance(term, parts) {
    const types = [
        ["_assistance", undefined],
        ["_assistance.usescandles", "candle"],
        ["_assistance.useswood", "wood"],
        ["_assistance.usesfabric", "fabric"],
        ["_assistance.usesmetal", "metal"],
        ["_assistance.usesfuel", "fuel"],
        ["_assistance.usesomen", "omen"],
        ["_assistance.usespigment", "pigment"],
        ["_assistance.usesflower", "flower"],
        // neither of these 2 are used in game
        ["_assistance.usescooperative", "cooperative"],
        ["_assistance.usessound", "sound"],
    ];
    // note that this is a transformed version of the table (swapping rows & cols)
    const max = {
        header: [], // unused
        data: [Array(13).fill(["-", 0]), Array(13).fill(["-", 0])],
        totals: Array(13).fill(0),
    };
    const sharedAspects = ["ability", "tool", "sustenance", "beverage"]; // Memory won't be listed. due to memories being created as needed by the user.
    const sharedCalc = calcMaxAspects(sharedAspects.map(aspect => ({ min: { [aspect]: 1 } })));
    for (const type of types) {
        const typeData = data.elements.get(type[0]);
        if (typeData === undefined) {
            continue;
        }
        const people = data.elements.findAll(element => element.inherits === type[0]);
        if (people.length === 0) {
            continue;
        }
        const filters = [people];
        if (type[1]) {
            filters.push({ min: { [type[1]]: 1 } });
        }
        else {
            // returns nothing but adds the row to the resulting table.
            filters.push([]);
        }
        const calc = calcMaxAspects(filters);
        for (let colIndex = 0; colIndex < max.totals.length; colIndex++) {
            const maxTotal = max.totals[colIndex];
            const calcTotal = calc.totals[colIndex];
            if (
            // if this is better
            maxTotal < calcTotal ||
                // allow replacement of equal totals if the new one takes no extra item.
                maxTotal === calcTotal &&
                    max.data[1][colIndex][1] > 0 &&
                    calc.data[1][colIndex][1] === 0) {
                max.totals[colIndex] = calcTotal;
                for (let rowIndex = 0; rowIndex < 2; rowIndex++) {
                    max.data[rowIndex][colIndex] = calc.data[rowIndex][colIndex];
                }
            }
        }
    }
    printMaxAspects(term, sharedCalc.header, ["assistance", ...sharedAspects, "extra"], 
    // this is probably wrong. this might be data[row][col] instead of data[col][row]
    [max.data[0], ...sharedCalc.data, max.data[1]], sharedCalc.totals.map((num, i) => num + max.totals[i]));
    return parts.join(" ");
}
function minAspectUnlockableRooms(term, parts) {
    const minAspect = defaultAspects.map(_ => ["-", undefined]);
    for (const room of save.roomsUnlockable.values()) {
        const recipe = data.recipes.find(entry => entry.id === `terrain.${room.payload.id}`);
        if (recipe === undefined) {
            console.log(`failed to find unlock requirement for ${room.payload.id}.`);
            continue;
        }
        const aspects = recipe.preslots?.[0].required;
        if (aspects === undefined) {
            console.log(`failed to find aspect requirements for ${room.payload.id}.`);
            continue;
        }
        for (let i = 0; i < defaultAspects.length; i++) {
            const aspect = defaultAspects[i];
            const targetAspect = minAspect[i];
            // can be undefined
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (aspects[aspect] === undefined) {
                continue;
            }
            if (targetAspect[1] === undefined || aspects[aspect] < targetAspect[1]) {
                targetAspect[0] = room.payload.id;
                targetAspect[1] = aspects[aspect];
                continue;
            }
            if (aspects[aspect] === targetAspect[1]) {
                targetAspect[0] += "/" + room.payload.id;
            }
        }
    }
    const finalAspect = minAspect.map(entry => [entry[0], entry[1] ?? 0]);
    printMaxAspects(term, ["filter query", ...markupReplace(defaultAspects)], ["Room"], [finalAspect], finalAspect.map(entry => entry[1]));
    return parts.join(" ");
}
const defaultAspects = [
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
function calcMaxAspects(rowFilters, aspects = []) {
    const rowContents = [];
    const aspectsToUse = aspects.length !== 0 ? aspects : defaultAspects;
    const header = ["filter query", ...markupReplace(aspectsToUse)];
    const counts = new Array(aspectsToUse.length).fill(0);
    for (const rowFilter of rowFilters) {
        const rowContent = [];
        const foundItems = Array.isArray(rowFilter) ? rowFilter : save.elements.filter(filterBuilders.aspectFilter(rowFilter, item => item.aspects));
        for (const aspect of aspectsToUse) {
            let name = "-";
            let max = 0;
            for (const item of foundItems) {
                const itemAspect = item.aspects?.[aspect] ?? 0;
                if (itemAspect > max) {
                    /** @ts-expect-error this was a rough implementation to allow both save items and data items */
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    name = item.entityid ?? item.id;
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
    return {
        header: header,
        data: rowContents,
        totals: counts,
    };
}
function printMaxAspects(term, header, titles, tableData, totals) {
    const table = [
        // TODO: color cells based on aspect
        header,
        ...tableData.map((row, rowIndex) => {
            // TODO: color the cells
            return [titles[rowIndex], ...row.map(cell => `^c${cell[0]}^::\n^b${cell[1]}^:`)];
        }),
        ["totals", ...totals.map(count => "^b" + count.toString() + "^:")],
    ];
    term.table(table, { contentHasMarkup: true });
}
export default tables;
