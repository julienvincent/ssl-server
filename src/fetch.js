import 'isomorphic-fetch'

export default ({url, clusterKey}) => {
    const Fetch = query => fetch(url, {
        method: "POST",
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': clusterKey
        },
        body: JSON.stringify({query})
    })
        .then(res => res.json())
        .then(res => res.data)

    return {
        getAccount({domain, email}) {
            return Fetch(`
                {
                    getAccountKey(domain: "${domain}") {
                        privateKey,
                        email,
                        domain
                    }
                }
            `).then(({getAccountKey}) => getAccountKey)
        },
        setAccount({privateKey, email, domain}) {
            return Fetch(`
                mutation store {
                    storeAccountKey(domain: "${domain}", email: "${email}", privateKey: "${privateKey.replace(/\r?\n|\r/g, "\\n")}") {
                        privateKey,
                        email,
                        domain
                    }
                }
            `).then(({storeAccountKey}) => storeAccountKey)
        },

        getCertificate({domain}) {
            return Fetch(`
                {
                    getCertificateKey(domain: "${domain}") {
                        privateKey,
                        domain,
                        certificate,
                        chain
                    }
                }
            `).then(({getCertificateKey}) => getCertificateKey)
        },
        setCertificate({privateKey, domain, certificate, chain}) {
            return Fetch(`
                mutation store {
                    storeCertificateKey(
                                domain: "${domain}",
                                privateKey: "${privateKey.replace(/\r?\n|\r/g, "\\n")}"
                                ${certificate ? `, cert: "${certificate.replace(/\r?\n|\r/g, "\\n")}"` : ''}
                                ${chain ? `, chain: "${chain.replace(/\r?\n|\r/g, "\\n")}"` : ''},
                                ) {
                        privateKey,
                        domain,
                        certificate,
                        chain
                    }
                }
            `).then(({storeCertificateKey}) => storeCertificateKey)
        }
    }
}