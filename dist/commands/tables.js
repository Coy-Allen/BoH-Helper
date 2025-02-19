import { validateOrGetInput, itemFilter, aspectTarget } from "../commandHelpers.js";
import { data, filterBuilders, save } from "../dataProcessing.js";
import { markupReplace } from "../dataVisualizationFormatting.js";
import { markupItems } from "../config.js";
const tables = [["tables"], [
        [["maxAspects"], maxAspects, "shows max aspects available."],
        [["maxAspectsPreset"], maxAspectsPreset, "shows max aspects available for a given workbench."],
        [["maxAspectsAssistance"], maxAspectsAssistance, "shows max aspects available using assistance. Memories are excluded, checks all helpers, everything else only checks owned items/omens."],
        [["minAspectRoomUnlock"], minAspectUnlockableRooms, "shows the minimum aspects needed to unlock a room. might break for strange rooms."],
        [["minAspectBooks"], minAspectBooks, "shows the mimimum required aspects to read a book from your owned books."],
        [["maxAspectsAllVerbs"], maxAspectVerbs, "shows max aspects possible using all known verbs"],
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
    const calc = calcAspectLimit(args.row, maxAspectCheck, args.col);
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
    const calc = calcAspectLimit(filters, maxAspectCheck, aspects);
    printMaxAspects(term, calc.header, filters.map(row => JSON.stringify(row)), calc.data, calc.totals);
    return JSON.stringify(args);
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
    const sharedCalc = calcAspectLimit(sharedAspects.map(aspect => ({ min: { [aspect]: 1 } })), maxAspectCheck);
    for (const type of types) {
        const typeData = data.elements.get(type[0]);
        if (typeData === undefined) {
            continue;
        }
        const people = data.elements.findAll(elem => elem.inherits === type[0]);
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
        const calc = calcAspectLimit(filters, maxAspectCheck);
        for (let colIndex = 0; colIndex < max.totals.length; colIndex++) {
            const maxTotal = max.totals[colIndex];
            const calcTotal = calc.totals[colIndex];
            if (
            // if this is better
            maxTotal < calcTotal ||
                // allow replacement of equal totals if the new one takes no extra item.
                maxTotal === calcTotal &&
                    (max.data[1][colIndex][1] ?? 0) > 0 &&
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
    // TODO: rewrite this to use minAspectCheck
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
function minAspectBooks(term, parts) {
    const calc = calcAspectLimit([{
            any: Object.fromEntries(defaultAspects.map(aspect => ["mystery." + aspect, 1])),
            max: Object.fromEntries(defaultAspects.map(aspect => ["mastery." + aspect, 0])),
        }], minAspectCheck, defaultAspects.map(aspect => "mystery." + aspect));
    printMaxAspects(term, ["filter query", ...markupReplace(defaultAspects)], ["Book"], calc.data, calc.totals);
    return parts.join(" ");
}
function maxAspectVerbs(term, parts) {
    const ownedVerbs = save.verbs.values();
    const verbOutput = data.verbs
        .filter(verb => ownedVerbs.includes(verb.id))
        .map(verb => ({ id: verb.id, data: calcAspectLimit(((verb.slot ? [verb.slot] : verb.slots) ?? []).map(slot => {
            const filter = {};
            if (slot.forbidden) {
                filter.max = Object.fromEntries(Object.entries(slot.forbidden).map(entry => [entry[0], 0]));
            }
            if (slot.required) {
                filter.any = slot.required;
            }
            if (slot.essential) {
                filter.min = slot.essential;
            }
            return filter;
        }), maxAspectCheck) }));
    // FIXME: name of verb is not shown to user, so they can't even use this information...
    const result = mergeTableMaxAspect(verbOutput, false);
    if (result === undefined) {
        // TODO: stub. show error
        return parts.join(" ");
    }
    console.log(result);
    printMaxAspects(term, ["filter query", ...result.header], new Array(result.data.length).fill(undefined).map((_v, i) => `slot ${i + 1}`), result.data, result.totals);
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
function maxAspectCheck(item, aspect, targ) {
    const itemAspects = item.aspects;
    if (itemAspects?.[aspect] === undefined ||
        itemAspects[aspect] === 0) {
        return [-1, 0];
    }
    if (targ.length === 0) {
        return [itemAspects[aspect], itemAspects[aspect]];
    }
    const diff = itemAspects[aspect] - targ[1];
    return [diff, itemAspects[aspect]];
}
function minAspectCheck(item, aspect, targ) {
    const itemAspects = item.aspects;
    if (itemAspects?.[aspect] === undefined ||
        itemAspects[aspect] === 0) {
        return [-1, 0];
    }
    if (targ.length === 0) {
        return [itemAspects[aspect], itemAspects[aspect]];
    }
    const diff = targ[1] - itemAspects[aspect];
    return [diff, itemAspects[aspect]];
}
function calcAspectLimit(rowFilters, check, // [sort, target count]
aspects = []) {
    const rowContents = [];
    const aspectsToUse = aspects.length !== 0 ? aspects : defaultAspects;
    const header = ["filter query", ...markupReplace(aspectsToUse)];
    for (const rowFilter of rowFilters) {
        const rowContent = [];
        const foundItems = Array.isArray(rowFilter) ? rowFilter : save.elements.filter(filterBuilders.saveItemFilter(rowFilter));
        for (const aspect of aspectsToUse) {
            const target = [];
            for (const item of foundItems) {
                const [compSort, itemAspect] = check(item, aspect, target);
                const name = "entityid" in item ? item.entityid : item.id;
                if (compSort > 0) {
                    target[0] = name;
                    target[1] = itemAspect;
                }
                else if (compSort === 0) {
                    target[0] = (target[0] === undefined ? "" : target[0] + "/") + name;
                    target[1] = itemAspect;
                } // else {} // ignore all compSort < 0
            }
            rowContent.push(target);
        }
        rowContents.push(rowContent);
    }
    return {
        header: header,
        data: rowContents,
        totals: rowContents.reduce((total, row) => {
            for (let i = 0; i < total.length; i++) {
                const cell = row[i];
                if (cell.length === 0) {
                    continue;
                }
                total[i] += cell[1];
            }
            return total;
        }, new Array(aspectsToUse.length).fill(0)),
    };
}
function printMaxAspects(term, header, titles, tableData, totals) {
    const table = [
        // TODO: color cells based on aspect
        header,
        ...tableData.map((row, rowIndex) => {
            // TODO: color the cells
            return [titles[rowIndex], ...row.map(cell => cell.length === 0 ? "" : `^c${cell[0]}^::\n^b${cell[1]}^:`)];
        }),
        ["totals", ...totals.map(count => "^b" + count.toString() + "^:")],
    ];
    term.table(table, { contentHasMarkup: true });
}
function mergeTableMaxAspect(tableData, strict) {
    if (tableData.length === 0) {
        return;
    }
    if (tableData.length === 1) {
        return tableData[0].data;
    }
    const tableList = tableData.map(tableObj => tableObj.data);
    console.log(tableList.length);
    // verify if we can merge these results
    for (let i = 1; i < tableList.length; i++) {
        const table = tableList[i];
        if (table.header.some((header, index) => header !== tableList[0].header[index])) {
            return undefined;
        }
        if (strict) {
            if (table.data.length !== tableList[0].data.length) {
                return undefined;
            }
            if (table.data.some((row, index) => row.some((cell, subindex) => cell[0] !== tableList[0].data[index][subindex][0]))) {
                return undefined;
            }
        }
    }
    const result = {
        header: [], // ...tableList[0].header
        data: new Array(Math.max(...tableList.map(table => table.data.length)))
            .fill(undefined)
            .map(_ => []),
        totals: [],
    };
    // merge
    // TODO: figure out a way to solve max aspect ties. this currently prioritizes the first match
    // aspect index starts at 1 to skip the "filter query" header
    for (let aspectIndex = 1; aspectIndex < tableList[0].header.length; aspectIndex++) {
        let tableIndexTarget = -1;
        let maxAspect = -1;
        for (let tableIndex = 0; tableIndex < tableList.length; tableIndex++) {
            const table = tableList[tableIndex];
            if (table.totals[aspectIndex] > maxAspect) {
                tableIndexTarget = tableIndex;
                maxAspect = table.totals[aspectIndex];
            }
        }
        if (maxAspect < 0) {
            result.header.push(markupReplace(tableList[0].header[aspectIndex]));
            result.data.push([]);
            result.totals.push(0);
            continue;
        }
        // append to results
        const targTable = tableList[tableIndexTarget];
        result.header.push(`${markupReplace(tableList[0].header[aspectIndex])}: ${markupItems.verb}${tableData[tableIndexTarget].id}^:`);
        for (let rowIndex = 0; rowIndex < result.data.length; rowIndex++) {
            result.data[rowIndex].push(targTable.data[rowIndex]?.[aspectIndex] ?? []);
        }
        result.totals.push(targTable.totals[aspectIndex]);
    }
    return result;
}
export default tables;
// TODO: turn all of this into a class
