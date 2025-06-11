const Route = require("express").Router();

const {
    getBaseInfo,

} = require("../Controller/adminCTRL");

Route.get("/get/baseInfo",getBaseInfo);


module.exports = Route;