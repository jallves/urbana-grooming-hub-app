
const { execSync } = require('child_process');

try {
  execSync('npx jest', { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
