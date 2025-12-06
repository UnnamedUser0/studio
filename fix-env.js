const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.resolve(process.cwd(), '.env.local');

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    let newContent = content;
    let added = false;

    if (!content.includes('NEXTAUTH_URL=')) {
        newContent += '\nNEXTAUTH_URL="http://localhost:3000"';
        console.log('Adding NEXTAUTH_URL...');
        added = true;
    }

    if (!content.includes('AUTH_SECRET=') && !content.includes('NEXTAUTH_SECRET=')) {
        const secret = crypto.randomBytes(32).toString('hex');
        newContent += `\nAUTH_SECRET="${secret}"`;
        console.log('Adding AUTH_SECRET...');
        added = true;
    }

    if (added) {
        fs.writeFileSync(envPath, newContent, 'utf8');
        console.log('.env.local updated successfully.');
    } else {
        console.log('.env.local already contains the necessary variables.');
    }

} catch (err) {
    console.error('Error updating .env.local:', err);
}
