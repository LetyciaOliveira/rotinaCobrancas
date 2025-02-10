import axios from 'axios';
import qs from 'qs';
import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv'

dotenv.config();


export default class Santander {
    constructor() {
        this.bearerToken = '';
    }

    async getToken() {

        const certPath = process.env.CERT_PATH;
        const keyPath = process.env.KEY_PATH;
        const passphrase = process.env.PASSPHRASE;

        try {
            const { data } = await axios.post(
                'https://trust-sandbox.api.santander.com.br/auth/oauth/v2/token',
                qs.stringify({
                    client_id: process.env.CLIENTEID,
                    client_secret: process.env.CLIENTESECRET,
                    grant_type: 'client_credentials',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    httpsAgent: new https.Agent({
                        cert: fs.readFileSync(certPath),
                        key: fs.readFileSync(keyPath),
                        passphrase,
                    }),
                }
            );

            this.bearerToken = data.access_token;
        } catch (error) {
            console.error('Erro ao obter token:', error);
        }
    }

    async novaCobrancaCpf (accessToken, data_vencimento, valor_cobrado, nome, cpf, logradouro, bairro,  municipio, uf, cep, token ){
        const certPath =  process.env.CERT_PATH;
        const keyPath = process.env.KEY_PATH;
        const passphrase = process.env.PASSPHRASE;
        const covenantCode = process.env.COVENANTCODE;
        const workSpaceID = process.env.WORKSPACEID;
        const clientID = process.env.CLIENTEID
        const bankNumber = new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 14);
        const dueDate = new Date();
        const formattedDate = `${String(dueDate.getDate()).padStart(2, '0')}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${dueDate.getFullYear()}`;

         try {
                const {data} = await axios.request({
                    method: 'POST',
                    url: `https://trust-sandbox.api.santander.com.br/collection_bill_management/v2/workspaces/${workSpaceID}/bank_slips`,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'X-Application-Key': clientID,
                    },
                    data: {
                        environment: 'TESTE',
                        nsuCode: "TST" + token,
                        nsuDate: new Date().toISOString(),
                        covenantCode: covenantCode,
                        bankNumber: bankNumber,
                        dueDate: formattedDate,
                        issueDate: new Date().toISOString(),
                        nominalValue: valor_cobrado,
                        payer: {
                            name: nome,
                            documentType: 'CPF',
                            documentNumber: cpf,
                            address: logradouro,
                            neighborhood: bairro,
                            city: municipio,
                            state: uf,
                            zipCode: cep,
                        },
                        documentKind: 'DUPLICATA_MERCANTIL',
                        writeOffQuantityDays: '30',
                        paymentType: 'REGISTRO',
                    },
                    httpsAgent: new https.Agent({
                        cert: fs.readFileSync(certPath),
                        key: fs.readFileSync(keyPath),
                        passphrase,
                    }),
                });

             return data;

        } catch(error) {
                console.error(error);
            }
        }

        async novaCobrancaCnpj (accessToken, data_vencimento, valor_cobrado, razao_social, cnpj, logradouro, bairro,  municipio, uf, cep, token) {
            const certPath =  process.env.CERT_PATH;
            const keyPath = process.env.KEY_PATH;
            const passphrase = process.env.PASSPHRASE;
            const covenantCode = process.env.COVENANTCODE;
            const workSpaceID = process.env.WORKSPACEID;
            const clientID = process.env.CLIENTEID
            const bankNumber = new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 14);
            const dueDate = new Date();
            const formattedDate = `${String(dueDate.getDate()).padStart(2, '0')}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${dueDate.getFullYear()}`;

            try {
                const {data} = await axios.request({
                    method: 'POST',
                    url: `https://trust-sandbox.api.santander.com.br/collection_bill_management/v2/workspaces/${workSpaceID}/bank_slips`,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'X-Application-Key': clientID,
                    },
                    data: {
                        environment: 'TESTE',
                        nsuCode: "TST" + token,
                        nsuDate: new Date().toISOString(),
                        covenantCode: covenantCode,
                        bankNumber: bankNumber,
                        dueDate: formattedDate,
                        issueDate: new Date().toISOString(),
                        nominalValue: valor_cobrado,
                        payer: {
                            name: razao_social,
                            documentType: 'CNPJ',
                            documentNumber: cnpj,
                            address: logradouro,
                            neighborhood: bairro,
                            city: municipio,
                            state: uf,
                            zipCode: cep,
                        },
                        documentKind: 'DUPLICATA_MERCANTIL',
                        writeOffQuantityDays: '30',
                        paymentType: 'REGISTRO',
                    },
                    httpsAgent: new https.Agent({
                        cert: fs.readFileSync(certPath),
                        key: fs.readFileSync(keyPath),
                        passphrase,
                    }),
                });

                return data;

            } catch(error) {
                console.error(error);
            }
        }


    async visualizarStatus(accessToken, bankNumber) {
        const certPath = process.env.CERT_PATH;
        const keyPath = process.env.KEY_PATH;
        const passphrase = process.env.PASSPHRASE;
        const covenantCode = process.env.COVENANTCODE;
        const clientID = process.env.CLIENTEID;

        const codigoSolicitacaoAPI = covenantCode + bankNumber;

        try {
            const { data } = await axios.get(
                `https://trust-sandbox.api.santander.com.br/collection_bill_management/v2/bills/${codigoSolicitacaoAPI}?tipoConsulta=settlement`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'X-Application-Key': clientID,
                    },
                    httpsAgent: new https.Agent({
                        cert: fs.readFileSync(certPath),
                        key: fs.readFileSync(keyPath),
                        passphrase,
                    }),
                }
            );

            return data;
        } catch (error) {
            console.error('Erro ao consultar a situação:', error);
            throw error;
        }
    }

}
