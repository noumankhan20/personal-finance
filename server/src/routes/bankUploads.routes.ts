import { Router, Request } from "express"
import multer, { FileFilterCallback } from "multer"
import path from "path"

import {
  parseBankStatementController,
  bulkCreateEntriesController,
} from "../controllers/bankUpload.controller"

const router = Router()

/* ============================================================
   MULTER CONFIG
============================================================ */

const upload = multer({
  storage: multer.diskStorage({
    destination: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) => {
      cb(null, "uploads/bank-statements")
    },

    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ) => {
      const ext = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext)
      cb(null, `${base}-${Date.now()}${ext}`)
    },
  }),

  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const allowed =
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    if (allowed) {
      cb(null, true)
    } else {
      cb(new Error("Only Excel files are allowed"))
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

/* ============================================================
   ROUTES
============================================================ */

// Parse & Preview
router.post(
  "/import/parse",
  upload.single("file"),
  parseBankStatementController
)

// Bulk Save
router.post(
  "/import/bulk",
  bulkCreateEntriesController
)

export default router
