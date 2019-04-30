
const EventEmitter = require('events');
const changeCase = require('change-case');

let _modules = [];

class Bus extends EventEmitter {
    constructor(modules) {
        _modules = modules;
        let bus = new BusEvent;
        return bus;
    }
}

class BusEvent extends EventEmitter {

    message(topic, ...restArgs) {
        for (let module of _modules) {
            let eventName = 'on' + changeCase.pascalCase(topic);
            if (typeof (module[eventName]) === 'function') {
                module[eventName].apply(module[eventName], [...restArgs]);
            }
        }
        this.emit(topic, ...restArgs)
    }

}

module.exports = Bus;