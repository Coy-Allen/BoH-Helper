import fs from "fs/promises";
import iconv from "iconv-lite";

const installFolder = "E:\\Steam\\steamapps\\common\\Book of Hours";
const dataFolder = installFolder+"\\bh_Data\\StreamingAssets\\bhcontent\\core";

export async function loadJson(name:string,encoding:string): Promise<string> {
	return fs.readFile(dataFolder+"\\"+name)
			.then(file=>iconv.decode(file,encoding).toLowerCase())
}