const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envLocalPath });

if (result.error) {
    console.log('Error loading .env.local:', result.error);
} else {
    console.log('.env.local loaded successfully');
}

console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL ? 'Set' : 'Not Set');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set');
console.log('AUTH_SECRET:', process.env.AUTH_SECRET ? 'Set' : 'Not Set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
