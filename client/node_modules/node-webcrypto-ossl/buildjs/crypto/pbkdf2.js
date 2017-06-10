"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Core = require("webcrypto-core");
var key_1 = require("../key");
var native = require("../native");
var aes_1 = require("./aes");
var hmac_1 = require("./hmac");
function b64_decode(b64url) {
    return new Buffer(Core.Base64Url.decode(b64url));
}
var Pbkdf2Crypto = (function (_super) {
    tslib_1.__extends(Pbkdf2Crypto, _super);
    function Pbkdf2Crypto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Pbkdf2Crypto.importKey = function (format, keyData, algorithm, extractable, keyUsages) {
        return new Promise(function (resolve, reject) {
            var formatLC = format.toLocaleLowerCase();
            var alg = algorithm;
            alg.name = alg.name.toUpperCase();
            var raw;
            switch (formatLC) {
                case "jwk":
                    raw = b64_decode(keyData.k);
                    break;
                case "raw":
                    raw = keyData;
                    break;
                default:
                    throw new Core.WebCryptoError("ImportKey: Wrong format value '" + format + "'");
            }
            alg.length = raw.byteLength * 8;
            native.Pbkdf2Key.importKey(raw, function (err, key) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(new key_1.CryptoKey(key, algorithm, "secret", extractable, keyUsages));
                }
            });
        });
    };
    Pbkdf2Crypto.deriveKey = function (algorithm, baseKey, derivedKeyType, extractable, keyUsages) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            return _this.deriveBits(algorithm, baseKey, derivedKeyType.length);
        })
            .then(function (raw) {
            var CryptoClass;
            switch (derivedKeyType.name.toUpperCase()) {
                case Core.AlgorithmNames.AesCBC:
                case Core.AlgorithmNames.AesGCM:
                case Core.AlgorithmNames.AesKW:
                    CryptoClass = aes_1.AesCrypto;
                    break;
                case Core.AlgorithmNames.Hmac:
                    CryptoClass = hmac_1.HmacCrypto;
                    break;
                default:
                    throw new Core.AlgorithmError(Core.AlgorithmError.UNSUPPORTED_ALGORITHM, algorithm.name);
            }
            return CryptoClass.importKey("raw", new Buffer(raw), derivedKeyType, extractable, keyUsages);
        });
    };
    Pbkdf2Crypto.deriveBits = function (algorithm, baseKey, length) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var alg = algorithm;
            var nativeKey = baseKey.native;
            var hash = Core.PrepareAlgorithm(alg.hash);
            var salt = new Buffer(Core.PrepareData(alg.salt, "salt"));
            nativeKey.deriveBits(_this.wc2ssl(hash), salt, alg.iterations, length, function (err, raw) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(raw.buffer);
                }
            });
        });
    };
    Pbkdf2Crypto.wc2ssl = function (algorithm) {
        var alg = algorithm.name.toUpperCase().replace("-", "");
        return alg;
    };
    return Pbkdf2Crypto;
}(Core.BaseCrypto));
exports.Pbkdf2Crypto = Pbkdf2Crypto;
