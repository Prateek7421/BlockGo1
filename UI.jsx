import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import axios from "axios";
import * as bip39 from 'bip39';
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import BIP32Factory from "bip32";
import * as ecc from 'tiny-secp256k1';
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
const bip32 = BIP32Factory(ecc);


async function encryptMnemonic(mnemonic, pin) {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const passwordKey = await window.crypto.subtle.importKey(
    "raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(mnemonic)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}



export default function RestoreWallet({ onRestore }) {
  const [step, setStep] = useState("pin");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [wordss, setWordss] = useState(Array(12).fill(""));

  const validPin = pin.length === 4 && pin === confirmPin;
  const validSeed = wordss.every(word => word.trim() !== "");

  const handleChange = (index, value) => {
    const v = value.toLowerCase().replace(/\s+/g, "");
    setWordss((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
  };

  const handleFinalImport = async () => {
    setLoading(true);
    const mnemonic = wordss.join(" ").trim().toLowerCase();

    if (!bip39.validateMnemonic(mnemonic)) {
      alert("Invalid mnemonic phrase. Please check the words and their order.");
      setLoading(false);
      return;
    }

    try {
      const seed = await bip39.mnemonicToSeed(mnemonic);

      const main = (seedBuffer) => {
        console.log("Deriving Wallets and Private Keys...");
        const hdNode = ethers.HDNodeWallet.fromSeed(seedBuffer);
        const ethWallet = hdNode.derivePath("m/44'/60'/0'/0/0");

    
        const btcNetwork = bitcoin.networks.bitcoin;
        const root = bip32.fromSeed(seedBuffer, btcNetwork);
        const btcChild = root.derivePath("m/44'/0'/0'/0/0"); 
        const { address: btcAddress } = bitcoin.payments.p2pkh({
          pubkey: btcChild.publicKey,
          network: btcNetwork
        });


        const solPath = "m/44'/501'/0'/0'";
        const derivedSeed = derivePath(solPath, seedBuffer.toString('hex')).key;
        const solKeypair = Keypair.fromSeed(derivedSeed);
        return {
          ethereum: {
            address: ethWallet.address,
            privateKey: ethWallet.privateKey
          },
          bitcoin: {
            address: btcAddress,
            privateKey: btcChild.toWIF()
          },
          solana: {
            address: solKeypair.publicKey.toBase58(),
            privateKey: JSON.stringify(Array.from(solKeypair.secretKey))
          }
        };
      };

      const walletData = main(seed);

  
      const ethCheckReq = axios.get(`https://api.blockcypher.com/v1/eth/main/addrs/${walletData.ethereum.address}/balance`);
      const btcCheckReq = axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${walletData.bitcoin.address}/balance`);

      const [ethRes, btcRes] = await Promise.all([ethCheckReq, btcCheckReq]).catch(() => [null, null]);

      
      const hasHistory = (ethRes?.data?.n_tx > 0) || (btcRes?.data?.n_tx > 0);
      if (!hasHistory) {
        console.log("New account detected.");
      }

      const encryptedVault = await encryptMnemonic(mnemonic, pin);

  
      localStorage.setItem("wallet_data", JSON.stringify(walletData));
      localStorage.setItem("encrypted_wallet", JSON.stringify(encryptedVault));

      console.log("✅ Import Successful. Keys derived.");

      setTimeout(() => {
        setLoading(false);
        onRestore();
      }, 1000);

    } catch (err) {
      console.error("Technical Error during Import:", err);
      alert(`Technical Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-white"
    >
      <AnimatePresence mode="wait">
        {step === "pin" ? (
          <motion.div key="pin-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-semibold mb-2">Set Security PIN</h2>
            <p className="text-sm text-gray-400 mb-6 text-center">Create a 6-digit PIN for your wallet.</p>

            <div className="space-y-6 flex flex-col items-center">
            
              <div className="relative">
                <p className="relative right-5 top-8 w-10 text-right text-sm text-neutral-500 pointer-events-none"></p>
                <input
                  type="password"
                  placeholder="PIN"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-[280px] h-11 rounded-xl bg-[#151515] border border-neutral-700 pl-[21px] text-lg font-semibold outline-none text-white tracking-widest"
                />
              </div>

              <div className="relative">
                <p className="relative right-5 top-8 w-10 text-right text-sm text-neutral-500 pointer-events-none"></p>
                <input
                  type="password"
                  placeholder="Confirm PIN"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="w-[280px] h-11 rounded-xl bg-[#151515] border border-neutral-700 pl-[21px] text-lg font-semibold outline-none text-white tracking-widest"
                />
              </div>
            </div>

            <button
              disabled={!validPin}
              onClick={() => setStep("seed")}
              className={`w-full py-3 mt-10 rounded-xl font-medium ${validPin ? "bg-purple-600" : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"}`}
            >
              Continue to Seed Phrase
            </button>
          </motion.div>
        ) : (
          <motion.div key="seed-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-semibold mb-2">Import Wallet</h2>
            <p className="text-sm text-gray-400 mb-4">Enter your 12-word recovery phrase.</p>

            <div className="w-full grid grid-cols-3 gap-3 relative right-1">
              {wordss.map((word, i) => (
                <div key={i} className="relative">
                  <p className={`relative right-5 top-8 w-10 text-right text-sm text-neutral-500 pointer-events-none ${i >= 9 ? "right-[21px]" : "right-[21px]"}`}>
                    {i + 1}.
                  </p>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => handleChange(i, e.target.value)}
                    className="w-[110%] h-11 rounded-xl bg-[#151515] border border-neutral-700 pl-[21px] mr-6 text-lg font-semibold font-sans outline-none text-white"
                    autoComplete="on"
                  />
                </div>
              ))}
            </div>

            <button
              disabled={!validSeed || loading}
              onClick={handleFinalImport}
              className={`w-full py-3 mt-3 rounded-xl font-medium transition ${validSeed ? "bg-[#a996ff] text-black" : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"}`}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent mr-2 inline-block align-middle" />
                  Processing...
                </>
              ) : (
                "Import Seed Phrase"
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">Make sure no one is watching your screen</p>
            <button onClick={() => setStep("pin")} className="w-full text-xs text-neutral-500 mt-2 hover:underline">← Change PIN</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
