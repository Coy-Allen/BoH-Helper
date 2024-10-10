
import type * as types from "./types.js";
import {findItems,setDataItems,loadSave} from "./loader.js"

const ITEMS_FILE = document.getElementById("itemsFile") as HTMLInputElement;
const SAVE_FILE = document.getElementById("jsonFile") as HTMLInputElement;
const SEARCH = document.getElementById("search") as HTMLInputElement;
const SEARCH_SUBMIT = document.getElementById("searchSubmit") as HTMLButtonElement;
const OUTPUT = document.getElementById("output") as HTMLTextAreaElement;


ITEMS_FILE.addEventListener("change",():void=>{
	ITEMS_FILE.disabled = true;
	SAVE_FILE.disabled = true;
	const files = ITEMS_FILE.files;
	if(files===null || files.length===0){
		ITEMS_FILE.disabled = false;
		return;
	}
	Promise.allSettled([...files].map(file=>file.text())).then(resProm=>{
		return resProm.filter(resEntry=>resEntry.status==="fulfilled").map(resEntry=>resEntry.value);
	}).then(texts=>{
		const json = texts.flatMap(text=>{
			const filtered = text.replaceAll("\n","");
			try {
				const result = JSON.parse(filtered);
				if(!("elements" in result)){return [];}
				// Fix some strange json issues
				const data = result.elements.map((element:any):types.dataItem=>({
					id: element.id ?? element.id,
					uniquenessgroup: element.uniquenessgroup ?? "",
					label: element.label ?? "",
					desc: element.desc ?? "",
					inherits: element.inherits ?? "",
					audio: element.audio ?? "",
					aspects: element.aspects ?? "",
					xtriggers: element.xtriggers ?? {},
					xexts: element.xexts ?? "",
				}));
				return data;
			} catch (err) {
				// TODO: pass down filename
				console.error("failed to parse file UNKNOWN.");
				return [];
			}
		});
		setDataItems(json)
		SAVE_FILE.disabled = false;
	}).catch(err=>{
		alert("failed to load aspecteditems and/or tomes. Make sure you upload the files from your game install:\n\\bh_Data\\StreamingAssets\\bhcontent\\core\\elements\\");
		throw err;
	}).finally(():void=>{
		ITEMS_FILE.disabled = false;
	})
});

SAVE_FILE.addEventListener("change",():void=>{
	ITEMS_FILE.disabled = true;
	SAVE_FILE.disabled = true;
	const file = SAVE_FILE.files?.[0];
	if(!file){
		SAVE_FILE.disabled = false;
		ITEMS_FILE.disabled = false;
		return;
	}
	file.text().then(text=>{
		const json:types.saveData = JSON.parse(text);
		loadSave(json);
	}).catch(err=>{
		alert("failed to load save");
		throw err;
	}).finally(():void=>{
		SAVE_FILE.disabled = false;
		ITEMS_FILE.disabled = false;
	})
});

SEARCH_SUBMIT.addEventListener("click",():void=>{
	const search = JSON.parse(SEARCH.value) as [types.aspects,types.aspects];
	const items = findItems(...search).map(item=>({
		id: item.entityid,
		room: item.room,
		aspects: item.aspects,
	}));
	OUTPUT.value = JSON.stringify(items,null,"\t");
})

//@ts-expect-error
document.findItems = findItems;
