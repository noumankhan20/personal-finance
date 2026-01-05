import { Request, Response } from "express";
import { prisma } from "../config/db.config";
import { EntryType } from "@prisma/client";
import { randomUUID } from "crypto";


function getBalanceDelta(entryType: EntryType, amount: number) {
  switch (entryType) {
    case EntryType.expense:
      return -Math.abs(amount)
    case EntryType.income:
      return Math.abs(amount)
    default:
      throw new Error("Invalid entry type for balance delta")
  }
}


/**
 * CREATE Expense / Income Entry
 */
export const createEntry = async (req: Request, res: Response) => {
  try {
    const {
      entryType,
      date,
      amount,
      description,
      notes,
      accountId,
      categoryId,
      linkedLoanId,
    } = req.body

    if (!entryType || !date || !amount || !accountId || !description) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    if (entryType === EntryType.transfer) {
      return res
        .status(400)
        .json({ message: "Use transfer endpoint for transfers" })
    }

    const numericAmount = Math.abs(Number(amount))
    const balanceDelta = getBalanceDelta(entryType, numericAmount)

    const [entry] = await prisma.$transaction([
      prisma.entry.create({
        data: {
          entryType,
          date: new Date(date),
          amount: numericAmount,
          description,
          notes,
          accountId,
          categoryId: categoryId || null,
          linkedLoanId: linkedLoanId || null,
        },
      }),

      prisma.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            increment: balanceDelta,
          },
        },
      }),
    ])

    res.status(201).json(entry)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to create entry" })
  }
}


/**
 * CREATE Transfer (atomic)
 */
export const createTransfer = async (req: Request, res: Response) => {
  try {
    const {
      date,
      amount,
      description,
      notes,
      fromAccountId,
      toAccountId,
    } = req.body

    if (!date || !amount || !fromAccountId || !toAccountId) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ message: "Accounts must be different" })
    }

    const numericAmount = Math.abs(Number(amount))
    const transferGroupId = randomUUID()

    const [debitEntry, creditEntry] = await prisma.$transaction([
      // Debit entry (from account)
      prisma.entry.create({
        data: {
          entryType: EntryType.transfer,
          date: new Date(date),
          amount: -numericAmount,
          description,
          notes,
          accountId: fromAccountId,
          counterAccountId: toAccountId,
          transferGroupId,
        },
      }),

      // Credit entry (to account)
      prisma.entry.create({
        data: {
          entryType: EntryType.transfer,
          date: new Date(date),
          amount: numericAmount,
          description,
          notes,
          accountId: toAccountId,
          counterAccountId: fromAccountId,
          transferGroupId,
        },
      }),

      // Update FROM account balance
      prisma.account.update({
        where: { id: fromAccountId },
        data: {
          currentBalance: {
            decrement: numericAmount,
          },
        },
      }),

      // Update TO account balance
      prisma.account.update({
        where: { id: toAccountId },
        data: {
          currentBalance: {
            increment: numericAmount,
          },
        },
      }),
    ])

    res.status(201).json({
      transferGroupId,
      debitEntry,
      creditEntry,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to create transfer" })
  }
}


/**
 * GET All Entries
 */
export const getEntries = async (_req: Request, res: Response) => {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { date: "desc" },
      include: {
        account: true,
        category: true,
      },
    });

    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch entries" });
  }
};

/**
 * GET Single Entry
 */
export const getEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
      },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch entry" });
  }
};

/**
 * UPDATE Entry (non-transfer)
 */
export const updateEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      date,
      description,
      amount,
      categoryId,
      notes,
    } = req.body;

    const entry = await prisma.entry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    if (entry.entryType === EntryType.transfer) {
      return res
        .status(400)
        .json({ message: "Transfers cannot be updated" });
    }

    const updated = await prisma.entry.update({
      where: { id },
      data: {
        // ✅ CRITICAL FIX
        date: date ? new Date(date) : undefined,

        description,
        amount,
        categoryId: categoryId ?? null,
        notes,
      },
      include: {
        account: true,
        category: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update entry" });
  }
};


/**
 * DELETE Entry
 */
export const deleteEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await prisma.entry.findUnique({ where: { id } });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    if (entry.entryType === EntryType.transfer && entry.transferGroupId) {
      await prisma.entry.deleteMany({
        where: { transferGroupId: entry.transferGroupId },
      });
    } else {
      await prisma.entry.delete({ where: { id } });
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete entry" });
  }
};
