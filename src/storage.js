import { MODULE_ID } from "./constants.js";

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