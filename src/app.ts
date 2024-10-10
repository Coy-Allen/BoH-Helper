import fs from "fs/promises";
import iconv from "iconv-lite";
import readline from "readline/promises";
import os from "os";

import * as loader from "./loader.js";
import type * as types from "./types.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readFileJson(filename: string, encoding: string):Promise<string>{
	return fs.readFile(filename).then(file=>iconv.decode(file,encoding).toLowerCase());
}


async function main(): Promise<void> {
	console.log("Starting");
	// grab folder locations
	const dataFolderQuestion = await rl.question("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Book of Hours: ");
	const dataFolder = (
		(dataFolderQuestion!==""?dataFolderQuestion:"C:\\Program Files (x86)\\Steam\\steamapps\\common\\Book of Hours")+
		"\\bh_Data\\StreamingAssets\\bhcontent\\core"
	);
	const saveFolderQuestion = await rl.question("Userfolder: ");
	const saveFolder = ((saveFolderQuestion!==""?saveFolderQuestion:os.homedir())+
		"\\AppData\\LocalLow\\Weather Factory\\Book of Hours"
	);
	// load items
	console.log("loading aspecteditems file.");
	const aspecteditems = JSON.parse(await readFileJson(`${dataFolder}\\elements\\aspecteditems.json`,"utf16le"));
	console.log("loading tomes file.");
	const tomes = JSON.parse(await readFileJson(`${dataFolder}\\elements\\tomes.json`,"utf16le")
		.then(text=>text.replaceAll("\n",""))); // broken newline at the end of the file
	console.log("loading _prototypes file.");
	const prototypes = JSON.parse(await readFileJson(`${dataFolder}\\elements\\_prototypes.json`,"utf8"));
	console.log("loading journal file.");
	const journal = JSON.parse(await readFileJson(`${dataFolder}\\elements\\journal.json`,"utf8"));
	console.log("loading correspondence_elements file.");
	const correspondenceElements = JSON.parse(await readFileJson(`${dataFolder}\\elements\\correspondence_elements.json`,"utf8"));
	loader.setDataItems([
		correspondenceElements,
		journal,
		aspecteditems,
		tomes,
		prototypes,
	].flatMap(files=>files.elements.map((element:any):types.dataItem=>({
		id: element.id,
		uniquenessgroup: element.uniquenessgroup ?? "",
		label: element.label ?? "",
		desc: element.desc ?? "",
		inherits: element.inherits ?? "",
		audio: element.audio ?? "",
		aspects: element.aspects ?? "",
		xtriggers: element.xtriggers ?? {},
		xexts: element.xexts ?? "",
	}))));
	// load recipes
	console.log("loading crafting_2_keeper file.");
	const craftingSkillsKeeper = JSON.parse(await readFileJson(`${dataFolder}\\recipes\\crafting_2_keeper.json`,"utf8"));
	console.log("loading crafting_3_scholar file.");
	const craftingSkillsScholar = JSON.parse(await readFileJson(`${dataFolder}\\recipes\\crafting_3_scholar.json`,"utf8"));
	console.log("loading crafting_4b_prentice file.");
	const craftingSkillsPrentice = JSON.parse(await readFileJson(`${dataFolder}\\recipes\\crafting_4b_prentice.json`,"utf8"));
	console.log("loading DLC_HOL_correspondence_summoning file.");
	const craftingDlcHolCorrespondence = JSON.parse(await readFileJson(`${dataFolder}\\recipes\\DLC_HOL_correspondence_summoning.json`,"utf8"));
	loader.setDataRecipes([
		craftingSkillsKeeper,
		craftingSkillsScholar,
		craftingSkillsPrentice,
		craftingDlcHolCorrespondence,
	].flatMap(recipes=>recipes.recipes));
	// load save file
	console.log("loading autosave file.");
	const autosave = JSON.parse(await readFileJson(`${saveFolder}\\AUTOSAVE.json`,"utf8"));
	loader.loadSave(autosave);
	console.log("everything loaded.");
	// start input loop
	while (true){
		const input = await rl.question("> ");
		const parts = input.split(" ");
		switch(parts[0]){
		case "clear":{process.stdout.write('\x1Bc');continue;}
		case "exit":
		case "quit":
		case "stop":{process.exit();}
		case "":
		case undefined:{continue;}
		case "reload":{
			console.log("loading autosave file.");
			const autosave = JSON.parse(await readFileJson(`${saveFolder}\\AUTOSAVE.json`,"utf8"));
			loader.loadSave(autosave);
			console.log("load complete.");
			continue;	
		}
		case "list":{
			switch(parts[1]){
			case "aspects":{console.log([...loader.getAllAspects()].sort().join(", "));continue;}
			default: console.log("unknown sub-command for \"list\".");
			}
			continue;
		}
		case "info":{
			switch(parts[1]){
			case "items": {
				console.log(loader.lookupItem(parts[2]));
				continue;
			}
			default: console.log("unknown sub-command for \"info\".");
			}
			continue;
		}
		case "search":{
			switch(parts[1]){
			case "items": {
				try{
					const args:[types.aspects,types.aspects] = JSON.parse(parts.slice(2).join(" "));
					console.log(loader.findItems(...args));
				} catch (err)  {
					console.log("failed to parse input.");
				}
				continue;
			}
			case "recipes": {
				try{
					const arg:{
						reqs?: {
							min?: types.aspects;
							max?: types.aspects;
						}
						output?: {
							min?: types.aspects;
							max?: types.aspects;
						}
					} = JSON.parse(parts.slice(2).join(" "));
					console.log(loader.findRecipes(arg).map(recipe=>[recipe[0].reqs,recipe[1]]));
				} catch (err)  {
					console.log("failed to parse input.");
				}
				continue;
			}
			default: console.log("unknown sub-command for \"search\".");
			}
			continue;
		}
		default: console.log("unknown command.");
		}
	}
}

main();
