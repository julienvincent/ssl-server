// @flow
import TLS from 'tls'

export default () => {
    const config = {
        cache: {}
    }

    const SNI = {
        cacheCerts(certs) {
            config.cache = {
                certs: certs,
                tlsContext: TLS.createSecureContext({
                    key: certs.privkey,
                    cert: certs.cert + certs.chain,
                    rejectUnauthorized: true,
                    requestCert: false,
                    ca: null,
                    crl: null
                })
            }

            console.log("SSL: Certs cached")
            return config.cache
        },
        sniCallback(domain, cb) {
            if (config.cache.tlsContext) {
                cb(null, config.cache.tlsContext)
            } else {
                console.error("No certificates in cache")
                cb(new Error("No certificates in cache"))
            }
        },

        getOptions() {
            return {}
        }
    }

    return SNI
}