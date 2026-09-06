const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'barbershop-images';
const OWNER = 'your-username';
const BRANCH = 'main';

async function uploadFile(localPath, githubPath) {
  const content = fs.readFileSync(localPath);
  const base64 = content.toString('base64');

  const data = JSON.stringify({
    message: `Upload ${path.basename(localPath)}`,
    content: base64,
    branch: BRANCH
  });

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}/contents/${githubPath}`,
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'barbershop-admin'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Пример использования
const localFile = process.argv[2];
const githubPath = process.argv[3];

if (localFile && githubPath) {
  uploadFile(localFile, githubPath)
    .then(() => console.log('✅ Загружено успешно'))
    .catch(err => console.error('❌ Ошибка:', err.message));
} else {
  console.log('Использование: node upload-to-github.js <local-file> <github-path>');
}