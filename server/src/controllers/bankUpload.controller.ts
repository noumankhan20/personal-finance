import { Request, Response } from "express";
import XLSX from "xlsx";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.config";

/* ============================================================
   TYPES
============================================================ */

type ParsedEntry = {
  tempId: `${string}-${string}-${string}-${string}-${string}`
  entryType: "income" | "expense"
  date: string
  amount: number
  description: string
  notes: string | null
  accountId: null
  categoryId: null
}


/* ============================================================
   HELPERS
============================================================ */

function parseHdfcDateFromRow(row: any): Date | null {
  const dateStr = row["Date"];

  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    return null;
  }

  let [day, month, year] = parts;

  // ✅ HANDLE 2-DIGIT YEAR (HDFC FORMAT)
  if (year.length === 2) {
    const yr = Number(year);
    year = yr >= 70 ? `19${year}` : `20${year}`;
  }

  const iso = `${year}-${month}-${day}T00:00:00.000Z`;
  const date = new Date(iso);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}


function parseAmount(value: any): number {
  if (!value) return 0;

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/-/g, "");

  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function getEntryTypeAndAmount(row: any) {
  const withdrawal = parseAmount(row["Withdrawal Amt."]);
  const deposit = parseAmount(row["Deposit Amt."]);

  // Ignore rows with no movement
  if (withdrawal === 0 && deposit === 0) {
    return null;
  }

  if (deposit > 0) {
    return { entryType: "income" as const, amount: deposit };
  }

  return { entryType: "expense" as const, amount: withdrawal };
}

function parseXls(filePath: string): any[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Read entire sheet as raw rows
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  // Find the header row by exact HDFC columns
  const headerRowIndex = rows.findIndex(
    (row) =>
      row.includes("Date") &&
      row.includes("Narration") &&
      row.includes("Withdrawal Amt.") &&
      row.includes("Deposit Amt.")
  );

  if (headerRowIndex === -1) {
    throw new Error("HDFC transaction header row not found");
  }

  // Convert rows below header into objects
  return XLSX.utils.sheet_to_json(sheet, {
    range: headerRowIndex,
    raw: false,
    defval: null,
  });
}

/* ============================================================
   INTERNAL CREATE ENTRY (REUSED LOGIC)
============================================================ */

async function createEntryInternal(data: {
  entryType: "income" | "expense" | "transfer";
  date: string;
  amount: number;
  description: string;
  notes?: string;
  accountId: string;
  categoryId?: string | null;
}) {
  return prisma.entry.create({
    data: {
      entryType: data.entryType,
      date: new Date(data.date),
      amount: new Prisma.Decimal(data.amount),
      description: data.description,
      notes: data.notes ?? null,
      account: { connect: { id: data.accountId } },
      category: data.categoryId
        ? { connect: { id: data.categoryId } }
        : undefined,
    },
  });
}

/* ============================================================
   CONTROLLER 1: PARSE & PREVIEW
============================================================ */

export const parseBankStatementController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const rows = parseXls(req.file.path);
    console.log("First row keys:", Object.keys(rows[0] || {}));

    const entries = rows
      .map((row) => {
        const result = getEntryTypeAndAmount(row);
        if (!result) return null;

        const dateValue = parseHdfcDateFromRow(row);
        if (dateValue === null) return null;

        return {
          tempId: crypto.randomUUID(),
          entryType: result.entryType,
          date: dateValue.toISOString(),
          amount: result.amount,
          description: row["Narration"]?.trim() || "",
          notes: row["Chq./Ref.No."] || null,
          accountId: null,
          categoryId: null,
        };
      })
      .filter((e): e is ParsedEntry => e !== null);

    res.json({ count: entries.length, entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to parse statement" });
  }
};

/* ============================================================
   CONTROLLER 2: BULK CREATE
============================================================ */

export const bulkCreateEntriesController = async (
  req: Request,
  res: Response
) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: "Entries array required" });
    }

    const results = [];

    for (const entry of entries) {
      try {
        const created = await createEntryInternal(entry);
        results.push({ success: true, id: created.id });
      } catch (e: any) {
        results.push({ success: false, error: e.message });
      }
    }

    res.json({
      total: entries.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (err) {
    res.status(500).json({ message: "Bulk create failed" });
  }
};
