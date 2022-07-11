import { MODULE_ID } from "./constants.js";
import Log from "./log.js";

const COMPENDIUM_MODULE_SETTING = "compendium-module"
const COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING = "compendium-allow-delete-compendium"
const COMPENDIUM_ALLOW_DELETE_WORLD_SETTING = "compendium-allow-delete-world"
const COMPENDIUM_FORCE_UNIQUE = "compendium-force-unique"
const COMPENDIUM_SKIP_ADD = "compendium-skip-add"

export class Compendium {
  //

  constructor() {
    //
  }

  static async fromFiles(fileData) {
    //
  }
}

export function registerCompendiumSettings() {
  const choices = {};
  game.modules.forEach(m => {
    Log.info(m.id, m.data.title)
    choices[m.id] = m.data.title
  })

  game.settings.register(MODULE_ID, COMPENDIUM_MODULE_SETTING, {
    name: "Module to store compendium information",
    scope: "world",
    config: true,
    type: String,
    choices,
    default: MODULE_ID
  });

  game.settings.register(MODULE_ID, COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING, {
    name: "Delete items from compendium",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, COMPENDIUM_ALLOW_DELETE_WORLD_SETTING, {
    name: "Delete items from world",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, COMPENDIUM_FORCE_UNIQUE, {
    name: "Force unique names in compendium",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, COMPENDIUM_SKIP_ADD, {
    name: "Skip adding to compendium",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
}

export function getCompendiumModule() {
  return game.settings.get(MODULE_ID, COMPENDIUM_MODULE_SETTING)
}

export function shouldDeleteMissingItems() {
  return game.settings.get(MODULE_ID, COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING) ||
         game.settings.get(MODULE_ID, COMPENDIUM_ALLOW_DELETE_WORLD_SETTING)
}

export function shouldDeleteCompendiumItems() {
  return game.settings.get(MODULE_ID, COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING);
}

export function shouldDeleteWorldItems() {
  return game.settings.get(MODULE_ID, COMPENDIUM_ALLOW_DELETE_WORLD_SETTING);
}

export function forceUniqueNames() {
  return game.settings.get(MODULE_ID, COMPENDIUM_FORCE_UNIQUE)
}

export function skipAddToCompendium() {
  return game.settings.get(MODULE_ID, COMPENDIUM_SKIP_ADD);
}

export function getPackForDocType(docType) {
  const pack = game.modules.get(getCompendiumModule()).packs.find(p => p.type === docType);
  return game.packs.get(`${pack.package}.${pack.name}`);
}

// export function getPackByNameForDocType(docType, name) {
//   return game.modules.get(getCompendiumModule()).pack.find(p => p.type === docType && p.name === name);
// }

export async function getDocsForCompendiumType(docType) {
  if (!skipAddToCompendium()) {
    Log.info(getPackForDocType(docType))
    return (await getPackForDocType(docType).getDocuments())
  }

  // TODO: Support more than just items
  switch(docType) {
    case "Item": {
      return [...game.items.values()];
    }
    default: {
      Log.error("Tried to load non-compendium docs for unsupported doc type:", docType)
    }
  }
}

export async function deleteCompendiumItems(docType, ids) {
  if (shouldDeleteCompendiumItems()) {
    const c = getPackForDocType(docType);
    await Promise.all(ids.map(id => c.delete(id)))
  }

  if (!shouldDeleteWorldItems()) return;

  // TODO: Support more than just items
  switch(docType) {
    case "Item": {
      const toDelete = ids.filter(id => game.items.has(id))
      if (toDelete.length) {
        await Item.deleteDocuments(toDelete)
      }
    }
    default: {
      Log.error("Tried to delete unsupported doc type:", docType)
    }
  }
}

export async function addCompendiumItems(docType, items) {
  const c = getPackForDocType(docType);
  if (!c) return;

  // TODO: support more than just items
  const created = await Item.createDocuments(items)
  await Promise.all(created.map(i => c.importDocument(i)));
  await Item.deleteDocuments(created.map(i => i.id));
}
