import terminalKit from "terminal-kit";
import * as loader from "./bohLoader.js";
import * as inputProcessing from "./inputProcessing.js";

const term = terminalKit.terminal;

async function main(): Promise<void> {
	await term.drawImage(
		"resources/splash.png",
		{shrink:{width:term.width,height:term.height*4}},
	);
	term.yellow("Book of Hours' Watcher\n");
	const fileLoadingProgress = term.progressBar({
		title: "Loading Files",
		items: loader.fileMetaDataList.length,
		inline: true,
		// syncMode: true, // BUGGED: https://github.com/cronvel/terminal-kit/issues/251
	});
	await loader.loadFiles((type,filename):void=>{
		switch(type){
			case "start":{
				fileLoadingProgress.startItem(filename);
				break;
			}
			case "success":{
				fileLoadingProgress.itemDone(filename);
				break;
			}
			case "failed":{
				fileLoadingProgress.stop();
				term.red("failed to load "+filename);
				break;
			}
		}
	});
	await inputLoop();
}

main().finally(():void=>{
	term.processExit(0);
})

async function inputLoop(): Promise<void> {
	// TODO: save history
	const history: string[] = [];
	while(true){
		term("\n> ");
		const input = await term.inputField({
			history: history,
			autoComplete: inputTree[1].flatMap(command=>generateAutocomplete(command)),
			autoCompleteMenu: true,
			autoCompleteHint: true,
		}).promise;
		if(!input){
			term.eraseLine();
			term.previousLine(0);
			continue;
		}
		history.push(input);
		const parts = input.split(" ").filter(part=>part!=="");
		const commandLookup = findCommand(parts);
		term("\n");
		if(commandLookup===undefined){
			term.yellow("command not found.")
			continue;
		}
		await commandLookup[0](term,commandLookup[1]);
	}
}
/*
	while (true){
		switch(parts[0]){
		case "clear":{process.stdout.write('\x1Bc');continue;}
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
*/

type commandFunc = ((term:terminalKit.Terminal,args: string[])=>Promise<void>|void);
type inputNode = [string,inputNode[]|commandFunc];

const inputTree:[string,inputNode[]] = ["",[
	["help",():void=>{term("WIP");}],
	["clear",():void=>{term.clear()}],
	["exit",(t):void=>inputProcessing.exit(t)],
	["quit",(t):void=>inputProcessing.exit(t)],
	["stop",(t):void=>inputProcessing.exit(t)],
	["load",():void=>{term("WIP");}],
	["list",[
		["aspects",():void=>{term("WIP");}],
	]],
	["info",[
		["items",():void=>{term("WIP");}],
	]],
	["search",[
		["items",():void=>{term("WIP");}],
		["recipes",():void=>{term("WIP");}],
	]],
]];
function findCommand(parts:string[]):[commandFunc,string[]]|undefined{
	// TODO: clean this up
	let targetNode:inputNode = inputTree;
	for(let i=0;i<=parts.length;i++) {
		const [_name,data] = targetNode;
		if(!Array.isArray(data)){return [data,parts.splice(i)];}
		if(parts.length===i){return;}
		const nextNode = data.find(([name,_data]):boolean=>name===parts[i].toLowerCase());
		if(nextNode===undefined){return;}
		targetNode = nextNode;
	}
	return;
}
function generateAutocomplete([name,data]:inputNode): string[]{
	if(Array.isArray(data)){
		return data.flatMap(subCommand=>generateAutocomplete(subCommand).map(part=>name+" "+part));
	}
	return [name]
} 