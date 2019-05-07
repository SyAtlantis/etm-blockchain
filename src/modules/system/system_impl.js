class SystemImpl {

    static loadBlockchain(cb) {

        setTimeout(() => {

            library.logger.log("############# TODO：In loading blockchain...");
            cb();

        }, 1000);
    }

    static loop(cb) {
        library.logger.log("############# TODO：looping.......");
        cb();
    }
}

module.exports = SystemImpl;