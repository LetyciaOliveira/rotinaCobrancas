import Santander from '../libs/Santander.js';
import db from '../server.js'

export const atualizacaoSituacao = async () => {
    console.log("Iniciando código que verifica as rotinas");

        const santander = new Santander();
        await santander.getToken();
        const accessToken = santander.bearerToken;

        const pool = await db();

        try {
            const result = await pool
                .request()
                .query(`SELECT * FROM [homol_hub_santander]..[cobranca] WHERE [bankNumber] != '' AND [status] = 0`);

            const cobrancas = result.recordset.map(result => ({
                token: result.token,
                bankNumber: result.bankNumber,
            }));

            for (const cobranca of cobrancas) {
                const { token, bankNumber } = cobranca;

                if (!bankNumber) {
                    console.warn(`BankNumber ausente para o token ${token}. Pulando consulta.`);
                    continue;
                }

                try {
                    const response = await santander.visualizarStatus(accessToken, bankNumber);

                    if (!response || !response.status) {
                        console.error(`Resposta inválida para o token ${token}:`, response);
                        continue;
                    }

                    console.log(`Verificando situação boleto: ${token}`, response);

                    let status = null;
                    switch (response.status) {
                        case "Ativo":
                            status = 0;
                            break;
                        case "Baixado":
                        case "Liquidado":
                        case "Liquidado parcialmente":
                            status = 1;
                            break;
                        default:
                            status = null;
                    }

                    if (status !== null && token) {
                        await pool
                            .request()
                            .input('status', status)
                            .input('token', token)
                            .query(
                                `UPDATE [homol_hub_santander]..[cobranca]
                                 SET [status] = @status
                                 WHERE [token] = @token`
                            );

                        console.log(`Cobrança verificada ao boleto do token: ${token}`);
                    } else {
                        console.error(`Falha ao verificar: ${token}`);
                    }
                } catch (error) {
                    console.error(`Erro ao consultar status do token ${token}:`, error);
                }
            }

            console.log("Processo de verificação finalizado.");
        } catch (error) {
            console.error("Erro ao processar verificação:", error);
        }
};
