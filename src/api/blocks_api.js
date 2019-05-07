"use strict";

const Ajv = require("ajv");
let ajv = new Ajv();

let getHeight = async ctx => {
    ctx.body = {
        success: true,
        data: "test success"
    };
}

module.exports = router => {
    router.get("/test", getHeight);
};