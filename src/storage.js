import YAML from "../node_modules/yaml/browser/index.js";
import { MODULE_ID } from "./constants.js";
import { generateNewId } from "./document.js";
import Log from "./log.js";

const STORAGE_FOLDER = "storage_folder";
const STORAGE_FOLDER_SOURCE = "storage_folder_source"


function dataFolder() {
  return game.settings.get(MODULE_ID, STORAGE_FOLDER_SOURCE);
}

export function registerStorageSettings() {
  game.settings.register(MODULE_ID, STORAGE_FOLDER, {
    scope: 'world',
    config: false,
    type: String,
    default: `worlds/${game.world.id}/${MODULE_ID}`,
    onChange: async () => {
      await createArchiveFolderIfMissing();
    }
  });
  game.settings.register(MODULE_ID, STORAGE_FOLDER_SOURCE, {
    scope: 'world',
    config: false,
    type: String,
    default: 'data',
  });

  createArchiveFolderIfMissing();
}

async function createArchiveFolderIfMissing() {
  const folder = game.settings.get(MODULE_ID, STORAGE_FOLDER);
  const parent = dataFolder()
  await FilePicker.browse(parent, folder)
    .catch(async _ => {
      if (!await FilePicker.createDirectory(parent, folder, { args: ["p"] }))
        throw new Error('Could not access the archive folder: ' + folder);
    });
}

/**
 * Loads all of the files with their data.
 *
 * @returns {Record<string, Object>} The parsed 
 */
export async function loadFiles() {
  const folder = game.settings.get(MODULE_ID, STORAGE_FOLDER);
  const parent = dataFolder()
  const data = await getAllFiles(parent, folder);
  return (await Promise.all(data.map(loadFileData))).flat();
}

/**
 * Loads all of the files in the directory recursively.
 *
 * @param {string} parent The parent location that the directory lives in.
 * @param {string} dirPath The path to the directory to load the information about.
 * @returns {string[]} List of files.
 */
async function getAllFiles(parent, dirPath) {
  const data = await FilePicker.browse(parent, dirPath);
  return data.files.concat((await Promise.all(data.dirs.map(subDir => getAllFiles(parent, subDir)))).flat().filter(Boolean))
}

async function loadFileData(filePath) {
  const data = await fetch(filePath);

  if (data.status !== 200) {
    Log.warn("Failed to load file", filePath)
    return null
  }

  switch(filePath.split(".").pop()) {
    case "json": {
      return await fixFileData(await data.json(), filePath, false);
    }
    case "yml":
    case "yaml": {
      const body = await data.text();
      return await fixFileData(YAML.parseAllDocuments(body).map(d => d.toJSON()), filePath, true);
    }
  }
}

function fixFileDoc(doc) {
  if (typeof doc !== 'object' || !!doc.id) return { doc, updated: false};
  return { doc: {
    ...doc,
    id: generateNewId()
  }, updated: true}
}

async function fixFileData(docs, filePath, isYaml) {
  let needsSave = false;
  let final = [];

  if (Array.isArray(docs)) {
    needsSave = docs.reduce((needsSave, cur) => {
      const {doc, updated} = fixFileDoc(cur);
      final.push(doc);
      return needsSave || updated;
    }, needsSave)
  } else {
    const {doc, updated} = fixFileDoc(docs);
    final.push(doc);
    needsSave = updated;
  }

  if (needsSave) {
    const parent = dataFolder()
    const pathParts = filePath.split("/");
    const fileName = pathParts.pop();
    const path = pathParts.join("/");

    let data = null;
    if (isYaml) {
      data = new File([YAML.stringify(final)], fileName, { type: "application/yaml" })
    } else {
      data = new File([JSON.stringify(Array.isArray(docs)? final : final[0], null, 2)], fileName, { type: "application/json"})
    }

    await FilePicker.upload(parent, path, data, { notify: false }).then(resp => {
      if (!resp) {
        Log.error(`Updating file ${fileName} at path ${path} failed.`)
      }
    })
  }

  return final.map(d => updateFileData(d, filePath))
}

function updateFileData(doc, filePath) {
  if (typeof doc !== 'object') {
    Log.warn("Null or Undefined document supplied:", doc)
    return null
  }
  
  return { ...doc, filePath };
}