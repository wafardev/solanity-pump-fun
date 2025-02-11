const { createClient } = require("@supabase/supabase-js");
const { encryptData } = require("./serverCrypto");
const { Keypair } = require("@solana/web3.js");
const bip39 = require("bip39");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function keyExists(public_key) {
  const { data, error } = await supabase
    .from("keys")
    .select("public_key")
    .eq("public_key", public_key)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is the "No data" error, which is fine if no key exists
    console.error("Error checking if key exists:", error);
    return false;
  }

  return data !== null;
}

async function insertKey(public_key, private_key) {
  if (await keyExists(public_key)) {
    return `Key for wallet ${public_key} already exists`;
  }
  const encrypted_private_key = encryptData(private_key);
  const { error } = await supabase
    .from("keys")
    .insert([{ public_key, encrypted_private_key }]);

  if (error) {
    console.error("Error inserting key:", error);
    return null;
  }
  return `Key for wallet ${public_key} inserted successfully`;
}

function isValidSolanaKeyPair(publicKey, privateKey) {
  try {
    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(privateKey))
    );

    return keypair.publicKey.toString() === publicKey;
  } catch (error) {
    console.error("Invalid Solana keypair:", error);
    return false;
  }
}

(async () => {
  try {
    const args = process.argv.slice(2);
    const publicKey = args[0];
    let privateKey = args[1];

    if (!publicKey || !privateKey) {
      console.error("Error: Both public_key and private_key are required.");
      return;
    }

    if (!privateKey.startsWith("[")) {
      console.log("Private key is potentially a mnemonic phrase.");

      const seed = bip39.mnemonicToSeedSync(privateKey, "");
      const keypair = Keypair.fromSeed(seed.slice(0, 32));

      privateKey = JSON.stringify(Array.from(keypair.secretKey));
    }

    if (!isValidSolanaKeyPair(publicKey, privateKey)) {
      console.error("Error: Invalid Solana keypair.");
      return;
    }

    const insertResponse = await insertKey(publicKey, privateKey);
    console.log(insertResponse);
  } catch (error) {
    console.error("Error in example usage:", error);
  }
})();
