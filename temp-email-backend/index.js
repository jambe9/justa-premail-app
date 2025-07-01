// --- Import Pustaka yang Dibutuhkan ---
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const bcrypt = require('bcrypt');

// --- Konfigurasi Awal ---
const app = express();
app.use(cors());
app.use(express.json());

// =================================================================
// PERUBAHAN KEAMANAN: Mendeteksi lingkungan (Render vs Lokal)
// =================================================================
const isProduction = process.env.NODE_ENV === 'production';
// Di Render, Secret Files disimpan di /etc/secrets/
const secretsPath = isProduction ? '/etc/secrets' : __dirname;

const FIREBASE_CONFIG_PATH = path.join(secretsPath, 'firebaseConfig.json');
const CREDENTIALS_PATH = path.join(secretsPath, 'credentials.json');
const TOKEN_PATH = path.join(secretsPath, 'token.json');
// =================================================================

let firebaseConfig;
let gmailAuthClient;

// --- Fungsi Inisialisasi ---
async function initializeAppConfig() {
    try {
        console.log(`Memuat konfigurasi dari path: ${secretsPath}`);
        
        // Memuat konfigurasi Firebase
        const firebaseConfigContent = await fs.readFile(FIREBASE_CONFIG_PATH);
        firebaseConfig = JSON.parse(firebaseConfigContent);
        const firebaseApp = initializeApp(firebaseConfig);
        const db = getFirestore(firebaseApp);

        // Memuat klien Gmail
        const credentialsContent = await fs.readFile(CREDENTIALS_PATH);
        const credentials = JSON.parse(credentialsContent);
        const tokenContent = await fs.readFile(TOKEN_PATH);
        const token = JSON.parse(tokenContent);

        const { client_secret, client_id } = credentials.installed || credentials.web;
        const client = new google.auth.OAuth2(client_id, client_secret);
        client.setCredentials(token);
        gmailAuthClient = client;

        console.log('Klien Firebase dan Gmail berhasil dimuat dan siap digunakan.');
        return { db }; // Kembalikan db untuk digunakan di routes
    } catch (error) {
        console.error('KRITIS: Gagal memuat file konfigurasi atau menginisialisasi layanan.', error);
        // Hentikan aplikasi jika konfigurasi penting gagal dimuat
        process.exit(1); 
    }
}


// --- Menjalankan Server dan API ---
initializeAppConfig().then(({ db }) => {
    const saltRounds = 10;

    // --- API Endpoints ---
    app.post('/api/protect', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email dan kata sandi tidak boleh kosong.' });
        const userRef = doc(db, 'users', email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) return res.status(409).json({ message: 'Email ini sudah dilindungi.' });
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await setDoc(userRef, { email, password: hashedPassword, createdAt: new Date() });
        res.status(201).json({ message: 'Email berhasil dilindungi!' });
      } catch (error) {
        console.error('Error di /api/protect:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
      }
    });

    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email dan kata sandi tidak boleh kosong.' });
        const userRef = doc(db, 'users', email);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return res.status(404).json({ message: 'Email ini belum dilindungi.' });
        const userData = userSnap.data();
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) return res.status(401).json({ message: 'Kata sandi salah.' });

        if (!gmailAuthClient) {
            return res.status(503).json({ message: 'Layanan Gmail sedang tidak siap, coba lagi.' });
        }
        const gmail = google.gmail({ version: 'v1', auth: gmailAuthClient });
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            q: `to:${email}`,
            maxResults: 50, 
        });

        if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
            return res.json({ message: 'Login berhasil, kotak masuk kosong.', emails: [] });
        }

        const emails = await Promise.all(
            listResponse.data.messages.map(async (message) => {
                const msg = await gmail.users.messages.get({ userId: 'me', id: message.id });
                const payload = msg.data.payload;
                const headers = payload.headers;
                const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Tidak diketahui';
                const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'Tanpa Subjek';
                let body = '';
                
                function getEmailBody(payload) {
                    let htmlPart = findPart(payload, 'text/html');
                    if (htmlPart) return Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
                    let textPart = findPart(payload, 'text/plain');
                    if (textPart) return Buffer.from(textPart.body.data, 'base64').toString('utf8').replace(/\n/g, '<br>');
                    if (payload.body && payload.body.data) return Buffer.from(payload.body.data, 'base64').toString('utf8');
                    return '<i>(Tidak ada konten yang bisa ditampilkan)</i>';
                }

                function findPart(payload, mimeType) {
                    let foundPart = null;
                    if (payload.parts) {
                        for (const part of payload.parts) {
                            if (part.mimeType === mimeType) {
                                foundPart = part;
                                break;
                            }
                            if (part.parts) {
                                foundPart = findPart(part, mimeType);
                                if (foundPart) break;
                            }
                        }
                    }
                    return foundPart;
                }

                body = getEmailBody(payload);
                return { from, subject, body, time: new Date(parseInt(msg.data.internalDate)).toLocaleString('id-ID') };
            })
        );
        
        res.json({ message: 'Email berhasil diambil.', emails: emails });

      } catch (error) {
        console.error('Error di /api/login:', error);
        res.status(500).json({ message: 'Gagal mengambil email dari Gmail.' });
      }
    });

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server backend berjalan di port ${PORT}`);
    });

}).catch(error => {
    console.error("Aplikasi gagal dijalankan karena gagal inisialisasi.", error);
});
