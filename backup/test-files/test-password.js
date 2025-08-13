const bcrypt = require('bcryptjs');

const plainPassword = 'user123';
const hashedPassword = '$2a$10$RKB86Mi0IHIUHMKxMIm0KuLn/NGwOGTeFZc0H.q5Div74u8sAGiwe';

console.log('Testing password:', plainPassword);
console.log('Against hash:', hashedPassword);

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password match:', result);
  }
});