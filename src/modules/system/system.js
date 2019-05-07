const o_impl = require("./system_impl");

class System {
    constructor() {

    }

    onLoad() {
        library.logger.debug("【start】To load blockchain.");

        o_impl.loadBlockchain(() => {
            library.logger.debug("【start】Load blockchain ok！");

            library.logger.info('Send event message ========> 【onReady】');
            setImmediate(() => library.bus.message('ready'));
        });
    }

    loop() {
        library.logger.debug("【start】In the looping.");

        (function nextLoop() {
            o_impl.loop(() => {
                setTimeout(nextLoop, 3000);
            });
        })();
    }

}

module.exports = System;