const Route = require("express").Router();
const multer = require("multer");
const path = require("path");
const {
    loginUser,
    getAllUser,
    createUser,
    searchUser,
    updateUser,
    deleteUser,
    addToWishlist,
    getUserCart,
    removeItemFromCart
} = require("../Controller/userCTRL");

const storage = multer.diskStorage({
    destination: "./uploads", // Upload folder
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });



Route.post("/loginUser",loginUser);
Route.get("/getAllUser",getAllUser);
Route.post("/createUser",createUser);
Route.post("/searchUser",searchUser);
Route.put("/updateUser/:id",updateUser);
Route.delete("/deleteUser/:id",deleteUser);
Route.post("/addToWishList/:id",addToWishlist);
Route.get("/getUserCart/:id",getUserCart);
Route.delete("/userProductDelete",removeItemFromCart);




module.exports = Route;