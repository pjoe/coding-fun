import { readFile } from "fs/promises"
import { loadMap } from "./load-map"
import { pathToFileURL } from "url"

async function loadJSON(fname: string) {
  return JSON.parse(await readFile(fname, { encoding: "utf8" }))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadMap(loadJSON, "www/assets/industrial.tmj")
}
