import Router from "express";
import {
    createLoan,
    getLoans,
    getLoanById,
    updateLoan,
    deleteLoan
} from "../controllers/loan.controller"

const router = Router ();

router.post("/create",createLoan)

router.get("/get",getLoans)

router.get("/:id/get",getLoanById)

router.put("/:id/update",updateLoan)

router.delete("/:id/delete",deleteLoan)

const loanRoutes = router;
export default loanRoutes;