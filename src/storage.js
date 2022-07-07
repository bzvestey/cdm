import { MODULE_ID } from "./constants.js";
import Log from "./log.js";

export const STORAGE_FOLDER = "storage_folder";
export const STORAGE_FOLDER_SOURCE = "storage_folder_source"


function dataFolder() {
  return game.settings.get(MODULE_ID, STORAGE_FOLDER_SOURCE);
}

export function registerStorageSettings() {
  // TODO: Add some labels about what this really is
  
  game.settings.register(MODULE_ID, STORAGE_FOLDER, {
    scope: 'world',
    config: true,
    type: String,
    default: `worlds/${game.world.id}/${MODULE_ID}`,
    onChange: async () => {
      await createArchiveFolderIfMissing();
    }
  });
  game.settings.register(MODULE_ID, STORAGE_FOLDER_SOURCE, {
    scope: 'world',
    config: true,
    type: String,
    default: 'data',
  });

  // TODO: Button to reload the information

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
  Log.info(data)
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
  Log.info(data)
  return data.files.concat((await Promise.all(data.dirs.map(subDir => getAllFiles(parent, subDir)))).filter(Boolean).flat())
}

async function loadFileData(filePath) {
  Log.info(filePath)
  const data = await fetch(filePath);

  if (data.status !== 200) {
    Log.warn("Failed to load file", filePath)
    return null
  }
  
  switch(filePath.split(".").pop()) {
    case "json": {
      return await data.json();
    }
    case "yml":
    case "yaml": {
      const body = await data.text();
      // TODO: parse the yaml...
      return body;
    }
  }
}