const assert = require('assert');
const etmjslib = require("etm-js-lib");

let __private = {};

class BlocksImpl {

    static processGenesisBlock(cb) {
        __private.verifyGenesisBlock()
            .then((block) => {
                return __private.saveGenesisBlock(block);
            })
            .then(() => {
                cb();
            })
            .catch(err => {
                cb(err);
            })
        // __private.verifyGenesisBlock((err, block) => {
        //     if (err) {
        //         return cb('verify genesisBlock error: ' + err);
        //     }

        //     __private.saveGenesisBlock(block, cb);
        // });
    }
}


__private.verifyGenesisBlock = async () => {
    let block = library.genesisblock;
    try {
        let payloadHash = etmjslib.crypto.createHash('sha256');
        let payloadLength = 0;

        for (let i = 0; i < block.transactions.length; ++i) {
            let trs = block.transactions[i];
            let bytes = etmjslib.transaction.getBytes(trs);
            payloadLength += bytes.length;
            payloadHash.update(bytes);
        }
        let id = etmjslib.block.getId(block);
        // console.log(`payloadLength: ${payloadLength}`);
        // console.log(`payloadHash: ${payloadHash.digest().toString('hex')}`);
        assert.equal(payloadLength, block.payloadLength, 'Unexpected payloadLength');
        assert.equal(payloadHash.digest().toString('hex'), block.payloadHash, 'Unexpected payloadHash');
        assert.equal(id, block.id, 'Unexpected block id');
    } catch (err) {
        assert(false, 'Failed to verify genesis block: ' + err);
        // return cb(e);
        Promise.reject('Failed to verify genesis block: ' + err);
    }

    return block;
    // cb(null, block);
};

__private.saveGenesisBlock = (block) => {
    library.modules.blocks.getBlocks({
            id: block.id
        })
        .then((blocks) => {
            let blockId = blocks.length && blocks[0].id;
            if (!blockId) { // 数据库中没有创世快
                return library.modules.blocks.saveBlock();
            } else {
                // return cb()
                return;
            }
        })
        .then(() => {
            // 保存创世快中的交易
            let trs = [];
            for (let i = 0, len = block.transactions.length; i < len; i++) {
                trs[i] = block.transactions[i];
                trs[i].blockId = block.id;
            }
            library.modules.transactions.saveTransactions(trs);
        })
        .catch(err => {
            Promise.reject('Failed to save genesis block: ' + err);
        })
    // self.getBlock({ id: block.id }, (err, rows) => {
    //     if (err) {
    //         return cb(err);
    //     }

    //     let blockId = rows.length && rows[0].id;
    //     if (!blockId) {// 数据库中没有创世快
    //         self.saveBlock(block, (err) => {
    //             if (err) {
    //                 return cb(err);
    //             }

    //             // 保存创世快中的交易
    //             let trs = [];
    //             for (let i = 0, len = block.transactions.length; i < len; i++) {
    //                 trs[i] = block.transactions[i];
    //                 trs[i].blockId = block.id;
    //             }
    //             library.modules.transactions.saveTransactions(trs, (err) => {
    //                 cb(err);
    //             });
    //         });
    //     }
    //     else {
    //         cb();
    //     }
    // });
};


module.exports = BlocksImpl;