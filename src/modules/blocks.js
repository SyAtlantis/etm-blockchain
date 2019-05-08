const o_impl = require("../impl/blocks_impl");

class Blocks {
    constructor() {

    }

    onBind() {
        library.logger.debug("【start】To process genesisblock.");

        o_impl.processGenesisBlock((err) => {
            if (err) {
                throw Error(err);
            }

            library.logger.debug("【start】Process genesisblock ok ！");

            library.logger.log('Send event message ========> 【onLoad】');
            setImmediate(() => library.bus.message('load'));
        });
    }

    async getBlocks(filter, ...restArgs) {
        return [1, 2, 3];
    }

    async saveBlock(block) {
        // return {}
    }
}

module.exports = Blocks;