const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');

let currentContent = '';
if (fs.existsSync(envLocalPath)) {
    currentContent = fs.readFileSync(envLocalPath, 'utf8');
}

// Extract existing keys
const getKey = (key) => {
    const match = currentContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].replace(/"/g, '').trim() : null;
};

const googleKey = getKey('GOOGLE_GENAI_API_KEY');
const authSecret = getKey('AUTH_SECRET') || getKey('NEXTAUTH_SECRET');
const dbUrl = getKey('DATABASE_URL');

// Define desired values
const newDbUrl = dbUrl || "file:./dev.db";
const newGoogleKey = googleKey || ""; // If missing, we can't really restore it easily unless we know it. But it was in the file.
const newAuthSecret = authSecret || require('crypto').randomBytes(32).toString('hex');
const newNextAuthUrl = "http://localhost:3000";

let newContent = `DATABASE_URL="${newDbUrl}"\n`;
if (newGoogleKey) newContent += `GOOGLE_GENAI_API_KEY="${newGoogleKey}"\n`;
newContent += `NEXTAUTH_URL="${newNextAuthUrl}"\n`;
newContent += `AUTH_SECRET="${newAuthSecret}"\n`;

fs.writeFileSync(envLocalPath, newContent, 'utf8');
console.log('Reconstructed .env.local');
console.log(newContent);
