require('dotenv').config();

const {
    client,
    initializeWhatsApp,
    destroyWhatsApp,
    waitForWhatsAppReady
} = require('../src/whatsapp/client');


async function main() {

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


        console.log(
            '[Test] Executando getChats()...'
        );

        const chats =
            await client.getChats();


        console.log(
            `[Test] ${chats.length} conversas encontradas.`
        );


        for (
            const chat
            of chats.slice(0, 10)
        ) {

            console.log(
                `- ${chat.name ?? '(sem nome)'}`
            );
        }

    } catch (error) {

        console.error(
            '[Test] getChats() falhou:'
        );

        console.error(error);

        process.exitCode = 1;

    } finally {

        await destroyWhatsApp();
    }
}


main();
