import archiver from "archiver";
import fs from "fs";
import {execSync} from "child_process";
import {exit, platform} from "process";
/** @type {Record<"zipName"|"executable"|"pkgTarget",string>} */
let config;
const nodeVer = "node22";

switch (platform) {
	case "linux": {
		config = {
			zipName: "linux-x86_64",
			executable: "BoH-Helper",
			pkgTarget: "linux-x64",
		};
		break;
	}
	case "win32": {
		console.warn("Windows compilation breaks on multiple pkg calls. If you get a (write EOF) error, restart your computer.");
		config = {
			zipName: "windows-x86_64",
			executable: "BoH-Helper.exe",
			pkgTarget: "win-x64",
		}
		break;
	}
	case "darwin":
	case "aix":
	case "android":
	case "freebsd":
	case "haiku":
	case "openbsd":
	case "sunos":
	case "cygwin":
	case "netbsd":
	default: {
		console.error("Unknown/unsupoported OS detected. Cannot create package for this OS.");
		exit();
	}
}

// merge into one js file
execSync(`esbuild ./src/terminal.js --bundle --platform=node --target=${nodeVer} --outfile=dist/BoH-Helper.cjs`);

// package into os specific executable
execSync(`pkg -t ${nodeVer}-${config.pkgTarget} -o ./dist/${config.executable} --target=${nodeVer} ./dist/BoH-Helper.cjs`)

// create Zip file
fs.mkdirSync("./dist/artifacts", { recursive: true });
const outputFile = fs.createWriteStream(`./dist/artifacts/${config.zipName}.zip`);
const archive = archiver.create('zip', {
  zlib: {level: 9} // Sets the compression level.
});
// outputFile.on("close",()=>{});
// outputFile.on("end",()=>{});
// outputFile.on("warning",()=>{});
// outputFile.on("error",()=>{});
archive.pipe(outputFile);
archive.file(`./dist/${config.executable}`, {name: `BoH-Helper/${config.executable}`});
archive.directory("./dist_assets", "BoH-Helper");
archive.directory("./resources", "BoH-Helper/resources");
await archive.finalize();
