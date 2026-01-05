// src/routes/entry.routes.ts
import { Router } from "express";
import {
  createEntry,
  createTransfer,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
} from "../controllers/entry.controller";

const router = Router();

router.post("/", createEntry);
router.post("/transfer", createTransfer);

router.get("/", getEntries);
router.get("/:id", getEntryById);

router.put("/:id", updateEntry);
router.delete("/:id", deleteEntry);

export default router;
