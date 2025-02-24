import Santander from '../libs/Santander.js';
import db from '../server.js'
import { v4 as uuidv4 } from 'uuid';

export const gerarCobranca = async () => {

    console.log("Iniciando código para processar leads com CPF");


        const santander = new Santander();
        await santander.getToken();
        const accessToken = santander.bearerToken;
        const data = new Date();
        const hoje = data.getDate();
        const pool = await db();

        try {

            const dataFechamento = await pool
                .request()
                .query("SELECT * FROM [homol_hub]..[empresa] WHERE [uid_empresa] = 'NEW_115348968'")

            const dia_fechamento = dataFechamento.recordset[0]?.dia_fechamento;

            if(dataFechamento.recordset.length === 0) {
                console.log("Sem dia de fechamento!");
                return;
            }

            data.setDate(hoje + dia_fechamento);

            const dia_vencimento = data.getDate();

            console.log(`Dia de vencimento calculado: ${dia_vencimento}`);


                const result = await pool
                    .request()
                    .query(`SELECT *
                FROM [homol_hub_santander]..[cobranca]
                WHERE [recorrente] = 1
                AND [dia_vencimento] = ${dia_vencimento}
                AND LEN([token_lead]) = 36`);



            if (result.recordset.length === 0) {
                console.log("Não há cobranças para realizar");
                return;
            }


            const token_lead = result.recordset.map(result => result.token_lead);
            const token_cadastro = result.recordset.map(result => result.token);
            const token_string = token_lead.map(token => `'${token}'`).join(', ');

            if (!token_string) {
                console.log("Nenhum token válido encontrado.");
                return;
            }

             const dados_lead = await pool
                    .request()
                    .query(`SELECT [nome], [cpf], [logradouro], [bairro], [municipio], [uf], [cep]
                            FROM [cadastro_unico]..[cadastro]
                            WHERE [token] IN (${token_string})`)


                for (let i = 0; i < result.recordset.length; i++) {

                    const payer = {
                        data_vencimento: result.recordset[i].due_date ?? "",
                        valor_cobrado: result.recordset[i].valor_cobranca ?? "",
                        nome: dados_lead.recordset[i]?.nome ?? "",
                        CPF: dados_lead.recordset[i]?.cpf ?? "",
                        logradouro: dados_lead.recordset[i]?.logradouro ?? "",
                        bairro: dados_lead.recordset[i]?.bairro ?? "",
                        municipio: dados_lead.recordset[i]?.municipio ?? "",
                        uf: dados_lead.recordset[i]?.uf ?? "",
                        cep: dados_lead.recordset[i]?.cep ?? "",
                    };

                    const token = uuidv4();

                    const data = new Date();
                    const mes = data.getMonth() + 1;
                    const ano = data.getFullYear();

                    const dataTotal = `${dia_vencimento}/${mes.toString().padStart(2, '0')}/${ano}`;


                    const response = await santander.novaCobrancaCpf(accessToken, payer.data_vencimento, payer.valor_cobrado, payer.nome, payer.CPF, payer.logradouro, payer.bairro, payer.municipio, payer.uf, payer.cep, token, dataTotal);

                    console.log(`Cobrança gerada para token_lead: ${token_lead[i]}`, response);

                    if (response) {

                        const [dia, mes, ano] = response.dueDate.split('/');
                        const dueDate = `${ano}-${mes}-${dia}`;

                        await pool
                            .request()
                            .query(
                                `UPDATE [homol_hub_santander]..[cobranca]
                                 SET [due_date] = '${dueDate}',
                                     [qr_code_pix] = '${response.qrCodePix}',
                                     [qr_code_url] = '${response.qrCodeUrl}',
                                     [digital_line] = '${response.digitableLine}',
                                     [bankNumber] = '${response.bankNumber}'
                                 WHERE [token] = '${token_cadastro[i]}'`
                            );

                        console.log(`Cobrança atualizada no banco para token_cadastro: ${token_cadastro[i]}`);
                    } else {
                        console.error(`Falha ao gerar cobrança para token_lead: ${token_lead[i]}`);
                    }
                }

                console.log("Processo de cobranças finalizado.");
            }
                catch (error) {
                        console.error("Erro ao processar cobranças:", error);
                    }
        };

