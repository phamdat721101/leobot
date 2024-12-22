async function sendMessage(chatId: string, text: string) {
    const token = 'YOUR_BOT_TOKEN';

    const url = `https://api.telegram.org/bot${process.env.BOT_KEY}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}
export { sendMessage }