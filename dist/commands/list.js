import { getAllAspects } from "../dataProcessing.js";
const list = ["list", [
        ["aspects", listAspects, "displays all aspects in the game (even hidden ones)"],
        // locked recipes? maybe. could cause spoiler issues
        // shorthands for empty searches. see "search *" commands
        // remaining draws in decks. (RootPopulationCommand.DealersTable)
    ], "lists things in the game. CAN CONTAIN SPOILERS!"];
export function listAspects(term) {
    // TODO: output filtering
    term(getAllAspects().sort().join(", ") + "\n");
}
export default list;
