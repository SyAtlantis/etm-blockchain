const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let uri = 'mongodb://localhost/etm-blockchain';

let blockSchema = new Schema({
    "version": Number,
    "totalAmount": Number,
    "totalFee": Number,
    "reward": Number,
    "payloadHash": String,
    "timestamp": Number,
    "numberOfTransactions": Number,
    "payloadLength": Number,
    "previousBlock": String,
    "generatorPublicKey": String,
    "transactions": Array,
    "blockSignature": String,
    "id": String,
    "height": Number
});
let accountSchema = new Schema({
    "address": String,
    "publicKey": String,
    "secondPublicKey": String,
    "balance": Number,
    "blockId": String,
    "delegate": Object,//{isDelegate,username,voters:[{voter,totalRights}]}
    "locks": Array,//[{originalHeight,currentHeight,lockAmount,state}]
    "vote": Object,//{rightsList:[{lockTrId,rights}],winner}
});
let transactionSchema = new Schema({
    "type": Number,
    "amount": Number,
    "fee": Number,
    "timestamp": Number,
    "senderPublicKey": String,
    "recipientAddress": String,
    "requesterPublicKey": String,
    "asset": Object,
    "args": Array,
    "signature": String,
    "signatures": Array,
    "signSignature": String,
    "id": String,
    "blockId": String
});

let o_models = {};

class DBMgr {

    connect(cb) {
        mongoose.connect(uri, { useNewUrlParser: true }, (err) => {
            o_models.block = mongoose.model("block", blockSchema);
            o_models.account = mongoose.model("account", accountSchema);
            o_models.transaction = mongoose.model("transaction", transactionSchema);

            cb(err);
        });

        // let conn = mongoose.connection;
        // conn.once('error', (err) => {
        //     cb(err);
        // });
        // conn.once('open', () => {

        //     o_models.block = mongoose.model("block", blockSchema);
        //     o_models.account = mongoose.model("account", accountSchema);
        //     o_models.transaction = mongoose.model("transaction", transactionSchema);
        //     cb();
        // });
    }

    create(modelName, ...restArgs) {
        o_models[modelName].create(...restArgs);
    }

    find(modelName, ...restArgs) {
        o_models[modelName].find(...restArgs);
    }

    findOne(modelName, ...restArgs) {
        o_models[modelName].findOne(...restArgs);
    }

    findMany(modelName, ...restArgs) {
        o_models[modelName].findMany(...restArgs);
    }

    update(modelName, ...restArgs) {
        o_models[modelName].update(...restArgs);
    }

    updateOne(modelName, ...restArgs) {
        o_models[modelName].updateOne(...restArgs);
    }

    udateMany(modelName, ...restArgs) {
        o_models[modelName].udateMany(...restArgs);
    }

    remove(modelName, ...restArgs) {
        o_models[modelName].remove(...restArgs);
    }

    removeOne(modelName, ...restArgs) {
        o_models[modelName].deleteOne(...restArgs);
    }

    removeMany(modelName, ...restArgs) {
        o_models[modelName].deleteMany(...restArgs);
    }

    count(modelName, ...restArgs) {
        o_models[modelName].countDocuments(...restArgs);
    }
}

module.exports = DBMgr;