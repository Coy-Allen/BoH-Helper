import type {Terminal} from "terminal-kit";

export function exit(term: Terminal): void {
	term("exiting...");
	term.processExit(0);
}