import type { Request, Response } from "express";
import Product from "../../models/product.js";
import SubCategory from "../../models/subCategory.js";
import SubSubCategory from "../../models/subSubCategory.js";
import cache from "../../lib/cache.js";

/**
 * Relationship map: for each deletable entity type, what other collections
 * might reference it and how to remove those references.
 */
const CASCADE_RULES: Record<string, {
  label: string;
  /** Collections that reference this entity */
  references: {
    model: "Product" | "SubCategory" | "SubSubCategory";
    /** Field path in the referencing collection (MongoDB dot-notation) */
    field: string;
    /** True if field is an array (use $pull), false if single (set to null/undefined) */
    isArray: boolean;
    label: string; // human-readable name for the referenced collection
  }[];
}> = {
  colors: {
    label: "Color",
    references: [
      { model: "Product", field: "colors", isArray: true, label: "Products" },
    ],
  },
  materials: {
    label: "Material",
    references: [
      { model: "Product", field: "material", isArray: true, label: "Products" },
    ],
  },
  Categories: {
    label: "Category",
    references: [
      { model: "Product", field: "category", isArray: true, label: "Products" },
      { model: "SubCategory", field: "category", isArray: true, label: "Sub Categories" },
    ],
  },
  SubCategories: {
    label: "Sub Category",
    references: [
      { model: "Product", field: "subCategory", isArray: true, label: "Products" },
      { model: "SubSubCategory", field: "subCategory", isArray: true, label: "Sub Sub Categories" },
    ],
  },
  SubSubCategories: {
    label: "Sub Sub Category",
    references: [
      { model: "Product", field: "subSubCategory", isArray: true, label: "Products" },
    ],
  },
};

// ── Helpers ──

// Use `any` for the model lookup since Mongoose Model types are structurally incompatible
// across different schemas (Product, SubCategory, etc. have different fields).
// The actual model operations (countDocuments, updateMany) work identically on all models.
const MODELS: Record<string, any> = {
  Product,
  SubCategory,
  SubSubCategory,
};

function getReferencingModel(name: string) {
  return MODELS[name];
}

async function countReferences(
  entityModel: string,
  entityId: string,
): Promise<{ model: string; field: string; count: number; label: string }[]> {
  const rules = CASCADE_RULES[entityModel];
  if (!rules) return [];

  const results = await Promise.all(
    rules.references.map(async (ref) => {
      const Model = getReferencingModel(ref.model);
      if (!Model) return { model: ref.model, field: ref.field, count: 0, label: ref.label };

      let count = 0;
      if (ref.isArray) {
        count = await Model.countDocuments({ [ref.field]: entityId, deletedAt: null });
      } else {
        count = await Model.countDocuments({ [ref.field]: entityId, deletedAt: null });
      }
      return { model: ref.model, field: ref.field, count, label: ref.label };
    }),
  );

  return results.filter((r) => r.count > 0);
}

async function removeReferences(
  entityModel: string,
  entityId: string,
): Promise<{ model: string; field: string; removed: number; label: string }[]> {
  const rules = CASCADE_RULES[entityModel];
  if (!rules) return [];

  const results = await Promise.all(
    rules.references.map(async (ref) => {
      const Model = getReferencingModel(ref.model);
      if (!Model) return { model: ref.model, field: ref.field, removed: 0, label: ref.label };

      let result: { modifiedCount?: number } = { modifiedCount: 0 };
      if (ref.isArray) {
        // Remove the ID from the array — pull it out
        result = await Model.updateMany(
          { [ref.field]: entityId, deletedAt: null },
          { $pull: { [ref.field]: entityId } },
        );
      }

      return {
        model: ref.model,
        field: ref.field,
        removed: result.modifiedCount ?? 0,
        label: ref.label,
      };
    }),
  );

  return results;
}

// ── API Handlers ──

/**
 * POST /api/admin/utils/cascade-delete-preview
 * Body: { model: string, id: string }
 * Returns: { affected: { label: string; count: number }[], total: number }
 */
export const preview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { model, id } = req.body as { model?: string; id?: string };
    if (!model || !id) {
      res.status(400).json({ _status: false, _message: "model and id are required", _data: null });
      return;
    }

    const rules = CASCADE_RULES[model];
    if (!rules) {
      res.status(400).json({ _status: false, _message: `Unknown model: ${model}`, _data: null });
      return;
    }

    const references = await countReferences(model, id);
    const total = references.reduce((sum, r) => sum + r.count, 0);

    res.json({
      _status: true,
      _message: "Preview generated",
      _data: {
        label: rules.label,
        references: references.map((r) => ({ label: r.label, count: r.count })),
        total,
      },
    });
  } catch (err) {
    res.status(500).json({ _status: false, _message: "Failed to generate preview", _data: null });
  }
};

/**
 * POST /api/admin/utils/cascade-delete-execute
 * Body: { model: string, id: string }
 * Returns: { removed: { label: string; removed: number }[], message: string }
 */
export const execute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { model, id } = req.body as { model?: string; id?: string };
    if (!model || !id) {
      res.status(400).json({ _status: false, _message: "model and id are required", _data: null });
      return;
    }

    // 1. Remove references
    const removed = await removeReferences(model, id);
    const totalRemoved = removed.reduce((sum, r) => sum + r.removed, 0);

    // 2. Soft-delete the entity itself
    // The actual controller handles this, but we just return what we cleaned up
    // The frontend will then call the normal delete endpoint

    // Invalidate relevant caches
    cache.del("navigationData");

    res.json({
      _status: true,
      _message: `References cleaned up from ${totalRemoved} record(s)`,
      _data: {
        removed: removed.map((r) => ({ label: r.label, removed: r.removed })),
        total: totalRemoved,
      },
    });
  } catch (err) {
    res.status(500).json({ _status: false, _message: "Failed to execute cascade delete", _data: null });
  }
};
