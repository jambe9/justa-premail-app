const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// Jika Anda mengubah cakupan ini, hapus token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// Path file token akan dibuat setelah otorisasi.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Membaca token yang telah disimpan dari file.
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Menyimpan kredensial ke file untuk dijalankan di masa mendatang.
 * @param {OAuth2Client} client Klien otorisasi yang akan disimpan.
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Memuat kredensial klien, lalu meminta otorisasi pengguna, dan akhirnya
 * menyimpan kredensial yang diotorisasi untuk digunakan di masa mendatang.
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// Jalankan fungsi otorisasi dan tangani hasilnya.
authorize()
  .then(client => {
    console.log('Otorisasi berhasil! File token.json telah dibuat.');
    console.log('Anda sekarang bisa menjalankan server utama (index.js).');
  })
  .catch(err => {
    console.error('Gagal melakukan otorisasi:', err);
  });
