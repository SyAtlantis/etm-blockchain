"use strict";

const Ajv = require("ajv");
let ajv = new Ajv();

let Test = async ctx => {
    ctx.body = {
        success: true,
        data: "test success"
    };
}

module.exports = (router) => {
    router.get("/test", Test);
};