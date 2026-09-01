require('dotenv').config();

const express = require('express');

const {
    ExpressAdapter
} = require('ask-sdk-express-adapter');

const {
    skill
} = require('./alexa/skill');


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
        service: 'alexa-whatsapp'
    });

});


app.listen(
    PORT,
    '127.0.0.1',
    () => {

        console.log('');
        console.log(`[Server] http://localhost:${PORT}`);
        console.log(`[Server] Alexa: http://localhost:${PORT}/alexa`);
        console.log(`[Server] Health: http://localhost:${PORT}/health`);
        console.log('');
    }
);
