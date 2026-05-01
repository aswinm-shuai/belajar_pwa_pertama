const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');
content = content.split('\\`').join('`');
content = content.split('\\$').join('$');
content = content.split("\\'").join("'");
content = content.split('\\\\D').join('\\D');
content = content.split('\\\\n').join('\\n');
fs.writeFileSync('app.js', content, 'utf8');
console.log('Fixed');
