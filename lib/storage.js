'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fetch = require('./fetch');

var _fetch2 = _interopRequireDefault(_fetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (config) {

    var apiMethods = void 0;
    if (typeof config.api == 'string') {
        apiMethods = (0, _fetch2.default)({ url: config.api, token: config.token });
    } else {
        apiMethods = config.api;
    }

    var _apiMethods = apiMethods;
    var getAccount = _apiMethods.getAccount;
    var setAccount = _apiMethods.setAccount;
    var getCertificate = _apiMethods.getCertificate;
    var setCertificate = _apiMethods.setCertificate;


    return {
        accounts: {
            checkKeypair: function checkKeypair(opts, cb) {
                console.log("SSL: Checking for account privateKey");

                getAccount({ domain: opts.domains[0] }).then(function (account) {
                    if (account) return cb(null, { privateKeyPem: account.privateKey });
                    cb(null);
                }).catch(function (e) {
                    console.error("error on lookup for ssl account privateKey", e);
                    cb(null);
                });
            },
            setKeypair: function setKeypair(opts, keypair, cb) {
                console.log("SSL: Setting account privateKey");

                setAccount({ domain: opts.domains[0], email: opts.email, privateKey: keypair.privateKeyPem }).then(function (account) {
                    if (account) return cb(null, keypair);
                    cb(null);
                }).catch(function (e) {
                    console.error("error setting ssl account privateKey", e);
                    cb(null, keypair);
                });
            },
            check: function check(opts, cb) {
                console.log("SSL: Checking account privateKey");

                getAccount({ domain: opts.domains[0] }).then(function (account) {
                    if (account) return cb(null, {
                        keypair: { privateKeyPem: account.privateKey },
                        domains: [account.domain]
                    });
                    cb(null);
                }).catch(function (e) {
                    console.error("error on lookup for ssl account privateKey", e);
                    cb(null);
                });
            },
            set: function set(opts, reg, cb) {
                console.log("SSL: Setting account receipt");

                var res = {
                    email: opts.email,
                    keypair: reg.keypair,
                    receipt: reg.receipt
                };

                setAccount({ domain: opts.domains[0], email: opts.email, privateKey: reg.keypair.privateKeyPem }).then(function (account) {
                    if (account) return cb(null, res);
                    cb(null, res);
                }).catch(function (e) {
                    console.error("error setting ssl receipt", e);
                    cb(null, res);
                });
            }
        },
        certificates: {
            checkKeypair: function checkKeypair(opts, cb) {
                console.log("SSL: Checking for certificate privateKey");

                getCertificate({ domain: opts.domains[0] }).then(function (certificate) {
                    if (certificate) return cb(null, { privateKeyPem: certificate.privateKey });
                    cb(null);
                }).catch(function (e) {
                    console.error("error on lookup for ssl privateKey", e);
                    cb(null);
                });
            },
            setKeypair: function setKeypair(opts, keypair, cb) {
                console.log("SSL: Setting cert privateKey");

                setCertificate({ domain: opts.domains[0], privateKey: keypair.privateKeyPem }).then(function (certificate) {
                    console.log(certificate);
                    if (certificate) return cb(null, keypair);
                    cb(null);
                }).catch(function (e) {
                    console.error("error updating ssl privateKey", e);
                    cb(null, keypair);
                });
            },
            check: function check(opts, cb) {
                console.log("SSL: Checking for certs");

                getCertificate({ domain: opts.domains[0] }).then(function (certificate) {
                    if (certificate) {
                        if (certificate.cert && certificate.chain) return cb(null, {
                            privkey: certificate.privateKey,
                            domains: [certificate.domain],
                            cert: certificate.certificate,
                            chain: certificate.chain
                        });
                    }
                    cb(null);
                }).catch(function (e) {
                    console.error("Failed to query for certs", e);
                    cb(null);
                });
            },
            set: function set(opts, cb) {
                console.log("SSL: saving certificates");

                var pem = opts.pems;
                setCertificate({
                    domain: opts.domains[0],
                    privateKey: pem.privkey,
                    cert: pem.cert,
                    chain: pem.chain
                }).then(function (certificate) {
                    if (certificate) return cb(null, opts.pems);
                    cb(null);
                }).catch(function (e) {
                    console.error("Could't set cert", e);
                    cb(null, opts.pems);
                });
            }
        },

        getOptions: function getOptions() {
            return {};
        }
    };
};