const fs = require('fs');

// Fix Alunos.jsx error alert
const alunosFile = 'src/pages/Alunos.jsx';
let alunosContent = fs.readFileSync(alunosFile, 'utf8');

const alunosOldBlock = `const erroTexto = await respuesta.text();
        alert(\`Erro do servidor ao salvar: \${erroTexto}\`);`;
const alunosNewBlock = `try {
          const erroObj = await respuesta.json();
          alert(erroObj.erro || 'Erro desconhecido ao salvar.');
        } catch {
          const erroTexto = await respuesta.text();
          alert(erroTexto);
        }`;

if(alunosContent.includes(alunosOldBlock)) {
  alunosContent = alunosContent.replace(alunosOldBlock, alunosNewBlock);
  fs.writeFileSync(alunosFile, alunosContent, 'utf8');
}

// Fix Professores.jsx error alert
const profFile = 'src/pages/Professores.jsx';
let profContent = fs.readFileSync(profFile, 'utf8');

const profOld = `alert(\`Erro: \${err.erro || 'Erro desconhecido'}\`);`;
const profNew = `alert(err.erro || 'Erro desconhecido');`;

if(profContent.includes(profOld)) {
  profContent = profContent.replace(profOld, profNew);
  fs.writeFileSync(profFile, profContent, 'utf8');
}

console.log('Alerts atualizados no frontend.');
