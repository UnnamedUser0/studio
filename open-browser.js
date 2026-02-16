const { exec } = require('child_process');

const url = 'https://localhost:3000';
const maxRetries = 30; // 30 seconds timeout
let retries = 0;

const openBrowser = () => {
    const startCommand = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${startCommand} ${url}`);
};

const checkConnection = async () => {
    if (retries >= maxRetries) {
        console.log('Could not connect to server after 30 seconds.');
        return;
    }

    try {
        // Suppress self-signed cert errors for local dev
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        await fetch(url);
        console.log('Server is ready, opening browser...');
        openBrowser();
    } catch (error) {
        retries++;
        setTimeout(checkConnection, 1000);
    }
};

checkConnection();
