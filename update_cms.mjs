import fs from 'fs';
let content = fs.readFileSync('src/pages/CmsDashboard.tsx', 'utf8');
content = content.replace(
  '<button onClick={() => setIsCreating(true)} className="bg-pink-500 text-white px-4 py-2 rounded">',
  '<button onClick={() => setIsCreating(!isCreating)} className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors z-10">'
);
fs.writeFileSync('src/pages/CmsDashboard.tsx', content);
