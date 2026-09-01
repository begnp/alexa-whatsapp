const Alexa = require('ask-sdk-core');


const LaunchRequestHandler = {

    canHandle(handlerInput) {
        return Alexa.getRequestType(
            handlerInput.requestEnvelope
        ) === 'LaunchRequest';
    },

    handle(handlerInput) {

        console.log('[Alexa] LaunchRequest recebido');

        const speakOutput =
            'Olá! O servidor local está funcionando. Diga olá para testar.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Diga olá para testar.')
            .getResponse();
    }
};


const HelloWorldIntentHandler = {

    canHandle(handlerInput) {

        return (
            Alexa.getRequestType(
                handlerInput.requestEnvelope
            ) === 'IntentRequest'
            &&
            Alexa.getIntentName(
                handlerInput.requestEnvelope
            ) === 'HelloWorldIntent'
        );
    },

    handle(handlerInput) {

        console.log('[Alexa] HelloWorldIntent recebido');

        return handlerInput.responseBuilder
            .speak(
                'Olá mundo! Este comando foi processado pelo seu computador.'
            )
            .getResponse();
    }
};


const HelpIntentHandler = {

    canHandle(handlerInput) {

        return (
            Alexa.getRequestType(
                handlerInput.requestEnvelope
            ) === 'IntentRequest'
            &&
            Alexa.getIntentName(
                handlerInput.requestEnvelope
            ) === 'AMAZON.HelpIntent'
        );
    },

    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak('Você pode dizer: diga olá.')
            .reprompt('Diga olá para testar.')
            .getResponse();
    }
};


const CancelAndStopIntentHandler = {

    canHandle(handlerInput) {

        if (
            Alexa.getRequestType(
                handlerInput.requestEnvelope
            ) !== 'IntentRequest'
        ) {
            return false;
        }

        const intentName =
            Alexa.getIntentName(
                handlerInput.requestEnvelope
            );

        return (
            intentName === 'AMAZON.CancelIntent'
            ||
            intentName === 'AMAZON.StopIntent'
        );
    },

    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak('Até logo!')
            .getResponse();
    }
};


const ErrorHandler = {

    canHandle() {
        return true;
    },

    handle(handlerInput, error) {

        console.error('[Alexa] Erro:', error);

        return handlerInput.responseBuilder
            .speak(
                'Ocorreu um erro no servidor local.'
            )
            .getResponse();
    }
};


if (!process.env.ALEXA_SKILL_ID) {
    throw new Error(
        'A variável ALEXA_SKILL_ID não foi configurada.'
    );
}


const skill = Alexa.SkillBuilders
    .custom()
    .withSkillId(
        process.env.ALEXA_SKILL_ID
    )
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .create();


module.exports = {
    skill
};
