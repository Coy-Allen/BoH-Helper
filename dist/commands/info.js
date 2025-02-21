import { validateOrGetInput } from "../commandHelpers.js";
import { jsonSpacing } from "../config.js";
import { data } from "../dataProcessing.js";
const info = [["info"], [
        [["items"], items, "info on item aspects and results for inspect/talk."],
    ], "give detailed info on something. does not need save file."];
async function items(term, parts) {
    const args = await validateOrGetInput(term, parts.join(" "), {
        id: "string",
        name: "item name",
        options: {
            autocomplete: [],
            strict: false,
        },
    });
    const result = data.elements.getInherited(args);
    term(JSON.stringify(result, null, jsonSpacing) + "\n");
    return JSON.stringify(args);
}
export default info;
