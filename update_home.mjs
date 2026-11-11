import fs from 'fs';
let content = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');
content = content.replace("const time = useTimer(new Date(siteData.anniversaryDate));", "const time = useTimer(siteData.anniversaryDate);");
fs.writeFileSync('src/pages/HomePage.tsx', content);
