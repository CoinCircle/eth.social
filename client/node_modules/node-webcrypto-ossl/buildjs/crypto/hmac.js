"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var webcrypto = require("webcrypto-core");
var AlgorithmError = webcrypto.AlgorithmError;
var WebCryptoError = webcrypto.WebCryptoError;
var AlgorithmNames = webcrypto.AlgorithmNames;
var BaseCrypto = webcrypto.BaseCrypto;
var Base64Url = webcrypto.Base64Url;
var key_1 = require("../key");
var native = require("../native");
function b64_decode(b64url) {
    return new Buffer(Base64Url.decode(b64url));
}
var HmacCrypto = (function (_super) {
    tslib_1.__extends(HmacCrypto, _super);
    function HmacCrypto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HmacCrypto.generateKey = function (algorithm, extractable, keyUsages) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var length = algorithm.length || _this.getHashSize(algorithm.hash.name);
            native.HmacKey.generate(length, function (err, key) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(new key_1.CryptoKey(key, algorithm, "secret", extractable, keyUsages));
                }
            });
        });
    };
    HmacCrypto.importKey = function (format, keyData, algorithm, extractable, keyUsages) {
        return new Promise(function (resolve, reject) {
            var formatLC = format.toLocaleLowerCase();
            var raw;
            switch (formatLC) {
                case "jwk":
                    raw = b64_decode(keyData.k);
                    break;
                case "raw":
                    raw = keyData;
                    break;
                default:
                    throw new WebCryptoError("ImportKey: Wrong format value '" + format + "'");
            }
            native.HmacKey.import(raw, function (err, key) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(new key_1.CryptoKey(key, algorithm, "secret", extractable, keyUsages));
                }
            });
        });
    };
    HmacCrypto.exportKey = function (format, key) {
        return new Promise(function (resolve, reject) {
            var nativeKey = key.native;
            switch (format.toLocaleLowerCase()) {
                case "jwk":
                    var jwk_1 = {
                        kty: "oct",
                        alg: "",
                        key_ops: ["sign", "verify"],
                        k: "",
                        ext: true,
                    };
                    jwk_1.alg = "HS" + /-(\d+)$/.exec(key.algorithm.hash.name)[1];
                    nativeKey.export(function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            jwk_1.k = Base64Url.encode(data);
                            resolve(jwk_1);
                        }
                    });
                    break;
                case "raw":
                    nativeKey.export(function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(data.buffer);
                        }
                    });
                    break;
                default: throw new WebCryptoError("ExportKey: Unknown export format '" + format + "'");
            }
        });
    };
    HmacCrypto.sign = function (algorithm, key, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var alg = _this.wc2ssl(key.algorithm);
            var nativeKey = key.native;
            nativeKey.sign(alg, data, function (err, signature) {
                if (err) {
                    reject(new WebCryptoError("NativeError: " + err.message));
                }
                else {
                    resolve(signature.buffer);
                }
            });
        });
    };
    HmacCrypto.verify = function (algorithm, key, signature, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var alg = _this.wc2ssl(key.algorithm);
            var nativeKey = key.native;
            nativeKey.verify(alg, data, signature, function (err, res) {
                if (err) {
                    reject(new WebCryptoError("NativeError: " + err.message));
                }
                else {
                    resolve(res);
                }
            });
        });
    };
    HmacCrypto.wc2ssl = function (algorithm) {
        var alg = algorithm.hash.name.toUpperCase().replace("-", "");
        return alg;
    };
    HmacCrypto.getHashSize = function (hashName) {
        switch (hashName) {
            case AlgorithmNames.Sha1:
                return 160;
            case AlgorithmNames.Sha256:
                return 256;
            case AlgorithmNames.Sha384:
                return 384;
            case AlgorithmNames.Sha512:
                return 512;
            default:
                throw new AlgorithmError(AlgorithmError.NOT_SUPPORTED, hashName);
        }
    };
    return HmacCrypto;
}(BaseCrypto));
exports.HmacCrypto = HmacCrypto;
