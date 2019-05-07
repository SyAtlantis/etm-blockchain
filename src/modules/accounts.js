const o_impl = require("../impl/accounts_impl");

class Accounts {
    constructor() {

    }

    onReady() {
        library.logger.debug("【start】To load my keypair.");

        o_impl.loadMyKeypair(() => {
            library.logger.debug("【start】Load my keypair ok！");

            library.logger.debug("【start】Entering the loop.");
            setImmediate(() => library.modules.system.loop());
        });
    }

}

module.exports = Accounts;