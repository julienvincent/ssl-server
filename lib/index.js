'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _letsencrypt = require('letsencrypt');

var _letsencrypt2 = _interopRequireDefault(_letsencrypt);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _fetch = require('./fetch');

var _fetch2 = _interopRequireDefault(_fetch);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _sni = require('./sni');

var _sni2 = _interopRequireDefault(_sni);

var _redirectHttps = require('redirect-https');

var _redirectHttps2 = _interopRequireDefault(_redirectHttps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (config) {
    config.app = config.app || (0, _express2.default)();

    if (config.production) {
        var _ret = function () {
            var StorageMethods = config.api;
            if (typeof config.api === 'string') {
                StorageMethods = (0, _fetch2.default)({ url: config.api, token: config.token });
            }

            var SNI = (0, _sni2.default)();

            var Handler = _letsencrypt2.default.create({
                server: config.server || "staging",
                agreeTos: true,
                email: config.email,
                approveDomains: [config.domain],
                store: (0, _storage2.default)(StorageMethods),
                sni: SNI
            });

            var ACMEHandler = _http2.default.createServer(Handler.middleware((0, _redirectHttps2.default)()));
            var server = _https2.default.createServer(Handler.httpsOptions, Handler.middleware(config.app));

            return {
                v: {
                    listen: function listen(redirect, primary) {
                        StorageMethods.getCertificate({ domain: config.domain }).then(function (certificate) {
                            if (certificate) {
                                if (certificate.chain && certificate.certificate) {
                                    console.log("Certificate found. Adding to cache");
                                    return SNI.cacheCerts({
                                        chain: certificate.chain,
                                        privkey: certificate.privateKey,
                                        cert: certificate.certificate
                                    });
                                }
                            }

                            Handler.register({
                                domains: [config.domain],
                                email: config.email,
                                agreeTos: true
                            }).then(SNI.cacheCerts);
                        });

                        ACMEHandler.listen(redirect, function () {
                            return console.log("Handling challenges and redirecting to https");
                        });
                        server.listen(primary, function () {
                            return console.log("Listening for incoming connections");
                        });
                    },


                    server: server
                }
            };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    } else {
        var _ret2 = function () {
            var server = _http2.default.createServer(config.app);

            return {
                v: {
                    listen: function listen(r, primary) {
                        console.log("development");
                        server.listen(primary, function () {
                            return console.log('Listening for incoming connections on port :' + primary);
                        });
                    },

                    server: server
                }
            };
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
    }
};