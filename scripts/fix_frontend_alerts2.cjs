const fs = require('fs');

// Fix Alunos.jsx error alert
const alunosFile = 'src/pages/Alunos.jsx';
let alunosContent = fs.readFileSync(alunosFile, 'utf8');

const regexAlunos = /const\s+erroTexto\s*=\s*await\s+respuesta\.text\(\);\s*alert\(`Erro do servidor ao salvar: \$\{erroTexto\}`\);/g;
const newAlunos = `let erroTexto = await respuesta.text();
        try {
          const erroObj = JSON.parse(erroTexto);
          alert(erroObj.erro || 'Erro desconhecido ao salvar.');
        } catch {
          alert(erroTexto);
        }`;

alunosContent = alunosContent.replace(regexAlunos, newAlunos);

const regexAlunos2 = /const\s+erroTexto\s*=\s*await\s+resposta\.text\(\);\s*alert\(`Erro ao alterar status: \$\{erroTexto\}`\);/g;
const newAlunos2 = `let erroTexto = await resposta.text();
        try {
          const erroObj = JSON.parse(erroTexto);
          alert(erroObj.erro || 'Erro ao alterar status.');
        } catch {
          alert(erroTexto);
        }`;

alunosContent = alunosContent.replace(regexAlunos2, newAlunos2);
fs.writeFileSync(alunosFile, alunosContent, 'utf8');

console.log('Alerts atualizados no frontend com regex.');
