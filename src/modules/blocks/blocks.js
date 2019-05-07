const o_impl = require("./blocks_impl");

class Blocks {
    constructor() {

    }

    onBind() {
        library.logger.debug("【start】To deal with genesisblock.");

        o_impl.processGenesisBlock(() => {
            library.logger.debug("【start】Deal with genesisblock ok ！");

            library.logger.info('Send event message ========> 【onLoad】');
            setImmediate(() => library.bus.message('load'));
        });
    }
}

module.exports = Blocks;