import type {Terminal} from "terminal-kit";
import type * as types from "../types.js";

const debug: types.inputNode = [["debug"], [
	[["devQuickCommand", "dqc"], devQuickCommand, "used by dev for quick testing/prototyping. could do anything, SHOULD do nothing..."],
], "debug/dev commands. these can break or crash the program. don't run unless you are a dev."];


export async function devQuickCommand(_term: Terminal): Promise<undefined> {
	// stub
}

export default debug;
