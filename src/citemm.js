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

Hooks.once("ready", function() {
  Log.info("This code runs once core initialization is ready and game data is available.");

  // const ITEM = {
  //   type: "tool",
  //   name: `${MODULE_ID}_test_item`,
  //   flags: { [MODULE_ID]: {managed: true}},
  //   data: { attackBonus: 10 }
  // }

  // if (!game.items.get(ITEM_ID)) {
  //   if (!game.system.documentTypes.Item.includes(ITEM.type)) {
  //     CustomItemManager.log(true, `Item is not valid for this system (${JSON.stringify(ITEM)})`);
  //     return;
  //   }

  //   Item.create({})
  // }
});

// TODO: Make the storage settings nicer
// TODO: Have a GM button in settings to reload from folder.

// TODO: Create items based on data in files contained in the folder.
// TODO: Find items with flag bug no longer in folder, and delete them.
// TODO: Make sure that the items have a unique ID.
// TODO: Update the items that have changed.
// TODO: If file does not contain unique IDs, then create them and update the file.

// TODO: Create UI for handling data changes. Verify Create and delete, plus allow saying something is a rename.

// TODO: Do we want to use a compendium pack to store the items? or just have them as items in the game world? the second option is a lot easier...
// TODO: Actually, it is easy to 
