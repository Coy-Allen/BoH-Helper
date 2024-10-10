export function exit(term) {
    term("exiting...");
    term.processExit(0);
}
