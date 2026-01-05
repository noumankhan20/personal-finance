import Router from "express"
import { 
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,

} from "../controllers/categories.controller"

const router = Router();

router.post("/create",createCategory)

router.get("/get",getCategories)

router.put("/:id/update",updateCategory)

router.delete("/:id/delete",deleteCategory)


const categoriesRoutes = router;
export default categoriesRoutes;
