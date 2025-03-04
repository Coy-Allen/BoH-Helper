import { data } from "./dataProcessing.js";
export const aspectTarget = {
    id: "stringArray",
    name: "item filter",
    options: {
        autocomplete: data.aspects.values(),
        autocompleteDelimiter: "\\.",
        strict: true,
    },
};
export const itemFilter = {
    id: "object",
    name: "item filter",
    options: {},
    subType: [
        ["min", false, { id: "aspects", name: "min aspects", options: {} }],
        ["any", false, { id: "aspects", name: "any aspects", options: {} }],
        ["max", false, { id: "aspects", name: "max aspects", options: {} }],
        ["nameValid", false, { id: "string", name: "matches RegEx", options: { autocomplete: [], strict: false } }],
        ["nameInvalid", false, { id: "string", name: "NOT matches RegEx", options: { autocomplete: [], strict: false } }],
    ],
};
