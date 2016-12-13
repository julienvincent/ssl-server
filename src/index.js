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
   api: string | ApiType,
   token: string,
   domain: string,
   email: ?string,
   app: ?Object,
   logger: {
      info: Function,
      error: Function
   },
   production: boolean,
   httpRedirect: ?boolean
}

export default (config: ConfigType) => {
   const defaultConfig = {
      app: express(),
      token: process.env.SERVER_TOKEN,
      email: "julienlucvincent@gmail.com",
      api: `${process.env.PROTOCOL}://${process.env.API}/graphql`,
      server: process.env.STAGE ? 'production' : 'staging',
      httpRedirect: true,
      logger: {
         info: console.log,
         error: console.log
      },
   }

   config = {
      ...defaultConfig,
      ...config
   }

   if (config.production) {
      let StorageMethods = config.api
      if (typeof config.api === 'string') {
         StorageMethods = FetchAPI({url: config.api, token: config.token})
      }

      const SNI = SNICreator(config.logger)

      const Handler = LetsEncrypt.create({
         server: config.server || "staging",
         agreeTos: true,
         email: config.email,
         approveDomains: [config.domain],
         store: StorageHandler(StorageMethods, config.logger),
         sni: SNI
      })

      const httpMiddleware = config.httpRedirect ? RedirectToHttps() : config.app

      const ACMEHandler = http.createServer(Handler.middleware(httpMiddleware))
      const server = https.createServer(Handler.httpsOptions, Handler.middleware(config.app))

      config.app.get("/__renew_certificate", (req, res) => {
         StorageMethods.getCertificate({domain: config.domain})
            .then(certificate => {
               if (certificate) {
                  if (certificate.chain && certificate.certificate) {
                     const expiryDate = new Date(certificate.expiresAt)
                     const today = new Date()

                     var time = expiryDate.getTime() - today.getTime()
                     var diff = Math.ceil(time / (1000 * 3600 * 24))

                     if (diff <= 10) {
                        config.logger.info("Renewing certificate")

                        Handler.register({
                           domains: [config.domain],
                           email: config.email,
                           agreeTos: true
                        })
                           .then(certs => {
                              config.logger.info("SSL: Successfully Renewed - caching")
                              res.send("Successful")
                              SNI.cacheCerts(certs)
                           })
                           .catch(e => {
                              res.send("Unsuccessful")
                              config.logger.error("Something went wrong renewing certificates", {error: e})
                           })
                     } else {
                        res.send("Certificate is not in renew range")
                        config.logger.error("Certificate is not in renew range")
                     }
                  }
               }
            })
      })

      return {
         listen(redirect, primary) {
            const searchCache = () =>
               StorageMethods.getCertificate({domain: config.domain})
                  .then(certificate => {
                     if (certificate) {
                        if (certificate.chain && certificate.certificate) {
                           config.logger.info("SSL: Certificate found. caching")
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
                     }).then(certs => {
                        config.logger.info("SSL: Successfully registered certificate - caching")
                        SNI.cacheCerts(certs)
                     })
                  })
                  .catch(() => {
                     config.logger.error("Could not establish a connection to backend. retrying in 20 seconds")
                     setTimeout(searchCache, 20000)
                  })

            searchCache()

            ACMEHandler.listen(redirect, () => config.logger.info(`Handling challenges ${config.httpRedirect ? "and redirecting to https" : ""}`))
            server.listen(primary, () => config.logger.info("Listening for incoming connections"))
         },

         server
      }
   } else {
      const server = http.createServer(config.app)

      return {
         listen(r, primary) {
            server.listen(primary, () => config.logger.info(`Listening for incoming connections on port :${primary}`))
         },
         server
      }
   }
}