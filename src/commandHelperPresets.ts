import type {targetTypes} from "./commandHelpers.ts";
import {data} from "./dataProcessing.ts";

export const aspectTarget = {
	id: "stringArray",
	name: "item filter",
	options: {
		autocomplete: data.aspects.values(),
		autocompleteDelimiter: "\\.",
		strict: true,
	},
} as const satisfies targetTypes;

export const itemFilter = {
	id: "object",
	name: "item filter",
	options: {},
	subType: [
		["min", false, {id: "aspects", name: "min aspects", options: {}}],
		["any", false, {id: "aspects", name: "any aspects", options: {}}],
		["max", false, {id: "aspects", name: "max aspects", options: {}}],
		["nameValid", false, {id: "string", name: "matches RegEx", options: {autocomplete: [], strict: false}}],
		["nameInvalid", false, {id: "string", name: "NOT matches RegEx", options: {autocomplete: [], strict: false}}],
	],
} as const satisfies targetTypes;
