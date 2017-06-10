/* globals window */
'use strict';

const FIREFOX_PROTO_MODIFICATION = /mutating the \[\[Prototype]] of an object will cause your code to run very slowly/i;

module.exports = () => {
        // this is caused by https://github.com/feross/buffer/blob/master/index.js#L47 on old firefox
        // this warning is removed in newer firefox versions
        const onerror = window.onerror;
        window.onerror = function(msg) {
                if (FIREFOX_PROTO_MODIFICATION.test(msg)) {
                        return;
                }

                onerror.apply(this, arguments); // eslint-disable-line prefer-rest-params
        };
};
