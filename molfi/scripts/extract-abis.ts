import * as fs from 'fs';
import * as path from 'path';

const abisDir = 'src/abis';
const files = fs.readdirSync(abisDir);

files.forEach(file => {
    if (file.endsWith('.json')) {
        const filePath = path.join(abisDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (content.abi) {
            console.log(`Extracting ABI from ${file}...`);
            fs.writeFileSync(filePath, JSON.stringify(content.abi, null, 2));
        }
    }
});
