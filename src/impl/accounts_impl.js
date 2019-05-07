class AccountsImpl {

    static loadMyKeypair(cb) {
        setTimeout(() => {

            library.logger.trace("############# TODO：In load my keypair ...");
            cb();

        }, 1000);
    }

}

module.exports = AccountsImpl;