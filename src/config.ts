import os from "node:os";
// TODO: make this async
import fs from "node:fs";
import * as types from "./types.ts";
import {Terminal} from "terminal-kit";
import {targetTypes, validateOrGetInput} from "./commandHelpers.ts";
import {itemDisplaySelection} from "./dataVisualizationFormatting.ts";

interface config {
	installFolder: string;
	saveLocation: string;
	maxHistory: number;
	shouldAutoloadSave: boolean;
	defaultFile: string;
	defaultItemDisplay: typeof itemDisplaySelection[number]; // FIXME: not restricted to valid keys
	// NOTICE: powershell WILL NOT use trueColors unless you run this command before running the program. (https://github.com/cronvel/terminal-kit/issues/253)
	//	$ENV:TERM = "xterm-truecolor"
	//	$ENV:COLORTERM = "truecolor"
	isTrueColor: boolean;
	isDebug: boolean;
	jsonSpacing: string;
	countAsObtained: string[];
}

export const configCommands: types.inputNode = [["config"], [
	[["reset"], resetSetting, "set the setting to the default value."],
	[["clear"], clearSetting, "clears the given setting."],
	[["set"], setSetting, "clears the given setting."],
	[["get"], getSetting, "get the value of the given setting."],
	[["list"], listSetting, "list all settings & their descriptions."],
], "change BoH-Helper's settings. settings are saved to \"config.json\""];

const defaultConfig: config = {
	installFolder: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Book of Hours",
	saveLocation: os.homedir()+"\\AppData\\LocalLow\\Weather Factory\\Book of Hours",
	maxHistory: 50,
	shouldAutoloadSave: true,
	defaultFile: "AUTOSAVE.json",
	defaultItemDisplay: "rooms",
	isTrueColor: true,
	isDebug: false,
	jsonSpacing: "  ",
	countAsObtained: [],
};

// internal config.
const configFilePath = "./config.json";
export const markupReplaceList: [RegExp, string][] = [
	[/\blantern\b/gi, "#ffe300"],
	[/\bforge\b/gi, "#ff8e3e"],
	[/\bedge\b/gi, "#d7dd49"],
	[/\bwinter\b/gi, "#beeeff"],
	[/\bheart\b/gi, "#f97a89"],
	[/\bgrail\b/gi, "#fe6150"],
	[/\bmoth\b/gi, "#f2e9c2"],
	[/\bknock\b/gi, "#b54efc"],
	[/\bsky\b/gi, "#2c68e1"],
	[/\bmoon\b/gi, "#ccbcd6"],
	[/\bnectar\b/gi, "#20a360"],
	[/\bscale\b/gi, "#cb9f4e"],
	[/\brose\b/gi, "#f163ff"],
];

export const markupItems = {
	item: "^c", // cyan
	deck: "^g", // green
	verb: "^m", // magenta
	totals: "^b", // blue
	settingUser: "^c", // cyan
	settingDefault: "^b", // blue
};

// final config setup
const userConfig: Partial<config> = {};
export const config: config = Object.assign({}, defaultConfig);
if (fs.existsSync(configFilePath)) {
	try {
		const unverifiedConfig: unknown = JSON.parse(fs.readFileSync(configFilePath, {encoding: "utf8"}));
		// TODO: verify the contents of the file!
		Object.assign(userConfig, unverifiedConfig);
	} catch (_) {
		console.error("user config failed to load!");
	}
}

function applyConfig(): void {
	for (const key in userConfig) {
		if (key in config) {
			/* @ts-expect-error typescript does not support same key assignment (https://github.com/microsoft/TypeScript/issues/32693) */
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			config[key] = userConfig[key];
		}
	}
	fs.writeFileSync(configFilePath, JSON.stringify(userConfig, null, config.jsonSpacing));
}

// Apply loaded user config
applyConfig();

// FIXME: defaults do not update when the user changes the config
const configMetadata: Record<keyof config, {
	targetType: targetTypes;
	helpText: string;
}> = {
	installFolder: {
		targetType: {
			id: "string",
			name: "installFolder",
			options: {
				autocomplete: [],
				default: config.installFolder,
				strict: false,
			},
		},
		helpText: "Install location of BoH. Defaults to steamapps on C drive.",
	},
	saveLocation: {
		targetType: {
			id: "string",
			name: "saveLocation",
			options: {
				autocomplete: [],
				default: config.saveLocation,
				strict: false,
			},
		},
		helpText: "Location of save data folder. Defaults to the game's default location in the current user's appdata.",
	},
	maxHistory: {
		targetType: {
			id: "integer",
			name: "maxHistory",
			options: {
				min: 0,
				default: config.maxHistory,
			},
		},
		helpText: "Max command history. Defaults to 50 commands.",
	},
	shouldAutoloadSave: {
		targetType: {
			id: "boolean",
			name: "shouldAutoloadSave",
			options: {
				default: config.shouldAutoloadSave,
			},
		},
		helpText: "Auto load the default save file on startup. Defaults to true",
	},
	defaultFile: {
		targetType: {
			id: "string",
			name: "defaultFile",
			options: {
				autocomplete: [], // TODO: fill this with files in the save folder.
				default: config.defaultFile,
				strict: false,
			},
		},
		helpText: "Default save file for autoload and pre-filled in the load command. Defaults to AUTOSAVE file.",
	},
	defaultItemDisplay: {
		targetType: {
			id: "string",
			name: "defaultItemDisplay",
			options: {
				autocomplete: [...itemDisplaySelection],
				default: config.defaultItemDisplay,
				strict: true,
			},
		},
		helpText: "Default display type for item searching. Defaults to aspects.",
	},
	isTrueColor: {
		targetType: {
			id: "boolean",
			name: "isTrueColor",
			options: {
				default: config.isTrueColor,
			},
		},
		helpText: "If we should use 24 bit colors instead of the 16 color pallet. Default is true.",
	},
	isDebug: {
		targetType: {
			id: "boolean",
			name: "isDebug",
			options: {
				default: config.isDebug,
			},
		},
		helpText: "If debugging information should be printed to the console. Default is false.",
	},
	jsonSpacing: {
		targetType: {
			id: "string",
			name: "jsonSpacing",
			options: {
				autocomplete: [],
				strict: false,
				default: config.jsonSpacing,
			},
		},
		helpText: "The spacing used for printing JSON objects such as save files and complex command output. Default is two spaces.",
	},
	countAsObtained: {
		targetType: {
			id: "stringArray",
			name: "countAsObtained",
			options: {
				autocomplete: [],
				strict: false,
				default: config.countAsObtained, // FIXME: somehow not showing the default
			},
		},
		helpText: "A list of items that should always be counted as \"owned\" for any command dealing with save files. Usefull for memories. Defaults to empty list.",
	},
};

// config commands
async function getConfigItem(term: Terminal, part: string|undefined): Promise<keyof config> {
	const validatadPart = part??"".length > 0 ? `"${part}"` : "";
	// this processes as JSON so we need to incase it in quotes.
	return validateOrGetInput(term, validatadPart, {
		id: "string",
		name: "option",
		options: {
			autocomplete: Object.keys(defaultConfig) as (keyof config)[],
			strict: true,
		},
	});
}
async function resetSetting(term: Terminal, parts: string[]): Promise<string> {
	const key = await getConfigItem(term, parts[0]);
	/* @ts-expect-error typescript does not support same key assignment (https://github.com/microsoft/TypeScript/issues/32693) */
	userConfig[key] = defaultConfig[key];
	applyConfig();
	return key;
}
async function clearSetting(term: Terminal, parts: string[]): Promise<string> {
	const key = await getConfigItem(term, parts[0]);
	// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
	delete userConfig[key];
	applyConfig();
	return key;
}
async function setSetting(term: Terminal, parts: string[]): Promise<string> {
	const [optionName, ...valueGiven] = parts;
	const key = await getConfigItem(term, optionName);
	const value = await validateOrGetInput(term, valueGiven.join(" "), configMetadata[key].targetType);
	/* @ts-expect-error typescript does not support same key assignment (https://github.com/microsoft/TypeScript/issues/32693) */
	userConfig[key] = value;
	applyConfig();
	return `${key} ${JSON.stringify(value)}`;
}
async function getSetting(term: Terminal, parts: string[]): Promise<string> {
	const key = await getConfigItem(term, parts[0]);
	const value = config[key];
	term(`${getKeyColor(key)}${key}^:: ${JSON.stringify(value)}\n`);
	return key;
}
function listSetting(term: Terminal, _parts: string[]): string {
	// TODO: show user settings and default settings as different things.
	for (const key of Object.keys(configMetadata)) {
		const metadata = configMetadata[key as keyof config];
		term(`${getKeyColor(key)}${key}^: (${metadata.targetType.id}): ${metadata.helpText} \n`);
	}
	return "";
}

// helpers

function getKeyColor(key: string): string {
	if (key in userConfig) {
		return markupItems.settingUser;
	}
	return markupItems.settingDefault;
}
