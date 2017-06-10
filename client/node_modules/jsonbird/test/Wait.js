'use strict';

class Wait {
    constructor() {
        this.count = 0;
        this.waits = new Set();
    }

    advance() {
        ++this.count;

        // eslint-disable-next-line prefer-const
        for (let wait of this.waits) {
            if (wait[0] <= this.count) {
                wait[1]();
                this.waits.delete(wait);
            }
        }
    }

    wait(n) {
        return new Promise(resolve => this.waits.add([this.count + n, resolve]));
    }
}

module.exports = Wait;
