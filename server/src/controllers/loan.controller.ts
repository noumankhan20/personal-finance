import { Request, Response } from "express";
import { prisma } from "../config/db.config";

/* -----------------------------------------------------
   CREATE LOAN
   POST /api/loans
----------------------------------------------------- */
const createLoan = async (req: Request, res: Response) => {
  try {
    const {
      personName,
      loanType,
      principal,
      interestRate,
      interestType,
      startDate,
      notes,
    } = req.body;

    const loan = await prisma.loan.create({
      data: {
        personName,
        loanType,
        principal,
        interestRate,
        interestType,
        startDate: new Date(startDate),
        notes,
      },
    });

    return res.status(201).json(loan);
  } catch (error) {
    console.error("createLoan:", error);
    return res.status(500).json({ message: "Failed to create loan" });
  }
};


/* -----------------------------------------------------
   GET ALL LOANS (WITH REPAYMENTS)
   GET /api/loans
----------------------------------------------------- */
const getLoans = async (_req: Request, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      include: { repayments: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(loans);
  } catch (error) {
    console.error("getLoans:", error);
    return res.status(500).json({ message: "Failed to fetch loans" });
  }
};



/* -----------------------------------------------------
   GET SINGLE LOAN
   GET /api/loans/:id
----------------------------------------------------- */
const getLoanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { repayments: true },
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    return res.json(loan);
  } catch (error) {
    console.error("getLoanById:", error);
    return res.status(500).json({ message: "Failed to fetch loan" });
  }
};



/* -----------------------------------------------------
   UPDATE LOAN
   PUT /api/loans/:id
----------------------------------------------------- */
const updateLoan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data: any = { ...req.body };

    if (req.body.startDate) {
      data.startDate = new Date(req.body.startDate);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data,
    });

    return res.json(updatedLoan);
  } catch (error) {
    console.error("updateLoan:", error);
    return res.status(500).json({ message: "Failed to update loan" });
  }
};


/* -----------------------------------------------------
   DELETE LOAN (CASCADE REPAYMENTS)
   DELETE /api/loans/:id
----------------------------------------------------- */
const deleteLoan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.loan.delete({ where: { id } });

    return res.json({ message: "Loan deleted successfully" });
  } catch (error) {
    console.error("deleteLoan:", error);
    return res.status(500).json({ message: "Failed to delete loan" });
  }
};


export {
    createLoan,
    getLoans,
    getLoanById,
    updateLoan,
    deleteLoan
}