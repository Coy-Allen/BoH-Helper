import os from "os";

// user config
export const installFolder = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Book of Hours";
export const saveLocation = os.homedir()+"\\AppData\\LocalLow\\Weather Factory\\Book of Hours";
export const maxHistory = 50;
export const shouldAutoloadSave = true as boolean;
export const defaultFile = "AUTOSAVE.json";
export const defaultItemDisplay = "aspects";
// NOTICE: powershell WILL NOT use trueColors unless you run this command before running the program. (https://github.com/cronvel/terminal-kit/issues/253)
//	$ENV:TERM = "xterm-truecolor"
//	$ENV:COLORTERM = "truecolor"
export const isTrueColor = true as boolean;

// internal config. do not edit unless you know what you are doing.
export const isDebug = false as boolean;
export const dataFolder = installFolder+"\\bh_Data\\StreamingAssets\\bhcontent\\core";
export const jsonSpacing = "  ";
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
};
