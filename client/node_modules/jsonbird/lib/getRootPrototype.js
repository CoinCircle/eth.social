'use strict';

module.exports = object => {
    let proto = Object.getPrototypeOf(object);

    if (!proto) { // e.g. Object.create(null)
        return null;
    }

    while (1) {
        const parent = Object.getPrototypeOf(proto);

        if (!parent) {
            return proto;
        }

        proto = parent;
    }
};
