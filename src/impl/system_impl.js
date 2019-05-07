class SystemImpl {

    static loadBlockchain(cb) {

        setTimeout(() => {

            library.logger.trace("############# TODO：In loading blockchain...");
            cb();

        }, 1000);
    }

    static loop(cb) {
        library.logger.trace("############# TODO：looping.......");
        cb();
    }
}

module.exports = SystemImpl;