import { registerCompendiumSettings } from "./compendium.js";
import { MODULE_ID } from "./constants.js";
import Log from "./log.js";
import { registerStorageSettings } from "./storage.js";

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});

Hooks.once("init", function() {
  Log.message(`Initializing the Custom Item Manager Module.\n-------------------\nCustom Item Manager\n===================`)
  registerStorageSettings();
  registerCompendiumSettings();
})
