import {
  addCompendiumItems,
  deleteCompendiumItems,
  getCompendiumModule,
  getDocsForCompendiumType,
  getPackForDocType,
  shouldDeleteMissingItems
} from "./compendium.js";
import { FLAGS, MODULE_ID } from "./constants.js";
import Log from "./log.js";

export async function createDocuments(fileData) {
  const byCompendium = fileData.reduce((comp, cur) => {
    const doc = updateDocData(cur);
    if (doc) {
      if (!Array.isArray(comp[cur.docType])) {
        comp[cur.docType] = [];
      }
      comp[cur.docType].push(doc);
    }
    return comp;
  }, {});

  // TODO: Support more than just Items...
  // TODO: Support different compendiums for different types...
  if (byCompendium["Item"]?.length) {
    const compendium = getPackForDocType("Item");
    if (!compendium) return;

    const deleteMissing = shouldDeleteMissingItems();
    const compItems = await getDocsForCompendiumType("Item");

    const itemsToDelete = [];
    const itemsToUpdate = [];
    const itemsToCreate = [];

    const cim = compItems.reduce((map, cur) => {
      if (!cur.data.flags[MODULE_ID]) {
        if (deleteMissing) {
          itemsToDelete.push(cur.data._id);
        }
      } else {
        map[cur.data.name] = cur;
      }

      return map;
    }, {});

    byCompendium["Item"].forEach((item) => {
      // TODO: Handle this by ID when we can save by ID
      // TODO: Check setting for forcing unique Names
      const ci = cim[item.name];
      delete cim[item.name];

      if (ci) {
        itemsToUpdate.push({ old: ci, new: item });
      } else {
        itemsToCreate.push(item);
      }
    });

    if (deleteMissing) {
      const cimv = Object.values(cim);

      if (cimv.length) {
        itemsToDelete.push(...cimv.map(cim.data._id));
      }

      if (itemsToDelete.length) {
        Log.info("Items to delete:", itemsToDelete);
        await deleteCompendiumItems("Item", itemsToDelete);
      }
    }

    if (itemsToUpdate.length) {
      Log.info("Items to Update:", itemsToUpdate);
      await Promise.all(itemsToUpdate.map((pair) => pair.old.update(pair.new)));
    }

    if (itemsToCreate.length) {
      Log.info("Items to Create:", itemsToCreate);
      await addCompendiumItems("Item", itemsToCreate);
    }
  }
}

function updateDocData(doc) {
  // When a system is defined, make sure it is the same as the one being used in the world
  if (
    doc.system &&
    !(
      doc.system === game.system.id ||
      (Array.isArray(doc.system) && doc.system.includes(game.system.id))
    )
  ) {
    Log.error("Current system not supported by document:", doc);
    return null;
  }

  // Make sure that the document type exists and that the given type is valid.
  const dType = game.system.documentTypes[doc.docType];
  if (
    !dType ||
    (doc.type === doc.docType && dType.includes("base")) ||
    !dType.includes(doc.type)
  ) {
    Log.error("Invalid docType/type combo:", doc);
    return null;
  }

  return {
    type: doc.type,
    name: doc.name,
    icon: doc.icon,
    data: doc.data,
    flags: {
      [MODULE_ID]: {
        [FLAGS.ID]: doc.id ?? generateNewId(),
        [FLAGS.FILE_PATH]: doc.filePath,
      },
    },
  };
}

/**
 * Generates a random ID with a prefix from settings or the module ID for compendium content
 *.
 * @returns {string} The new ID.
 */
export function generateNewId() {
  const prefix =
    /*game.settings.get(MODULE_ID, ID_PREFIX_SETTING) ??*/ getCompendiumModule();
  return `${prefix}_${crypto.randomUUID()}`;
}
