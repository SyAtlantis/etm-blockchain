class Accounts {
    constructor() {
        library.logger.info("constructor in Accounts");
    }

    onBind() {
        library.logger.info('Send event message ========> 【onLoad】');
        setImmediate(() => library.bus.message('load'));
    }

    onLoad() {
        library.logger.info('Send event message ========> 【onReady】');
        setImmediate(() => library.bus.message('ready'));
    }

    onReady() {
        // library.logger.debug("Load my delegates is ok!");
        // setImmediate(() => library.modules.system.loop());
    }

}

module.exports = Accounts;