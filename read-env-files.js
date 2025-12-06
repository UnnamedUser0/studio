const fs = require('fs');
const path = require('path');

const files = ['.env', '.env.local'];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        console.log(`--- Content of ${file} ---`);
        console.log(fs.readFileSync(filePath, 'utf8'));
        console.log(`--- End of ${file} ---`);
    } else {
        console.log(`${file} does not exist.`);
    }
});
