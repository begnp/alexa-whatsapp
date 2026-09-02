require('dotenv').config();

const {
    client,
    initializeWhatsApp,
    destroyWhatsApp,
    waitForWhatsAppReady
} = require('../src/whatsapp/client');


async function main() {

    const targetName =
        process.argv[2];

    const text =
        process.argv[3]
        ?? 'Teste direto do whatsapp-web.js';


    if (!targetName) {

        console.error(
            'Uso: npm run whatsapp:send-direct -- "Nome Exato" "Mensagem"'
        );

        process.exitCode = 1;
        return;
    }


    try {

        console.log(
            '[Test] Inicializando WhatsApp...'
        );

        const readyPromise =
            waitForWhatsAppReady(90000);

        await initializeWhatsApp();

        await readyPromise;

        console.log(
            '[Test] Cliente pronto.'
        );


        /*
         * 1. Carregar chats
         */
        const chats =
            await client.getChats();

        console.log(
            `[Test] ${chats.length} conversas carregadas.`
        );


        /*
         * 2. Encontrar SOMENTE correspondência exata
         * para eliminar nossa lógica de resolução
         * como possível causa.
         */
        const chat =
            chats.find(
                (item) =>
                    item.name === targetName
            );


        if (!chat) {

            console.error(
                `[Test] Conversa "${targetName}" não encontrada.`
            );

            process.exitCode = 1;
            return;
        }


        console.log('');
        console.log('[Test] Conversa encontrada:');
        console.log(
            '[Test] Nome:',
            chat.name
        );

        console.log(
            '[Test] ID:',
            chat.id?._serialized
        );

        console.log(
            '[Test] Grupo:',
            chat.isGroup
        );

        console.log(
            '[Test] Somente leitura:',
            chat.isReadOnly
        );


        /*
         * 3. Testar diretamente a biblioteca
         */
        console.log('');
        console.log(
            '[Test] Chamando chat.sendMessage()...'
        );


        const result =
            await chat.sendMessage(text);


        /*
         * Não assumimos que result exista.
         */
        console.log('');
        console.log(
            '[Test] sendMessage() retornou:'
        );

        console.dir(
            result,
            {
                depth: 2
            }
        );


        if (!result) {

            console.warn(
                '[Test] AVISO: sendMessage() retornou undefined.'
            );

        } else {

            console.log(
                '[Test] Message ID:',
                result.id?._serialized
                ?? '(sem ID)'
            );
        }


        /*
         * Aguarda um pouco antes de fechar
         * a sessão para evitar matar o processo
         * imediatamente após o envio.
         */
        console.log(
            '[Test] Aguardando 5 segundos...'
        );

        await new Promise(
            (resolve) =>
                setTimeout(resolve, 5000)
        );


    } catch (error) {

        console.error('');
        console.error(
            '[Test] Falha no envio direto:'
        );

        console.error(error);

        process.exitCode = 1;

    } finally {

        await destroyWhatsApp();
    }
}


main();
