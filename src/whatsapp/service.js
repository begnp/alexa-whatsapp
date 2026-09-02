const {
    client,
    getWhatsAppStatus
} = require('./client');


class WhatsAppServiceError extends Error {

    constructor(
        code,
        message,
        details = {}
    ) {

        super(message);

        this.name = 'WhatsAppServiceError';

        this.code = code;

        this.details = details;
    }
}


function normalizeName(value = '') {

    return value
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}


function assertWhatsAppReady() {

    const status =
        getWhatsAppStatus();

    if (!status.ready) {

        throw new WhatsAppServiceError(
            'WHATSAPP_NOT_READY',
            'O WhatsApp ainda não está pronto.'
        );
    }
}


function validateMessage(message) {

    if (
        typeof message !== 'string'
        ||
        !message.trim()
    ) {

        throw new WhatsAppServiceError(
            'INVALID_MESSAGE',
            'A mensagem não pode estar vazia.'
        );
    }

    return message.trim();
}


async function findChatByName(name) {

    assertWhatsAppReady();

    const target =
        normalizeName(name);

    if (!target) {

        throw new WhatsAppServiceError(
            'INVALID_RECIPIENT',
            'O nome do destinatário é obrigatório.'
        );
    }


    const chats =
        await client.getChats();


    /*
     * Inicialmente permitiremos apenas
     * conversas individuais.
     *
     * Grupos serão tratados posteriormente.
     */
    const eligibleChats =
        chats.filter((chat) => {

            return (
                chat.name
                &&
                !chat.isGroup
                &&
                !chat.isReadOnly
            );
        });


    /*
     * 1. Correspondência exata
     */
    const exactMatches =
        eligibleChats.filter((chat) => {

            return (
                normalizeName(chat.name)
                === target
            );
        });


    if (exactMatches.length === 1) {

        return exactMatches[0];
    }


    if (exactMatches.length > 1) {

        throwAmbiguousChat(
            exactMatches
        );
    }


    /*
     * 2. Começa com o termo
     *
     * Exemplo:
     *
     * "Amanda"
     *
     * encontra:
     *
     * "Amanda Silva"
     */
    const prefixMatches =
        eligibleChats.filter((chat) => {

            return normalizeName(
                chat.name
            ).startsWith(target);
        });


    if (prefixMatches.length === 1) {

        return prefixMatches[0];
    }


    if (prefixMatches.length > 1) {

        throwAmbiguousChat(
            prefixMatches
        );
    }


    /*
     * 3. Correspondência parcial
     */
    const partialMatches =
        eligibleChats.filter((chat) => {

            return normalizeName(
                chat.name
            ).includes(target);
        });


    if (partialMatches.length === 1) {

        return partialMatches[0];
    }


    if (partialMatches.length > 1) {

        throwAmbiguousChat(
            partialMatches
        );
    }


    throw new WhatsAppServiceError(
        'CHAT_NOT_FOUND',
        `Nenhuma conversa encontrada para "${name}".`
    );
}


function throwAmbiguousChat(chats) {

    const candidates =
        chats
            .slice(0, 5)
            .map((chat) => chat.name);


    throw new WhatsAppServiceError(
        'AMBIGUOUS_CHAT',
        'Mais de uma conversa corresponde ao nome informado.',
        {
            candidates
        }
    );
}


async function sendTextMessage(
    recipientName,
    message
) {

    assertWhatsAppReady();

    const safeMessage =
        validateMessage(message);


    const chat =
        await findChatByName(
            recipientName
        );


    let sentMessage;

    try {

        sentMessage =
            await chat.sendMessage(
                safeMessage
            );

    } catch (error) {

        throw new WhatsAppServiceError(
            'MESSAGE_SEND_FAILED',
            `Não foi possível enviar a mensagem para "${chat.name}".`,
            {
                cause:
                    error instanceof Error
                        ? error.message
                        : String(error)
            }
        );
    }


    const messageId =
        sentMessage?.id?._serialized
        ?? null;


    /*
     * Algumas versões recentes podem retornar
     * Message antes do ACK efetivo.
     */
    let deliveryConfirmation = {

        confirmed: false,

        ack:
            sentMessage?.ack
            ?? null,

        reason:
            'not_confirmed'
    };


    /*
     * Se a própria Message já chegou
     * com ACK_SERVER ou superior,
     * não precisamos aguardar.
     */
    if (
        typeof sentMessage?.ack === 'number'
        &&
        sentMessage.ack >= 1
    ) {

        deliveryConfirmation = {

            confirmed: true,

            ack:
                sentMessage.ack
        };

    } else if (messageId) {

        deliveryConfirmation =
            await waitForMessageAck(
                messageId,
                1,
                10000
            );
    }


    console.log(
        `[WhatsApp] sendMessage retornou para "${chat.name}".`
    );


    if (
        deliveryConfirmation.confirmed
    ) {

        console.log(
            `[WhatsApp] Envio confirmado. ACK: ${deliveryConfirmation.ack}`
        );

    } else {

        console.warn(
            '[WhatsApp] Envio sem confirmação:',
            deliveryConfirmation.reason
        );
    }


    return {

        recipient:
            chat.name,

        chatId:
            chat.id?._serialized
            ?? null,

        messageId,

        messageObjectReturned:
            Boolean(sentMessage),

        confirmed:
            deliveryConfirmation.confirmed,

        ack:
            deliveryConfirmation.ack
            ?? null,

        confirmationReason:
            deliveryConfirmation.reason
            ?? null
    };
}

function waitForMessageAck(
    messageId,
    minimumAck = 1,
    timeoutMs = 10000
) {

    if (!messageId) {

        return Promise.resolve({
            confirmed: false,
            reason: 'missing_message_id'
        });
    }


    return new Promise(
        (resolve) => {

            let finished = false;


            const finish = (result) => {

                if (finished) {
                    return;
                }

                finished = true;

                clearTimeout(timeout);

                client.removeListener(
                    'message_ack',
                    handleAck
                );

                resolve(result);
            };


            const handleAck = (
                message,
                ack
            ) => {

                const ackMessageId =
                    message?.id?._serialized;


                if (
                    ackMessageId
                    !== messageId
                ) {
                    return;
                }


                console.log(
                    `[WhatsApp] ACK ${ack} recebido para ${messageId}.`
                );


                if (ack === -1) {

                    finish({
                        confirmed: false,
                        ack,
                        reason: 'ack_error'
                    });

                    return;
                }


                if (
                    ack >= minimumAck
                ) {

                    finish({
                        confirmed: true,
                        ack
                    });
                }
            };


            const timeout =
                setTimeout(
                    () => {

                        finish({
                            confirmed: false,
                            reason: 'ack_timeout'
                        });

                    },
                    timeoutMs
                );


            client.on(
                'message_ack',
                handleAck
            );
        }
    );
}


module.exports = {

    findChatByName,

    sendTextMessage,

    waitForMessageAck,

    WhatsAppServiceError
};
