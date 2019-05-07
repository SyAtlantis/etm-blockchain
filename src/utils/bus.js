
const EventEmitter = require('events');
const changeCase = require('change-case');

let _modules = {};

class Bus extends EventEmitter {
    constructor(modules) {
        _modules = modules;
        let bus = new BusEvent;
        return bus;
    }
}

class BusEvent extends EventEmitter {

    message(topic, ...restArgs) {
        for (let moduleName in _modules) {
            let eventName = 'on' + changeCase.pascalCase(topic);
            let eventFn = _modules[moduleName][eventName];
            if (typeof (eventFn) === 'function') {
                eventFn.apply(eventFn, [...restArgs]);
            }
        }
        this.emit(topic, ...restArgs);
    }

}

module.exports = Bus;