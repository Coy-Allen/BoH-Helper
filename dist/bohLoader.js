import fs from "fs/promises";
import iconv from "iconv-lite";
export const fileMetaDataList = [
    { name: "elements\\aspecteditems.json", encoding: "utf16le", type: "items" },
    { name: "elements\\tomes.json", encoding: "utf16le", type: "items", postProcessing: text => text.replaceAll("\n", "") },
    { name: "elements\\_prototypes.json", encoding: "utf8", type: "items" },
    { name: "elements\\journal.json", encoding: "utf8", type: "items" },
    { name: "elements\\correspondence_elements.json", encoding: "utf8", type: "items" },
    { name: "recipes\\crafting_2_keeper.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_3_scholar.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_4b_prentice.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_correspondence_summoning.json", encoding: "utf8", type: "recipes" },
];
const fileOutputs = new Map();
export async function loadFiles(dispatch) {
    // TODO: find BoH save folder
    const installFolder = "E:\\Steam\\steamapps\\common\\Book of Hours";
    const dataFolder = installFolder + "\\bh_Data\\StreamingAssets\\bhcontent\\core";
    for (let i = 0; i < fileMetaDataList.length; i++) {
        const fileMetaData = fileMetaDataList[i];
        dispatch("start", fileMetaData.name);
        const outputs = fileOutputs.get(fileMetaData.type) ?? [];
        if (!fileOutputs.has(fileMetaData.type)) {
            fileOutputs.set(fileMetaData.type, outputs);
        }
        try {
            const fileContent = await fs.readFile(dataFolder + "\\" + fileMetaData.name)
                .then(file => iconv.decode(file, fileMetaData.encoding).toLowerCase())
                .then(contents => fileMetaData.postProcessing?.(contents) ?? contents);
            outputs.push(JSON.parse(fileContent));
            dispatch("success", fileMetaData.name);
        }
        catch (err) {
            dispatch("failed", fileMetaData.name);
            throw err;
        }
    }
    /*
        const saveFolderQuestion = await rl.question("Userfolder: ");
        const saveFolder = ((saveFolderQuestion!==""?saveFolderQuestion:os.homedir())+
            "\\AppData\\LocalLow\\Weather Factory\\Book of Hours"
        );
        // load items
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
    */
}
