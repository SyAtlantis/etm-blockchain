"use strict";

const fs = require("fs");
const path = require("path");
const async = require('async');
const SocketIO = require("socket.io");
const program = require("commander");
const Koa = require("koa");
const KoaRouter = require("koa-router");

const Logger = require("./src/utils/logger");
const Bus = require("./src/utils/bus");

const modules = new Map([
    ["blocks", "./src/modules/blocks"],
    ["accounts", "./src/modules/accounts"],
    ["transactions", "./src/modules/transactions"],
    ["test", "./src/modules/test"],
]);


let _init = async opt => {
    // logger
    // let logger = new Logger({
    //     filename: path.resolve(__dirname, "logs", "koa.log"),
    //     echo: program.deamon ? null : "debug",
    //     errorLevel: "debug"
    // });
    // library.logger = logger;
    // library.logger.info(`【App init logger】 logger is ok.`);

    // // modules
    // library.modules = [];
    // for (let [name, module] of modules) {
    //     try {
    //         const ClzModule = require(module);
    //         const inst = new ClzModule();
    //         // inst && await inst.init(opt);
    //         library.modules.push(inst);
    //         library.logger.info(`【App init modules】 module(${name}) inited`);
    //     } catch (error) {
    //         library.logger.error(`【App init modules】 module(${name}) init failure, `, error);
    //     }
    // }

    // // event bus
    // let bus = new Bus(library.modules);
    // library.bus = bus;
    // library.logger.info(`【App init event】event bus is ok.`);
}

let _setup = async opt => {
    let app = new Koa();


    async.auto({
        config: () => {
            console.log("config");
        },
        logger: () => {
            console.log("logger");
            let logger = new Logger({
                filename: path.resolve(__dirname, "logs", "koa.log"),
                echo: program.deamon ? null : "debug",
                errorLevel: "debug"
            });
            library.logger = logger;
            library.logger.info(`【App init logger】 logger is ok.`);
        },
        modules: ["config", (cb) => {
            console.log("modules");
            library.modules = [];
            for (let [name, module] of modules) {
                try {
                    const ClzModule = require(module);
                    const inst = new ClzModule();
                    // inst && await inst.init(opt);
                    library.modules.push(inst);
                    library.logger.info(`【App init modules】 module(${name}) inited`);
                } catch (error) {
                    library.logger.error(`【App init modules】 module(${name}) init failure, `, error);
                }
            }
        }],
        bus: ["config", "modules", () => {
            console.log("bus");
            let bus = new Bus(library.modules);
            library.bus = bus;
            library.logger.info(`【App init event】event bus is ok.`);
        }],
        router: ["config", () => {
            console.log("router");
            const apiDir = path.resolve(__dirname, "src", "api");
            const APIs = fs.readdirSync(apiDir);
            const router = new KoaRouter();
            APIs.forEach(el => {
                if (el.endsWith(".js")) {
                    const APIModule = require(path.resolve(apiDir, el));
                    APIModule(router);
                }
            });
            app.use(router.routes());
        }],
        server: ["config", () => {
            console.log("server");
            const server = app.listen(opt.port, opt.host, () => {
                library.logger.info(`【Server】 Listening on ${opt.host}:${opt.port}.`);
            });

            const socketio = SocketIO(server);
        }],
        socket: () => {
            console.log("socket");

        },
    }, () => {
        // library.logger.info('Send event message ========> 【onBind】');
        // setImmediate(() => library.bus.message('bind'));
    });

    // router
    // const apiDir = path.resolve(__dirname, "src", "api");
    // const APIs = fs.readdirSync(apiDir);
    // const router = new KoaRouter();
    // APIs.forEach(el => {
    //     if (el.endsWith(".js")) {
    //         const APIModule = require(path.resolve(apiDir, el));
    //         APIModule(router);
    //     }
    // });
    // app.use(router.routes());

    // // server listening
    // const server = app.listen(opt.port, opt.host, () => {
    //     library.logger.info(`【Server】 Listening on ${opt.host}:${opt.port}.`);
    // });

    // // socket
    // const socketio = SocketIO(server);
}

function main() {
    global.library = {};

    program.version("1.0.0")
        .option("--host <host>", "service host", "127.0.0.1")
        .option("--port <port>", "service port", 30000)
        .parse(process.argv)

    let opt = {};
    opt.host = program.host;
    opt.port = Number(program.port);

    _init(opt)
        .then(() => {
            return _setup(opt);
        })
        .then(() => {
            // library.logger.info('Send event message ========> 【onBind】');
            // setImmediate(() => library.bus.message('bind'));

            process.emit("app-ready");
        })
        .then(() => {
            process.on("error", error => {
                library.logger.error(`[Application] error: ${error.toString()}`);
            });

            process.on("uncaughtException", error => {
                library.logger.error(`[UncaughtException] ${error.toString()}`);
                process.emit("app-cleanup");
            });
            process.on("unhandledRejection", (reason, promise) => {
                void promise;
                library.logger.error(`[UnhandledRejection] ${reason}`);
            });
            process.on("rejectionHandled", promise => {
                void promise;
                library.logger.error("[RejectionHandled] happended.");
            });

            process.on("SIGTERM", signal => {
                void signal;
                process.emit("app-cleanup");
            });
            process.on("SIGINT", signal => {
                void signal;
                process.emit("app-cleanup");
            });
            process.on("app-cleanup", () => {
                library.logger.info('Cleaning up...');

                //TODO: modules clean up
                library.logger.info('Cleaned up successfully');

                process.exit();
            });

            process.once('exit', () => {
                library.logger.info('process exited');
            });
        })
        .catch(() => {
            library.logger.error("[App] start error:", error);
        });
}

main();