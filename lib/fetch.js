'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

require('isomorphic-fetch');

exports.default = function (_ref) {
    var url = _ref.url;
    var token = _ref.token;

    var Fetch = function Fetch(query) {
        return fetch(url, {
            method: "POST",
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': token
            },
            body: JSON.stringify({ query: query })
        }).then(function (res) {
            return res.json();
        }).then(function (res) {
            return res.data;
        });
    };

    return {
        getAccount: function getAccount(_ref2) {
            var domain = _ref2.domain;
            var email = _ref2.email;

            return Fetch('\n                {\n                    getAccountKey(domain: "' + domain + '") {\n                        privateKey,\n                        email,\n                        domain\n                    }\n                }\n            ').then(function (_ref3) {
                var getAccountKey = _ref3.getAccountKey;
                return getAccountKey;
            });
        },
        setAccount: function setAccount(_ref4) {
            var privateKey = _ref4.privateKey;
            var email = _ref4.email;
            var domain = _ref4.domain;

            return Fetch('\n                mutation store {\n                    storeAccountKey(domain: "' + domain + '", email: "' + email + '", privateKey: "' + privateKey.replace(/\r?\n|\r/g, "\\n") + '") {\n                        privateKey,\n                        email,\n                        domain\n                    }\n                }\n            ').then(function (_ref5) {
                var storeAccountKey = _ref5.storeAccountKey;
                return storeAccountKey;
            });
        },
        getCertificate: function getCertificate(_ref6) {
            var domain = _ref6.domain;

            return Fetch('\n                {\n                    getCertificateKey(domain: "' + domain + '") {\n                        privateKey,\n                        domain,\n                        certificate,\n                        chain,\n                        expiresAt,\n                        issuedAt\n                    }\n                }\n            ').then(function (_ref7) {
                var getCertificateKey = _ref7.getCertificateKey;
                return getCertificateKey;
            });
        },
        setCertificate: function setCertificate(_ref8) {
            var privateKey = _ref8.privateKey;
            var domain = _ref8.domain;
            var cert = _ref8.cert;
            var chain = _ref8.chain;
            var issuedAt = _ref8.issuedAt;
            var expiresAt = _ref8.expiresAt;

            return Fetch('\n                mutation store {\n                    storeCertificateKey(\n                                domain: "' + domain + '",\n                                privateKey: "' + privateKey.replace(/\r?\n|\r/g, "\\n") + '"\n                                ' + (cert ? ', cert: "' + cert.replace(/\r?\n|\r/g, "\\n") + '"' : '') + '\n                                ' + (chain ? ', chain: "' + chain.replace(/\r?\n|\r/g, "\\n") + '"' : '') + '\n                                ' + (issuedAt ? ', issuedAt: ' + issuedAt : '') + '\n                                ' + (expiresAt ? ', expiresAt: ' + expiresAt : '') + '\n                                ) {\n                        privateKey,\n                        domain,\n                        certificate,\n                        chain,\n                        expiresAt,\n                        issuedAt\n                    }\n                }\n            ').then(function (_ref9) {
                var storeCertificateKey = _ref9.storeCertificateKey;
                return storeCertificateKey;
            });
        }
    };
};