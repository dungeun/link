const bcrypt = require('bcryptjs');

const passwords = {
  'user@example.com': 'user123',
  'business@company.com': 'business123', 
  'admin@linkpick.co.kr': 'admin123!'
};

async function generateHashes() {
  for (const [email, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`UPDATE users SET password = '${hash}' WHERE email = '${email}';`);
  }
}

generateHashes();