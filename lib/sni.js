"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _tls = require("tls");

var _tls2 = _interopRequireDefault(_tls);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
    var config = {
        cache: {}
    };

    var SNI = {
        cacheCerts: function cacheCerts(certs) {
            config.cache = {
                certs: certs,
                tlsContext: _tls2.default.createSecureContext({
                    key: certs.privkey,
                    cert: certs.cert + certs.chain,
                    rejectUnauthorized: true,
                    requestCert: false,
                    ca: null,
                    crl: null
                })
            };

            console.log("SSL: Certs cached");
            return config.cache;
        },
        sniCallback: function sniCallback(domain, cb) {
            if (config.cache.tlsContext) {
                cb(null, config.cache.tlsContext);
            } else {
                console.error("No certificates in cache");
                cb(new Error("No certificates in cache"));
            }
        },
        getOptions: function getOptions() {
            return {};
        }
    };

    return SNI;
};