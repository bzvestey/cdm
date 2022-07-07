import { MODULE_ID } from "./constants.js";
import Log from "./log.js";

const COMPENDIUM_MODULE_SETTING = "compendium-module"

export function registerCompendiumSettings() {
  const choices = {};
  game.modules.forEach(m => {
    Log.info(m.id, m.data.title)
    choices[m.id] = m.data.title
  })

  game.settings.register(MODULE_ID, COMPENDIUM_MODULE_SETTING, {
    name: "Module to update compendium of",
    hint: "Name of the module.",
    scope: "world",
    config: true,
    type: String,
    choices,
    default: MODULE_ID
  });
}

export function getCompendiumModule() {
  return game.settings.get(MODULE_ID, COMPENDIUM_MODULE_SETTING)
}

export function getItemPack() {
  // TODO: Be able to specify the name of the pack
  return game.modules.get(getCompendiumModule()).pack.find(p => p.type === "Item");
}
