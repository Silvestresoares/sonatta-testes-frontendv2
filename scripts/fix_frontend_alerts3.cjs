const fs = require('fs');

const profFile = 'src/pages/Professores.jsx';
let profContent = fs.readFileSync(profFile, 'utf8');

// Replace alert(`Erro: ${err.erro || ...}`) with alert(err.erro || ...)
const regexProf = /alert\(`Erro: \$\{err\.erro \|\| 'Erro desconhecido'\}`\);/g;
profContent = profContent.replace(regexProf, `alert(err.erro || 'Erro desconhecido');`);

fs.writeFileSync(profFile, profContent, 'utf8');

const dashFile = 'src/pages/Dashboard.jsx';
if(fs.existsSync(dashFile)) {
  let dashContent = fs.readFileSync(dashFile, 'utf8');
  dashContent = dashContent.replace(/alert\(`Erro: \$\{dados\.erro\}`\);/g, `alert(dados.erro);`);
  fs.writeFileSync(dashFile, dashContent, 'utf8');
}

console.log('Professores e Dashboard alerts corrigidos.');
