require('dotenv').config();


const {
    initializeWhatsApp,
    destroyWhatsApp,
    waitForWhatsAppReady
} = require(
    '../src/whatsapp/client'
);


const {
    sendTextMessage,
    WhatsAppServiceError
} = require(
    '../src/whatsapp/service'
);


async function main() {

    const [
        recipient,
        ...messageParts
    ] = process.argv.slice(2);


    const message =
        messageParts.join(' ').trim();


    if (!recipient || !message) {

        console.error(
            'Uso: npm run whatsapp:send -- "Contato" "Mensagem"'
        );

        process.exitCode = 1;

        return;
    }


    try {

        console.log(
            '[Test] Inicializando WhatsApp...'
        );


        /*
         * Registramos a espera ANTES
         * da inicialização para não perder
         * um evento "ready" muito rápido.
         */
        const readyPromise =
            waitForWhatsAppReady(
                90000
            );


        await initializeWhatsApp();

        await readyPromise;


        console.log(
            '[Test] WhatsApp pronto.'
        );


        const result =
            await sendTextMessage(
                recipient,
                message
            );


        console.log('');
        console.log(
            '[Test] Resultado do envio:'
        );

        console.log(
            `[Test] Destinatário: ${result.recipient}`
        );

        console.log(
            `[Test] Message ID: ${result.messageId}`
        );

        console.log(
            `[Test] Confirmado: ${result.confirmed}`
        );

        console.log(
            `[Test] ACK: ${result.ack}`
        );


        if (!result.confirmed) {

            console.warn(
                `[Test] Motivo: ${result.confirmationReason}`
            );
        }
        /* 
        console.log(
            '[Test] sendMessage() concluído.'
        );

        console.log(
            '[Test] Aguardando confirmação da sessão...'
        );

        await new Promise(
            (resolve) =>
                setTimeout(resolve, 5000)
        );


        console.log(
            '[Test] Envio concluído.'
        );

        console.log(
            `[Test] Destinatário: ${result.recipient}`
        );

        console.log(
            `[Test] Message ID: ${result.messageId}`
        );
        */

    } catch (error) {

        if (
            error
            instanceof WhatsAppServiceError
        ) {

            console.error('');
            console.error(
                `[Test] ${error.code}: ${error.message}`
            );


            if (
                error.code
                === 'AMBIGUOUS_CHAT'
            ) {

                console.error(
                    '[Test] Possibilidades:'
                );

                for (
                    const candidate
                    of error.details.candidates
                ) {

                    console.error(
                        `  - ${candidate}`
                    );
                }
            }

        } else {

            console.error(
                '[Test] Erro inesperado:',
                error
            );
        }


        process.exitCode = 1;

    } finally {

        await destroyWhatsApp();
    }
}


main();
