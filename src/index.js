// @flow
import http from 'http'
import https from 'https'
import LetsEncrypt from 'letsencrypt'
import StorageHandler, { ApiType } from './storage'

import RedirectToHttps from 'redirect-https'

type ConfigType = {
    server: "staging" | "production",
    api: String | ApiType,
    clusterKey: String,
    domain: String,
    email: String,
    app: Object
}

export default (config: ConfigType) => {
    var db = {}
    const Handler = LetsEncrypt.create({
        server: config.server || "staging",
        agreeTos: true,
        email: config.email,
        approveDomains: [config.domain],
        store: StorageHandler({api: config.api, clusterKey: config.clusterKey})
    })

    const ACMEHandler = http.createServer(Handler.middleware(RedirectToHttps()))
    const server = https.createServer(Handler.httpsOptions, Handler.middleware(config.app))

    return {
        listen(redirect, primary) {
            Handler.register({
                domains: [config.domain],
                email: config.email,
                agreeTos: true
            })

            ACMEHandler.listen(redirect, () => console.log("Handling challenges and redirecting to https"))
            server.listen(primary, () => console.log("Listening for incoming connections"))
        },

        server
    }
}