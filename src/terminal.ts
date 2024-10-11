import terminalKit from "terminal-kit";
import * as fileLoader from "./fileLoader.js";
import * as commandProcessing from "./commandProcessing.js";

type commandFunc = ((term:terminalKit.Terminal,args: string[])=>Promise<void>|void);
type inputNode = [string,inputNode[]|commandFunc];

const term = terminalKit.terminal;
const inputTree:[string,inputNode[]] = ["",[
	["help",():void=>{term("WIP\n");}],
	["clear",():void=>{term.clear()}],
	["exit",commandProcessing.exit],
	["quit",commandProcessing.exit],
	["stop",commandProcessing.exit],
	["load",commandProcessing.load],
	["list",[
		["aspects",commandProcessing.listAspects],
		// locked recipes? maybe. could cause spoiler issues
		// shorthands for empty searches. see "search *" commands
	]],
	["info",[
		["items",commandProcessing.infoItems],
	]],
	["search",[
		["verbs",commandProcessing.searchVerbs],
		// crafting areas
		// locked rooms
		["items",commandProcessing.searchItems],
		["recipes",commandProcessing.searchRecipes],
	]],
	// something for missing things?
		// how many skills are left
		// current loot tables for searches.
			// must ignore inaccessable searches.
			// ????? for resulting items that are not curently in the library.
				// IDK what to do for memories & items that are "discovered" but not present.
	// something for advanced stuff.
		// list all recipes that create items, where X amount of the item is not already created
		// list max aspects possible for given crafting bench.
		// list max aspects possible for arbitrary crafting options (books).
]];

async function main(): Promise<void> {
	await term.drawImage(
		"resources/splash.png",
		{shrink:{width:term.width,height:term.height*4}},
	);
	term.yellow("Book of Hours' Watcher\n");
	const fileLoadingProgress = term.progressBar({
		title: "Loading Files",
		items: fileLoader.fileMetaDataList.length,
		inline: true,
		// syncMode: true, // BUGGED: https://github.com/cronvel/terminal-kit/issues/251
	});
	await fileLoader.loadFiles((type,filename):void=>{
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
				term.red("failed to load "+filename+"\n");
				break;
			}
		}
	});
	term("\n");
	await inputLoop();
}

async function inputLoop(): Promise<void> {
	// TODO: persist history
	const history: string[] = [];
	while(true){
		term("> ");
		const input = await term.inputField({
			history: history,
			autoComplete: inputTree[1].flatMap(command=>generateAutocomplete(command)),
			autoCompleteMenu: true,
			autoCompleteHint: true,
		}).promise;
		term("\n");
		if(!input){
			term.eraseLine();
			term.previousLine(0);
			continue;
		}
		history.push(input);
		const parts = input.split(" ").filter(part=>part!=="");
		const commandLookup = findCommand(parts);
		if(commandLookup===undefined){
			term.yellow("command not found.\n")
			continue;
		}
		await commandLookup[0](term,commandLookup[1]);
	}
}
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

main().finally(():void=>{
	term.processExit(0);
})
