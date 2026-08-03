import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, 'src', 'pages');

const processDirectory = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let hasChanges = false;
      
      // Encontrar e remover o bloco de boilerplate
      const lines = content.split('\n');
      const newLines = [];
      let i = 0;
      let insertedImport = false;
      let removedBoilerplate = false;
      
      // Determine the correct relative path to utils/api
      const relPath = path.relative(path.dirname(fullPath), path.join(__dirname, 'src', 'utils', 'api.js')).replace(/\\/g, '/');
      const importPath = relPath.startsWith('.') ? relPath.replace('.js', '') : `./${relPath.replace('.js', '')}`;
      
      while (i < lines.length) {
        const line = lines[i];
        
        // Remove linhas do boilerplate
        if (
          line.includes('const _envApi = import.meta.env.VITE_API_URL') ||
          line.includes('const _defaultLocal =') ||
          line.includes('const API_URL =') ||
          line.includes('? _defaultLocal') ||
          line.includes(': (_envApi || _defaultLocal);') ||
          line.includes('? \'http://localhost:3005\'') ||
          line.includes('window.location.hostname.includes(\'localhost\')')
        ) {
          removedBoilerplate = true;
          hasChanges = true;
          i++;
          continue;
        }

        // Insert import right after the last react import if we removed the boilerplate
        // Actually, we can just insert it after the first import or right at the top if there's no import
        newLines.push(line);
        i++;
      }
      
      if (removedBoilerplate) {
         // Insert import at the top (after the first block of imports)
         let insertIndex = 0;
         while (insertIndex < newLines.length && (newLines[insertIndex].startsWith('import ') || newLines[insertIndex].trim() === '')) {
             insertIndex++;
         }
         
         // Don't insert if it's already there
         if (!newLines.some(l => l.includes(`import { API_URL }`))) {
             newLines.splice(insertIndex, 0, `import { API_URL } from '${importPath}';`);
         }
         content = newLines.join('\n');
         fs.writeFileSync(fullPath, content, 'utf8');
         console.log(`Updated: ${fullPath}`);
      }
    }
  }
};

processDirectory(directoryPath);
console.log('Frontend refactoring API_URL complete.');
