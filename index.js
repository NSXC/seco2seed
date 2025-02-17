const express = require("express");
const seco = require("seco-file");
const zlib = require("zlib");
const bs = require("bitcoin-seed");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "100mb" })); 
function shrink(buffer) {
    const length = buffer.readUInt32BE(0);
    return buffer.slice(4, length + 4);
}

function decrypt(secoData, password) {
    try {
        let decrypted = seco.decryptData(Buffer.from(secoData, "base64"), password).data;
        let shrinked = shrink(decrypted);
        let gunzipped = zlib.gunzipSync(shrinked);
        let mnemonic = bs.fromBuffer(gunzipped).mnemonicString;
        return { mnemonic };
    } catch (err) {
        return { error: "Decryption failed. Invalid data or password." };
    }
}

app.post("/decrypt", (req, res) => {
    const { seed_seco, passphrase } = req.body;
    if (!seed_seco || !passphrase) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    const result = decrypt(seed_seco, passphrase);
    res.json(result);
});

const PORT = 8888;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
