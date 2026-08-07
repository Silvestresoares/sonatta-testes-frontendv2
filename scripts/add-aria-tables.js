import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, '../src/pages');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (filepath.endsWith('.jsx')) {
      callback(filepath);
    }
  }
}

let changedFiles = 0;

walk(pagesDir, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let modified = false;

  // Busca por <table e verifica se já tem role
  const tableRegex = /<table([^>]*)>/g;
  
  content = content.replace(tableRegex, (match, attrs) => {
    if (!attrs.includes('role=')) {
      modified = true;
      return `<table role="table" aria-label="Tabela de dados"${attrs}>`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✅ Adicionado ARIA labels em: ${path.basename(filepath)}`);
    changedFiles++;
  }
});

console.log(`\n🎉 Processo concluído! ${changedFiles} arquivos atualizados para Acessibilidade.`);
