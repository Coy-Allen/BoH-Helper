import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";
import {getNum} from "../commandHelpers.js";

const debug: types.inputNode = [["debug"], [
	[["devQuickCommand", "dqc"], devQuickCommand, "used by dev for quick testing/prototyping. could do anything, SHOULD do nothing..."],
], "debug/dev commands. these can break or crash the program. don't run unless you are a dev."];


export async function devQuickCommand(term: Terminal): Promise<undefined> {
	await getNum(term, "min slot count", {min: 0});
}

export default debug;
