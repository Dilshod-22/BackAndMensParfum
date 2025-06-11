const express=require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongodb = require("./config/mongooseConnection")

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));

const UserRoute = require("./Routers/userRouter");
const ProductRoute = require("./Routers/productRouter");
const AdminPanel = require("./Routers/adminRouter");
const OrderRoute = require("./Routers/orderRouter");

app.use("/api/user/",UserRoute);
app.use("/api/product/",ProductRoute);
app.use("/api/admin/",AdminPanel);
app.use("/api/order/",OrderRoute);

app.get("/",(req,res)=>{
    res.json("api is working").end();
});

const PORT = process.env.PORT || 8000;

app.listen(PORT,()=>{
    console.log("server is running");
})