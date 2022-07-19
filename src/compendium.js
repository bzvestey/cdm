import { Flags, MODULE_ID, Templates } from "./constants.js";
import Log from "./log.js";
import { loadFiles } from "./storage.js";

const COMPENDIUM_MODULE_SETTING = "compendium-module";
const COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING =
  "compendium-allow-delete-compendium";
const COMPENDIUM_ALLOW_DELETE_WORLD_SETTING = "compendium-allow-delete-world";
const COMPENDIUM_FORCE_UNIQUE = "compendium-force-unique";
const COMPENDIUM_SKIP_ADD = "compendium-skip-add";
const COMPENDIUM_UPDATE_MENU = "compendium-update-menu";

const CompendiumUpdaterStatus = Object.freeze({
  NOT_STARTED: "not_started",
  PREPARING: "preparing",
  DISPLAYING: "displaying",
  MODIFYING: "modifying",
  DONE: "done",
});

export class CompendiumUpdater extends FormApplication {
  /**
   * The current status of the compendium updater.
   *
   * @type {CompendiumUpdaterStatus}
   */
  status = CompendiumUpdaterStatus.NOT_STARTED;

  packs = [];

  //

  constructor() {
    super();

    // Get the information loaded for display in the window.
    this.startPreparingData();
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      // classes: [""],
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
      height: "auto",
      width: "auto",
      resizable: true,
      popOut: true,
      template: Templates.MAIN_DISPLAY,
      id: `${MODULE_ID}-main-display`,
      title: `${MODULE_ID}.dialog.title`,
    });
  }

  get template() {
    return Templates.MAIN_DISPLAY;
  }

  getData() {
    return {
      isLoadingData:
        this.status === CompendiumUpdaterStatus.NOT_STARTED ||
        this.status === CompendiumUpdaterStatus.PREPARING,
      isDisplayingChanges: this.status === CompendiumUpdaterStatus.DISPLAYING,
      isUpdatingContent: this.status === CompendiumUpdater.MODIFYING,
      isDone: this.status === CompendiumUpdaterStatus.DONE,
      packs: this.packs,
    };
  }

  activateListeners(html) {
    return super.activateListeners(html);
  }

  async _updateObject(event, formData) {
    Log.error(formData.exampleInput);
  }

  async startPreparingData() {
    this.status = CompendiumUpdaterStatus.PREPARING;
    const filesByCompendium = await loadInformationFromFiles();
    this.packs = Object.entries(filesByCompendium).map(([docType, docs]) => {
      const pack = getPackForDocType(docType);
      return {
        name: pack.metadata.label,
        docType,
        ...splitByAction(docType, docs),
      };
    });
    this.status = CompendiumUpdaterStatus.DISPLAYING;
    this.render();
  }
}

/**
 * Loads information from the files in the folder and organizes them by their docType.
 *
 * @returns {Record<string, Array<any>>} A map of the items for each document type.
 */
async function loadInformationFromFiles() {
  const fileData = await loadFiles();

  return fileData.reduce((comp, cur) => {
    const doc = updateDocData(cur);
    if (doc) {
      if (!Array.isArray(comp[cur.docType])) {
        comp[cur.docType] = [];
      }
      comp[cur.docType].push(doc);
    }
    return comp;
  }, {});
}

/**
 * Converts the document from how it is expected to be in the file saved to
 * disk to how FoundryVTT expects it to be.
 *
 * @param {Record<string, any>} doc The document in the file format.
 * @returns The document in the FoundryVTT format.
 */
function updateDocData(doc) {
  const error = doc.error;
  // When a system is defined, make sure it is the same as the one being used in
  // the world.
  if (
    !error &&
    doc.system &&
    !(
      doc.system === game.system.id ||
      (Array.isArray(doc.system) && doc.system.includes(game.system.id))
    )
  ) {
    Log.error("Current system not supported by document:", doc);
    error = `Document does not support the game system "${game.system.id}"`;
  }

  // Make sure that the document type exists and that the given type is valid.
  const dType = game.system.documentTypes[doc.docType];
  if (
    !error &&
    (!dType ||
      (doc.type === doc.docType && dType.includes("base")) ||
      !dType.includes(doc.type))
  ) {
    Log.error("Invalid docType/type combo:", doc);
    error = `Document has an unsupported document type "${doc.docType}"`;
  }

  // return the final document data.
  return {
    type: doc.type,
    name: doc.name,
    icon: doc.icon,
    data: doc.data,
    flags: {
      [MODULE_ID]: {
        [Flags.ERROR]: error,
        [Flags.ID]: doc.id,
        [Flags.FILE_PATH]: doc.filePath,
      },
    },
  };
}

function splitByAction(docType, docs) {
  const adds = [];
  const updates = [];
  const deletes = [];

  // TODO: Do things...
  adds.push(...docs);

  return { adds, updates, deletes };
}

////////////////////////////////////////////////////////////////////////////////

export function registerCompendiumSettings() {
  const choices = {};
  game.modules.forEach((m) => {
    Log.info(m.id, m.data.title);
    choices[m.id] = m.data.title;
  });

  game.settings.register(MODULE_ID, COMPENDIUM_MODULE_SETTING, {
    name: "Module to store compendium information",
    scope: "world",
    config: true,
    type: String,
    choices,
    default: MODULE_ID,
  });

  game.settings.register(
    MODULE_ID,
    COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING,
    {
      name: "Delete items from compendium",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    }
  );

  game.settings.register(MODULE_ID, COMPENDIUM_ALLOW_DELETE_WORLD_SETTING, {
    name: "Delete items from world",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, COMPENDIUM_FORCE_UNIQUE, {
    name: "Force unique names in compendium",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, COMPENDIUM_SKIP_ADD, {
    name: "Skip adding to compendium",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.registerMenu(MODULE_ID, COMPENDIUM_UPDATE_MENU, {
    name: `${MODULE_ID}.settings.config-menu.name`,
    label: `${MODULE_ID}.settings.config-menu.label`,
    icon: "fas fa-cogs",
    type: CompendiumUpdater,
    restricted: false,
    hint: `${MODULE_ID}.settings.config-menu.hint`,
  });
}

export function getCompendiumModule() {
  return game.settings.get(MODULE_ID, COMPENDIUM_MODULE_SETTING);
}

export function shouldDeleteMissingItems() {
  return (
    game.settings.get(MODULE_ID, COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING) ||
    game.settings.get(MODULE_ID, COMPENDIUM_ALLOW_DELETE_WORLD_SETTING)
  );
}

export function shouldDeleteCompendiumItems() {
  return game.settings.get(
    MODULE_ID,
    COMPENDIUM_ALLOW_DELETE_COMPENDIUM_SETTING
  );
}

export function shouldDeleteWorldItems() {
  return game.settings.get(MODULE_ID, COMPENDIUM_ALLOW_DELETE_WORLD_SETTING);
}

export function forceUniqueNames() {
  return game.settings.get(MODULE_ID, COMPENDIUM_FORCE_UNIQUE);
}

export function skipAddToCompendium() {
  return game.settings.get(MODULE_ID, COMPENDIUM_SKIP_ADD);
}

export function getPackForDocType(docType) {
  const pack = game.modules
    .get(getCompendiumModule())
    .packs.find((p) => p.type === docType);
  return game.packs.get(`${getCompendiumModule()}.${pack.name}`);
}

// export function getPackByNameForDocType(docType, name) {
//   return game.modules.get(getCompendiumModule()).pack.find(p => p.type === docType && p.name === name);
// }

export async function getDocsForCompendiumType(docType) {
  if (!skipAddToCompendium()) {
    Log.info(getPackForDocType(docType));
    return await getPackForDocType(docType).getDocuments();
  }

  // TODO: Support more than just items
  switch (docType) {
    case "Item": {
      return [...game.items.values()];
    }
    default: {
      Log.error(
        "Tried to load non-compendium docs for unsupported doc type:",
        docType
      );
    }
  }
}

export async function deleteCompendiumItems(docType, ids) {
  if (shouldDeleteCompendiumItems()) {
    const c = getPackForDocType(docType);
    await Promise.all(ids.map((id) => c.delete(id)));
  }

  if (!shouldDeleteWorldItems()) return;

  // TODO: Support more than just items
  switch (docType) {
    case "Item": {
      const toDelete = ids.filter((id) => game.items.has(id));
      if (toDelete.length) {
        await Item.deleteDocuments(toDelete);
      }
    }
    default: {
      Log.error("Tried to delete unsupported doc type:", docType);
    }
  }
}

export async function addCompendiumItems(docType, items) {
  const c = getPackForDocType(docType);
  if (!c) return;

  // TODO: support more than just items
  const created = await Item.createDocuments(items);
  await Promise.all(created.map((i) => c.importDocument(i)));
  await Item.deleteDocuments(created.map((i) => i.id));
}
