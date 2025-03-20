import archiver from "archiver";
import fs from "fs";

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
].map((zipMeta)=>{
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
