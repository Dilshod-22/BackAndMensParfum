const Route = require("express").Router();
const multer = require("multer");



const {
    getCategory,
    searchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    takeProduct,
    imageFileUploadAssist,
    addToShoppingCart,
    // totalPagePagination
getProductsAdmin
} = require("../Controller/productCTRl");



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



Route.get("/get/categoriya",getCategory);
Route.post("/searchProduct",searchProduct);
Route.post("/createProduct", upload.array("productimage"),createProduct);
Route.put("/updateProduct/:id",upload.single("productimage"),updateProduct);
Route.delete("/deleteProduct/:id",deleteProduct);
Route.get("/get/ProdcutsMix",getProducts);
Route.get("/get/ProdcutsAdmin",getProductsAdmin);
Route.post("/takeProductInfo/:id",takeProduct);
Route.post("/imageUploadProduct",upload.single("productimage"),imageFileUploadAssist);
Route.post("/addToshoppingCart",addToShoppingCart);
// Route.get("/get/getTotalPage",totalPagePagination);

 
module.exports = Route;
