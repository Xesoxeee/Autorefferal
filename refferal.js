const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const apiId = 27544833;  // Ganti dengan API ID Anda
const apiHash = '09bc9a746b2c4de9f8b29effe686f418';  // Ganti dengan API Hash Anda

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAndSendReferral() {
    const sessionFolder = 'sessions';
    const botUsername = 'FourSeasonsFarmBot'; // tanpa '@'
    const referralCode = '812012811'; // kode referral

    if (!fs.existsSync(sessionFolder) || fs.readdirSync(sessionFolder).length === 0) {
        console.log('❌ Folder sessions tidak ditemukan atau kosong.');
        return;
    }

    const sessionFiles = fs.readdirSync(sessionFolder).filter(file => file.endsWith('.session'));

    if (sessionFiles.length === 0) {
        console.log('❌ Tidak ada file .session yang ditemukan.');
        return;
    }

    console.log('Pilih file session:');
    sessionFiles.forEach((file, i) => {
        console.log(`${i + 1}. ${file}`);
    });

    const selected = parseInt(await askQuestion("Pilih nomor session (0 untuk semua): "), 10);
    let filesToUse = [];

    if (selected === 0) {
        filesToUse = sessionFiles;
    } else if (selected > 0 && selected <= sessionFiles.length) {
        filesToUse = [sessionFiles[selected - 1]];
    } else {
        console.log('❌ Pilihan tidak valid.');
        return;
    }

    for (const sessionFile of filesToUse) {
        const sessionPath = path.join(sessionFolder, sessionFile);
        const sessionString = fs.readFileSync(sessionPath, 'utf8').trim();

        if (!sessionString) {
            console.log(`❌ Session ${sessionFile} kosong.`);
            continue;
        }

        const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
            connectionRetries: 5,
        });

        try {
            await client.connect();
            console.log(`✅ Berhasil login: ${sessionFile}`);

            console.log(`🤖 Mengirim /start ${referralCode} ke @${botUsername}...`);
            await client.sendMessage(botUsername, {
                message: `/start ${referralCode}`
            });
            console.log(`✅ Referral terkirim dari ${sessionFile}`);

        } catch (err) {
            console.log(`❌ Gagal login/kirim untuk ${sessionFile}: ${err.message}`);
        }

        await delay(3000);
    }

    rl.close();
}

async function main() {
    console.log("=== Telegram Referral Sender ===");
    console.log("1. Jalankan referral");
    console.log("2. Keluar");

    const choice = await askQuestion("Pilih opsi (1/2): ");
    if (choice === '1') {
        await loginAndSendReferral();
    } else {
        console.log("Keluar...");
        rl.close();
    }
}

main();
