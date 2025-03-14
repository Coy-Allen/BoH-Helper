import {securityArgs} from "./lib-security.ts";

new Deno.Command(Deno.execPath(), {
	args: ["run", ...securityArgs, "./src/terminal.ts"],
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
}).outputSync();
