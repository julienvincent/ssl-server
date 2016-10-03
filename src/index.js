// @flow
import http from 'http'
import https from 'https'
import LetsEncrypt from 'letsencrypt'
import express from 'express'
import FetchAPI from './fetch'
import StorageHandler, { ApiType } from './storage'
import SNICreator from './sni'

import RedirectToHttps from 'redirect-https'

type ConfigType = {
    server: "staging" | "production",
    api: String | ApiType,
    token: String,
    domain: String,
    email: String,
    app: ?Object,
    production: Boolean,
    httpRedirect: ?Boolean
}

export default (config: ConfigType) => {
    config.app = config.app || express()

    if (config.production) {
        let StorageMethods = config.api
        if (typeof config.api === 'string') {
            StorageMethods = FetchAPI({url: config.api, token: config.token})
        }

        const SNI = SNICreator()

        const Handler = LetsEncrypt.create({
            server: config.server || "staging",
            agreeTos: true,
            email: config.email,
            approveDomains: [config.domain],
            store: StorageHandler(StorageMethods),
            sni: SNI
        })

        const httpMiddleware = config.httpRedirect ? RedirectToHttps() : config.app

        const ACMEHandler = http.createServer(Handler.middleware(httpMiddleware))
        const server = https.createServer(Handler.httpsOptions, Handler.middleware(config.app))

        return {
            listen(redirect, primary) {
                StorageMethods.getCertificate({domain: config.domain})
                    .then(certificate => {
                        if (certificate) {
                            if (certificate.chain && certificate.certificate) {
                                console.log("Certificate found. Adding to cache")
                                return SNI.cacheCerts({
                                    chain: certificate.chain,
                                    privkey: certificate.privateKey,
                                    cert: certificate.certificate,
                                })
                            }
                        }

                        Handler.register({
                            domains: [config.domain],
                            email: config.email,
                            agreeTos: true
                        }).then(SNI.cacheCerts)
                    })

                ACMEHandler.listen(redirect, () => console.log("Handling challenges and redirecting to https"))
                server.listen(primary, () => console.log("Listening for incoming connections"))
            },

            server
        }
    } else {
        const server = http.createServer(config.app)

        return {
            listen(r, primary) {
                console.log("development")
                server.listen(primary, () => console.log(`Listening for incoming connections on port :${primary}`))
            },
            server
        }
    }
}