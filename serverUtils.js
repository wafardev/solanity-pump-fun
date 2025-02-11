const { createClient } = require("@supabase/supabase-js");
const { decryptData } = require("./serverCrypto");
const { Keypair } = require("@solana/web3.js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function fetchAllKeys() {
  const { data, error } = await supabase.from("keys").select("*");

  if (error) {
    console.error("Error fetching keys:", error);
    return null;
  }
  return data;
}

async function fetchUnusedKeys() {
  const { data, error } = await supabase
    .from("keys")
    .select("*")
    .eq("used", false);

  if (error) {
    console.error("Error fetching keys:", error);
    return null;
  }
  return data;
}

async function updateKey(public_key) {
  const { error } = await supabase
    .from("keys")
    .update({ used: true })
    .eq("public_key", public_key);

  if (error) {
    console.error("Error updating key:", error);
    return null;
  }
  return `Key for wallet ${public_key} updated successfully`;
}

async function deleteKey(public_key) {
  const { error } = await supabase
    .from("keys")
    .delete()
    .eq("public_key", public_key);

  if (error) {
    console.error("Error deleting key:", error);
    return null;
  }
  return `Key for wallet ${public_key} deleted successfully`;
}
