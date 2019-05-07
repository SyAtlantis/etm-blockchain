class BlocksImpl {

    static processGenesisBlock(cb) {
        setTimeout(() => {

            library.logger.trace("############# TODO：In process genesisblock ...");
            cb();

        }, 1000);
    }
}

module.exports = BlocksImpl;