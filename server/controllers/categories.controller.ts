import { prisma } from "../config/db.config";
import {Request,Response} from "express";


type CategoryType = "expense" | "income";
/* ----------------------------------------------------
   GET CATEGORIES (TREE STRUCTURE)
   /api/categories?type=expense|income
---------------------------------------------------- */
const getCategories = async (req: Request, res: Response) => {
  try {
    const type = req.query.type as CategoryType;

    if (!type || !["expense", "income"].includes(type)) {
      return res.status(400).json({ message: "Invalid category type" });
    }

    const categories = await prisma.category.findMany({
      where: {
        type,
        parentId: null,
      },
      include: {
        children: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json(categories);
  } catch (error) {
    console.error("getCategories:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

/* ----------------------------------------------------
   CREATE CATEGORY
---------------------------------------------------- */
const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, type, parentId } = req.body as {
      name: string;
      type: CategoryType;
      parentId?: string;
    };

    if (!name?.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (!["expense", "income"].includes(type)) {
      return res.status(400).json({ message: "Invalid category type" });
    }

    // Optional: Validate parent exists
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
        select: { id: true },
      });

      if (!parent) {
        return res.status(404).json({ message: "Parent category not found" });
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        parentId: parentId ?? null,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error("createCategory:", error);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

/* ----------------------------------------------------
   UPDATE CATEGORY
---------------------------------------------------- */
const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body as {
      name?: string;
      parentId?: string | null;
    };

    if (!id) {
      return res.status(400).json({ message: "Category ID required" });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Prevent self-parenting
    if (parentId === id) {
      return res
        .status(400)
        .json({ message: "Category cannot be its own parent" });
    }

    const data: any = {};

    if (name !== undefined) {
      data.name = name.trim();
    }

    // 👇 ONLY update parentId if it is provided
    if (parentId !== undefined) {
      data.parentId = parentId;
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (error) {
    console.error("updateCategory:", error);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

/* ----------------------------------------------------
   DELETE CATEGORY (CASCADE CHILDREN)
---------------------------------------------------- */
const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Category ID required" });
    }

    const exists = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete children first (single-level, safe)
    await prisma.category.deleteMany({
      where: { parentId: id },
    });

    await prisma.category.delete({
      where: { id },
    });

    return res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("deleteCategory:", error);
    return res.status(500).json({ message: "Failed to delete category" });
  }
};

export {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
}