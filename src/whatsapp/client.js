const path = require('node:path');

const qrcode = require('qrcode-terminal');

const {
    Client,
    LocalAuth
} = require('whatsapp-web.js');


const state = {

    status: 'not_initialized',

    authenticated: false,

    ready: false,

    lastError: null
};


function getPuppeteerOptions() {

    const options = {
        headless: true
    };

    /*
     * Em Docker/Linux rodando Chromium como root,
     * poderemos habilitar isso por variável de ambiente.
     *
     * No Windows local permanecerá false.
     */
    if (
        process.env.PUPPETEER_NO_SANDBOX === 'true'
    ) {

        options.args = [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ];
    }

    return options;
}


const client = new Client({

    authStrategy: new LocalAuth({

        clientId: 'alexa-whatsapp',

        dataPath: path.resolve(
            process.cwd(),
            '.wwebjs_auth'
        )
    }),

    puppeteer: getPuppeteerOptions()
});


client.on('qr', (qr) => {

    state.status = 'awaiting_qr';
    state.authenticated = false;
    state.ready = false;
    state.lastError = null;

    console.log('');
    console.log('[WhatsApp] Escaneie o QR Code:');
    console.log('');

    qrcode.generate(
        qr,
        {
            small: true
        }
    );
});


client.on('authenticated', () => {

    state.status = 'authenticated';
    state.authenticated = true;
    state.lastError = null;

    console.log(
        '[WhatsApp] Autenticação concluída.'
    );
});


client.on('ready', () => {

    state.status = 'ready';
    state.authenticated = true;
    state.ready = true;
    state.lastError = null;

    console.log(
        '[WhatsApp] Cliente pronto.'
    );
});


client.on(
    'auth_failure',
    (message) => {

        state.status = 'auth_failure';
        state.authenticated = false;
        state.ready = false;
        state.lastError = message;

        console.error(
            '[WhatsApp] Falha de autenticação:',
            message
        );
    }
);


client.on(
    'disconnected',
    (reason) => {

        state.status = 'disconnected';
        state.authenticated = false;
        state.ready = false;

        console.warn(
            '[WhatsApp] Desconectado:',
            reason
        );
    }
);


async function initializeWhatsApp() {

    if (
        state.status !== 'not_initialized'
    ) {
        return;
    }

    state.status = 'initializing';

    console.log(
        '[WhatsApp] Inicializando cliente...'
    );

    try {

        await client.initialize();

    } catch (error) {

        state.status = 'error';
        state.authenticated = false;
        state.ready = false;
        state.lastError = error.message;

        console.error(
            '[WhatsApp] Erro na inicialização:',
            error
        );

        throw error;
    }
}


async function destroyWhatsApp() {

    try {

        await client.destroy();

        state.status = 'stopped';
        state.ready = false;

        console.log(
            '[WhatsApp] Cliente encerrado.'
        );

    } catch (error) {

        console.error(
            '[WhatsApp] Erro ao encerrar:',
            error.message
        );
    }
}


function getWhatsAppStatus() {

    return {
        status: state.status,
        authenticated: state.authenticated,
        ready: state.ready,
        lastError: state.lastError
    };
}


module.exports = {

    client,

    initializeWhatsApp,

    destroyWhatsApp,

    getWhatsAppStatus
};
