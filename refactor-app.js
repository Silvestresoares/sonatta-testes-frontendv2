import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appFile = path.join(__dirname, 'src', 'App.jsx');

let content = fs.readFileSync(appFile, 'utf8');

// 1. Add Suspense to react import
if (!content.includes('Suspense')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, Suspense } from 'react';");
}

// 2. Remove old API_URL and interceptor logic
content = content.replace(/const _envApi = import\.meta\.env\.VITE_API_URL;[\s\S]*?return response;\n};\n/m, "import { API_URL } from './utils/api';\n");

// 3. Replace all synchronous imports with React.lazy
const importRegex = /import\s+([A-Z][a-zA-Z0-9_]*)\s+from\s+['"](\.\/pages\/[^'"]+)['"];/g;
content = content.replace(importRegex, (match, componentName, path) => {
  return `const ${componentName} = React.lazy(() => import('${path}'));`;
});

// 4. Wrap <Routes> with <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-500">Carregando...</div>}>
// Wait, the routes are rendered somewhere inside App.jsx, like `<Routes> ... </Routes>`.
if (content.includes('<Routes>') && !content.includes('<Suspense fallback=')) {
  content = content.replace(/<Routes>/g, '<Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-500">Carregando Tela...</div>}>\n          <Routes>');
  content = content.replace(/<\/Routes>/g, '</Routes>\n          </Suspense>');
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('App.jsx refactored with React.lazy and Suspense.');
