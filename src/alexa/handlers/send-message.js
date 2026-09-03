const Alexa = require('ask-sdk-core');

const {
    sendTextMessage,
    WhatsAppServiceError
} = require('../../whatsapp/service');


function getSlotValue(
    handlerInput,
    slotName
) {

    return Alexa.getSlotValue(
        handlerInput.requestEnvelope,
        slotName
    );
}


function translateWhatsAppError(error) {

    switch (error.code) {

        case 'WHATSAPP_NOT_READY':

            return (
                'O WhatsApp ainda não está conectado.'
            );


        case 'CHAT_NOT_FOUND':

            return (
                'Não encontrei uma conversa com esse contato.'
            );


        case 'AMBIGUOUS_CHAT': {

            const candidates =
                error.details?.candidates
                    ?.slice(0, 3)
                    .join(', ');

            if (candidates) {

                return (
                    `Encontrei mais de uma conversa: ${candidates}. Tente novamente usando o nome completo.`
                );
            }

            return (
                'Encontrei mais de uma conversa com esse nome.'
            );
        }


        case 'MESSAGE_SEND_FAILED':

            return (
                'Não consegui enviar a mensagem pelo WhatsApp.'
            );


        default:

            return (
                'Ocorreu um erro ao acessar o WhatsApp.'
            );
    }
}


const SendMessageIntentHandler = {

    canHandle(handlerInput) {

        return (
            Alexa.getRequestType(
                handlerInput.requestEnvelope
            ) === 'IntentRequest'
            &&
            Alexa.getIntentName(
                handlerInput.requestEnvelope
            ) === 'SendMessageIntent'
        );
    },


    async handle(handlerInput) {

        const request =
            handlerInput.requestEnvelope.request;


        /*
         * Alexa ainda está coletando
         * slots ou confirmação.
         */
        if (
            request.dialogState
            !== 'COMPLETED'
        ) {

            return handlerInput
                .responseBuilder
                .addDelegateDirective(
                    request.intent
                )
                .getResponse();
        }


        /*
         * Usuário recusou explicitamente.
         */
        if (
            request.intent
                .confirmationStatus
            === 'DENIED'
        ) {

            return handlerInput
                .responseBuilder
                .speak(
                    'Certo. A mensagem não foi enviada.'
                )
                .getResponse();
        }


        /*
         * Segurança adicional:
         * nunca enviar sem confirmação.
         */
        if (
            request.intent
                .confirmationStatus
            !== 'CONFIRMED'
        ) {

            return handlerInput
                .responseBuilder
                .speak(
                    'Não consegui confirmar o envio. Nenhuma mensagem foi enviada.'
                )
                .getResponse();
        }


        const contact =
            getSlotValue(
                handlerInput,
                'Contato'
            );


        const message =
            getSlotValue(
                handlerInput,
                'Mensagem'
            );


        try {

            const result =
                await sendTextMessage(
                    contact,
                    message
                );


            if (!result.confirmed) {

                return handlerInput
                    .responseBuilder
                    .speak(
                        `Solicitei o envio para ${result.recipient}, mas não consegui confirmar que o WhatsApp recebeu a mensagem.`
                    )
                    .getResponse();
            }


            return handlerInput
                .responseBuilder
                .speak(
                    `Mensagem enviada para ${result.recipient}.`
                )
                .getResponse();


        } catch (error) {

            console.error(
                '[Alexa] Erro no envio:',
                error
            );


            if (
                error
                instanceof WhatsAppServiceError
            ) {

                return handlerInput
                    .responseBuilder
                    .speak(
                        translateWhatsAppError(
                            error
                        )
                    )
                    .getResponse();
            }


            return handlerInput
                .responseBuilder
                .speak(
                    'Ocorreu um erro inesperado durante o envio.'
                )
                .getResponse();
        }
    }
};


module.exports = {
    SendMessageIntentHandler
};
