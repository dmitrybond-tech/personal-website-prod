// Use --env-file to load .env.local; do NOT import dotenv here.
const required = [
  'AUTH_URL',
  'AUTH_REDIRECT_URI',
  'AUTH_SECRET',
  'AUTH_TRUST_HOST',
  'AUTHJS_GITHUB_CLIENT_ID',
  'AUTHJS_GITHUB_CLIENT_SECRET',
  'DECAP_GITHUB_CLIENT_ID',
  'DECAP_GITHUB_CLIENT_SECRET',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing env:', missing.join(', '));
  process.exit(1);
} else {
  console.log('Env OK');
}
