// @flow
import http from 'http'
import https from 'https'
import LetsEncrypt from 'letsencrypt'
import express from 'express'
import FetchAPI from './fetch'
import StorageHandler, { ApiType } from './storage'
import SNICreator from './sni'
import moment from 'moment'

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
                     const expiryDate = moment(new Date(certificate.expiresAt))

                     const isAfter = expiryDate.isAfter(moment())
                     const isWithinRange = expiryDate.diff(moment(), 'days') <= 10

                     if (isAfter || isWithinRange) {
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
                              config.logger.error("Something went wrong renewing certificates")
                           })
                     } else {
                        config.logger.error("Certificate is not in renew range", {certificate})
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
                        config.logger.info("SSL: Success - caching")
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
            console.log("development")
            server.listen(primary, () => config.logger.info(`Listening for incoming connections on port :${primary}`))
         },
         server
      }
   }
}