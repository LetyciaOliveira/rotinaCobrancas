import db from '../server.js'


export const bloqueioAutomatico = async () => {
    console.log("Iniciando código que verifica atrasos e bloqueia");

        const data = new Date();
        const hoje = data.getDate();
        const pool = await db();

        try {
            const result = await pool
                .request()
                .query(`SELECT *
                        FROM [homol_hub_santander]..[cobranca]
                        WHERE [dia_vencimento] < ${hoje}
                          AND [status] = 0`);

            if (result.recordset.length === 0) {
                console.log("Não há cobranças atrasadas");
                return;
            }


            for (let i = 0; i < result.recordset.length; i++) {
                const token = result.recordset[i].token;

                if (token.length < 32) {
                    await pool.request().query(
                        `UPDATE [homol_hub_santander]..[cobranca]
                         SET [situacao] = '0'
                         WHERE [token] = '${token}'`
                    );
                    console.log(`Cliente bloqueado para token_cadastro: ${token}`);
                } else if (token.length === 32) {
                    await pool.request().query(
                        `UPDATE [homol_hub_santander]..[cobranca]
                         SET [situacao] = '0'
                         WHERE [token] = '${token}'`
                    );
                    console.log(`Cliente bloqueado para token_cadastro_pj: ${token}`);
                } else {
                    console.error(`Falha ao processar token: ${token}`);
                }
            }

            console.log("Processo de verificação finalizado no bloqueio automático.");
        } catch (error) {
            console.error("Erro ao processar verificação:", error);
        }
};