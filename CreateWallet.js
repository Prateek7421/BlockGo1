import express from 'express';
import bip39 from "bip39";
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import BIP32Factory from "bip32";
import * as ecc from 'tiny-secp256k1';
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

const bip32 = BIP32Factory(ecc);
const authrouter2 = express.Router();

function deriveEthereumWallet(seed) {
    
    const ethPath = "m/44'/60'/0'/0/0";
    const hdNode = ethers.HDNodeWallet.fromSeed(seed);
    const child = hdNode.derivePath(ethPath);
    return {
        address: child.address, 
        privateKey: child.privateKey 
    };
}

function deriveBitcoinWallet(seed) {
    const btcPath = "m/44'/0'/0'/0/0"; 
    const network = bitcoin.networks.bitcoin; 
    const rootNode = bip32.fromSeed(seed, network);
    const btcNode = rootNode.derivePath(btcPath);

    const { address } = bitcoin.payments.p2pkh({
        pubkey: btcNode.publicKey,
        network: network
    });

    return {
        address: address, 
        privateKey: btcNode.toWIF() 
    };
}


function deriveSolanaWallet(seed) {
    
    const solPath = "m/44'/501'/0'/0'";
    const derivedSeed = derivePath(solPath, seed.toString("hex")).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    
    return {
        address: keypair.publicKey.toBase58(),
        privateKey: JSON.stringify(Array.from(keypair.secretKey))
    };
}


authrouter2.get('/generate-wallet', async (req, res) => {
    try {

        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);

        const addresses= await main(mnemonic, seed);

        res.json({
            mnemonic: mnemonic,
            seed: seed.toString('hex'),
            addresses: addresses 
        });
     } catch (error) {
        console.error("Generation Error:", error);
        res.status(500).json({ error: "Failed to generate Mainnet wallet" });
    }
});

async function main(mnemonic, seed) {
    console.log("\n==============================");
    console.log(" Generating MAINNET Accounts ");
    console.log("==============================");
    
    const ethAccount = deriveEthereumWallet(seed);
    const btcAccount = deriveBitcoinWallet(seed);
    const solAccount = deriveSolanaWallet(seed);

    console.log("✅ Mainnet generation complete.");

    return {
        ethereum: ethAccount,
        bitcoin: btcAccount,
        solana: solAccount
    };
}

export default authrouter2;
