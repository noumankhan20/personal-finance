import Router from "express";
import {
    getAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount
} from "../controllers/accounts.controller"

const router = Router();

router.get("/get",getAccounts)

router.post("/create",createAccount)

router.get("/get/:id",getAccountById)

router.put("/:id/update",updateAccount)

router.delete("/:id/delete",deleteAccount)

const acccountsRoutes = router;
export default acccountsRoutes;