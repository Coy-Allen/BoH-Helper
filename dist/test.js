/* eslint-disable @typescript-eslint/no-unused-vars */
import terminalKit from "terminal-kit";
import { getInput } from "./commandHelpers.js";
import * as fileLoader from "./fileLoader.js";
async function main() {
    await fileLoader.loadFiles(() => { return; });
    const term = terminalKit.terminal;
    await testGetInput(term);
    process.exit();
}
function testGetInput(term) {
    return getInput(term, {
        id: "object",
        name: "testObject",
        options: {},
        subType: [
            ["string", true, {
                    id: "string",
                    name: "first name",
                    options: {
                        autocomplete: [],
                        strict: false,
                    },
                }],
            ["integer", true, {
                    id: "integer",
                    name: "age",
                    options: {
                        min: 1,
                        max: 99,
                        default: 10,
                    },
                }],
            ["bool", true, {
                    id: "boolean",
                    name: "is evil",
                    options: {
                        default: true,
                    },
                }],
            ["array", true, {
                    id: "array",
                    name: "aspect slots",
                    subType: {
                        id: "aspects",
                        name: "aspects",
                        options: {
                            minTypes: 1,
                            maxTypes: 4,
                        },
                    },
                    options: {
                        minLength: 1,
                        maxLength: 5,
                    },
                }],
            ["stringArray", true, {
                    id: "stringArray",
                    name: "foods",
                    options: {
                        autocomplete: ["bread", "apple", "corn", "candy"],
                        minLength: 1,
                        maxLength: 99,
                        strict: false,
                    },
                }],
        ],
    });
}
void main();
