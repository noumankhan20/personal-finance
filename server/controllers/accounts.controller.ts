import { prisma } from "../config/db.config"
import { Request, Response } from "express";

/**
 * GET /accounts
 * Fetch all accounts
 */
const getAccounts = async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(accounts);
  } catch (error) {
    console.error("GET_ACCOUNTS_ERROR", error);
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

/**
 * GET /accounts/:id
 * Fetch single account
 */
const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json(account);
  } catch (error) {
    console.error("GET_ACCOUNT_ERROR", error);
    res.status(500).json({ message: "Failed to fetch account" });
  }
};

/**
 * POST /accounts
 * Create new account
 */
const createAccount = async (req: Request, res: Response) => {
  try {
    const {
      accountname,
      accountType,
      description,
      openingBalance,
    } = req.body;

    const data = {
      accountname,
      accountType,
      description: description || null,
      openingBalance,
      currentBalance: openingBalance,
    };

    const account = await prisma.account.create({ data });

    res.status(201).json(account);
  } catch (error) {
    console.error("CREATE_ACCOUNT_ERROR", error);
    res.status(500).json({ message: "Failed to create account" });
  }
};

/**
 * PUT /accounts/:id
 * Update account (no balance mutation here)
 */
const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      accountname,
      accountType,
      description,
    } = req.body;

    const data: any = {
      accountname,
      accountType,
    };

    if (description !== undefined) {
      data.description = description === "" ? null : description;
    }

    const account = await prisma.account.update({
      where: { id },
      data,
    });

    res.status(200).json(account);
  } catch (error: any) {
    console.error("UPDATE_ACCOUNT_ERROR", error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(500).json({ message: "Failed to update account" });
  }
};

/**
 * DELETE /accounts/:id
 * Delete account
 */
const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.account.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error("DELETE_ACCOUNT_ERROR", error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(500).json({ message: "Failed to delete account" });
  }
};



export {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
}   