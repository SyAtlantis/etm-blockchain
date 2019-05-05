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

const _modules = new Map([
    ["blocks", "./src/modules/blocks"],
    ["accounts", "./src/modules/accounts"],
    ["transactions", "./src/modules/transactions"],
    ["test", "./src/modules/test"],
]);


let _init = async opt => {
}

let _setup = async opt => {
    let app = new Koa();

    async.auto({
        logger: (cb) => {
            let logger = new Logger({
                filename: path.resolve(__dirname, "logs", "koa.log"),
                echo: program.deamon ? null : "debug",
                errorLevel: "debug"
            });
            library.logger = logger; // 绑定到全局
            library.logger.info(`【App setup logger】 logger is ok.`);

            cb(null, logger);
        },
        modules: ["logger", (res, cb) => {
            let modules = [];
            for (let [name, module] of _modules) {
                try {
                    const ClzModule = require(module);
                    const inst = new ClzModule();
                    modules.push(inst);
                    library.logger.info(`【App setup modules】 module(${name}) inited`);
                } catch (error) {
                    library.logger.error(`【App setup modules】 module(${name}) init failure, `, error);
                }
            }
            library.modules = modules; // 绑定到全局

            cb(null, modules);
        }],
        bus: ["logger", "modules", (res, cb) => {
            let bus = new Bus(res.modules);
            library.bus = bus; // 绑定到全局
            library.logger.info(`【App setup bus】event bus is ok.`);

            cb(null, bus);
        }],
        server: ["logger", (res, cb) => {
            let server = app.listen(opt.port, opt.host, () => {
                library.logger.info(`【App setup server】 Server Listening on ${opt.host}:${opt.port}.`);
                cb(null, server);
            });
        }],
        socket: ["logger", "server", (res, cb) => {
            const socketio = SocketIO(res.server);

            cb(null);
        }],
        router: ["logger", "server", (res, cb) => {
            try {
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

                library.logger.info(`【App setup router】 router is ok.`);
            } catch (error) {
                library.logger.error(`【App setup router】 Error:${error} `);
            }

            cb(null);
        }],
        // end: ["logger", "server", (res, cb) => {
        // }]
    }, (err, res) => {
        if (err) {
            library.logger.error(`【App setup error】 ${err}`);
        }

        library.logger.info('Send event message ========> 【onBind】');
        setImmediate(() => library.bus.message('bind'));
    });
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