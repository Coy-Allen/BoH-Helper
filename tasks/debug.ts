import {securityArgs} from "./lib-security.ts";

new Deno.Command(Deno.execPath(), {
	args: ["run", ...securityArgs, "--inspect", "./src/terminal.ts"],
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
}).outputSync();
