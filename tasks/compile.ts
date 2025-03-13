import {securityArgs} from "./lib-security.ts";
import archiver from "archiver";
import fs from "node:fs";

// compile everything

new Deno.Command(Deno.execPath(), {
	args: [
		"compile",
		...securityArgs,
		"--target", "x86_64-pc-windows-msvc",
		"--icon", "./resources/splash.png",
		"--output", "./dist/BoH-Helper.exe",
		"./src/terminal.ts"],
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
}).outputSync();

new Deno.Command(Deno.execPath(), {
	args: [
		"compile",
		...securityArgs,
		"--target", "x86_64-unknown-linux-gnu",
		"--output", "./dist/BoH-Helper",
		"./src/terminal.ts"],
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
}).outputSync();

// create Zip files
fs.mkdirSync("./dist/artifacts", { recursive: true });
await Promise.all([
	{
		zipName: "windows-x86_64",
		executable: "BoH-Helper.exe",
	},
	{
		zipName: "linux-x86_64",
		executable: "BoH-Helper",
	},
].map((zipMeta:{zipName: string;executable: string;})=>{
	const outputFile = fs.createWriteStream(`./dist/artifacts/${zipMeta.zipName}.zip`);
	const archive = archiver.create('zip', {
    zlib: {level: 9} // Sets the compression level.
  });
	// outputFile.on("close",()=>{});
	// outputFile.on("end",()=>{});
	// outputFile.on("warning",()=>{});
	// outputFile.on("error",()=>{});
	archive.pipe(outputFile);
	archive.file(`./dist/${zipMeta.executable}`, {name: `BoH-Helper/${zipMeta.executable}`});
	archive.directory("./dist_assets", "BoH-Helper");
	archive.directory("./resources", "BoH-Helper/resources");
	return archive.finalize();
}));

// TODO: zip files