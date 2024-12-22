import crypto from 'crypto';

// // Generate a 32-byte key
// const key = crypto.randomBytes(32);

// console.log('Key:', key.toString('hex'));
function encryptPrivateKey(privateKey: string): string {
    const iv = crypto.randomBytes(16);
    if (iv.length !== 16) {
        throw new Error('Failed to generate a 16-byte IV');
    }
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex'), iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptPrivateKey(encryptedPrivateKey: string): string {
    try {

        const textParts = encryptedPrivateKey.split(':');
        const iv = Buffer.from(textParts.shift() as string, 'hex');

        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex'), iv);
        let decrypted = decipher.update(encryptedText.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error:any) {
        if (error.code === 'ERR_CRYPTO_INVALID_IV') {
            console.error('Invalid IV length');
        } else {
            throw error;
        }
        return '';
    }
}

export { encryptPrivateKey, decryptPrivateKey };