require('dotenv').config();

const express = require('express');

const {
    ExpressAdapter
} = require('ask-sdk-express-adapter');

const {
    skill
} = require('./alexa/skill');

const {
    initializeWhatsApp,
    destroyWhatsApp,
    getWhatsAppStatus
} = require('./whatsapp/client');


const app = express();

const PORT =
    process.env.PORT || 3000;


const adapter = new ExpressAdapter(
    skill,
    true,
    true
);


app.post(
    '/alexa',
    adapter.getRequestHandlers()
);


app.get('/health', (req, res) => {

    res.json({

        status: 'ok',

        service: 'alexa-whatsapp',

        whatsapp:
            getWhatsAppStatus()
    });
});


const server = app.listen(
    PORT,
    '127.0.0.1',
    () => {

        console.log('');
        console.log(
            `[Server] http://localhost:${PORT}`
        );

        console.log(
            `[Server] Alexa: http://localhost:${PORT}/alexa`
        );

        console.log(
            `[Server] Health: http://localhost:${PORT}/health`
        );

        console.log('');

        initializeWhatsApp()
            .catch((error) => {

                console.error(
                    '[WhatsApp] Inicialização falhou:',
                    error.message
                );
            });
    }
);


async function shutdown(signal) {

    console.log('');
    console.log(
        `[Server] ${signal} recebido. Encerrando...`
    );

    server.close(
        async () => {

            await destroyWhatsApp();

            process.exit(0);
        }
    );
}


process.on(
    'SIGINT',
    () => shutdown('SIGINT')
);

process.on(
    'SIGTERM',
    () => shutdown('SIGTERM')
);