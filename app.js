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
const DBMgr = require("./src/utils/dbMgr");

const _modules = new Map([
    ["blocks", "./src/modules/blocks"],
    ["accounts", "./src/modules/accounts"],
    ["transactions", "./src/modules/transactions"],
    ["system", "./src/modules/system"],
    ["test", "./src/modules/test"],
]);

// let baseDir = program.base || path.resolve('.');
// let pidFile = path.join(baseDir, 'etm.pid');

let _init = async opt => {
    let program = opt.program;

    // 配置logger
    let logger = new Logger({
        filename: path.resolve(__dirname, "logs", "etm.log"),
        echo: program.deamon ? null : opt.logLevel,
        errorLevel: opt.logLevel
    });
    library.logger = logger;

    // 控制单个线程
    let pidFile = path.join(__dirname, 'etm.pid');
    if (fs.existsSync(pidFile)) {
        library.logger.error('Failed: etm server already started.');
        return;
    }
    if (program.daemon) {
        library.logger.log('etm server started as daemon ...');
        require('daemon')({ cwd: process.cwd() });
        fs.writeFileSync(pidFile, process.pid, 'utf8');
    }

    // 读入genesisBlock配置文件
    let genesisblockFile = path.resolve(__dirname, 'config', 'genesisBlock-personal.json');
    if (program.genesisblock) {
        genesisblockFile = path.resolve(process.cwd(), program.genesisblock);
    }
    let genesisblock = JSON.parse(fs.readFileSync(genesisblockFile, 'utf8'));
    library.genesisblock = genesisblock;

};

let _ready = async () => {
    process.emit("app-ready");

    process.on("error", error => {
        library.logger.error(`[Application] error: ${error.toString()}`);
    });

    process.on("uncaughtException", error => {
        library.logger.error(`[UncaughtException] ${error.toString()}`);
        process.emit("app-close");
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
        process.emit("app-close");
    });
    process.on("SIGINT", signal => {
        void signal;
        process.emit("app-close");
    });

    process.on("app-close", () => {
        library.logger.info('Cleaning up...');

        //TODO: modules clean up and db close
        library.logger.info('Cleaned up successfully');

        process.exit();
    });

    process.once('exit', () => {
        library.logger.info('process exited');
    });
};

let _setup = async opt => {
    let app = new Koa();

    async.auto({
        logger: (cb) => {
            // let logger = new Logger({
            //     filename: path.resolve(__dirname, "logs", "etm.log"),
            //     echo: program.deamon ? null : "trace",
            //     errorLevel: "trace"
            // });
            // library.logger = logger; // 绑定到全局
            // library.logger.info(`【App setup logger】 logger is ok.`);

            // cb(null, logger);
            cb();
        },
        db: ["logger", (res, cb) => {
            let db = new DBMgr();
            db.connect((err) => {
                if (err) {
                    return cb(err);
                }

                library.db = db; // 绑定到全局
                library.logger.info(`【App setup db】 db connect ok!`);

                cb(null, db);
            });
        }],
        modules: ["logger", (res, cb) => {
            let modules = {};
            for (let [name, module] of _modules) {
                try {
                    const ClzModule = require(module);
                    const inst = new ClzModule();
                    modules[name] = inst;
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

            cb(null, socketio);
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

            cb();
        }],
        // end: ["logger", "server", (res, cb) => {
        // }]
    }, (err, res) => {
        if (err) {
            library.logger.fatal(`【App setup error】 ${err}`);
            process.emit("app-close");
        }

        library.logger.log('Send event message ========> 【onBind】');
        setImmediate(() => library.bus.message('bind'));
    });
};

(() => {
    global.library = {};

    program.version("1.0.0")
        .option("--host <host>", "service host", "127.0.0.1")
        .option("--port <port>", "service port", 30000)
        .parse(process.argv)

    let opt = {};
    opt.host = program.host;
    opt.port = Number(program.port);

    opt.logLevel = "trace";
    opt.program = program;

    _init(opt)
        .then(() => {
            return _ready();
        })
        .then(() => {
            return _setup(opt);
        })
        .catch(err => {
            library.logger.error(`【App start error】 ${err}`);
            process.emit("app-close");
        });
})();