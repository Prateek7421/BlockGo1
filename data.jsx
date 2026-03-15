import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import * as solanaWeb3 from "@solana/web3.js";
import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';
import { Buffer } from 'buffer';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

window.Buffer = Buffer;
const ECPair = ECPairFactory(ecc);

const SendTransaction = () => {
  const [coin, setCoin] = useState('ETH');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const walletData = JSON.parse(localStorage.getItem("wallet_data") || "{}");

  const getNetworkColor = () => {
    switch(coin) {
      case 'ETH': return 'from-blue-500 to-blue-700';
      case 'SOL': return 'from-purple-500 to-indigo-600';
      case 'BTC': return 'from-orange-400 to-orange-600';
      default: return 'from-green-500 to-green-700';
    }
  };


  const sendETH = async () => {

    const privateKey = walletData?.ethereum?.privateKey;
    if (!privateKey) throw new Error("ETH Private Key not found");


    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther(amount.toString()),
    });
    
    const receipt = await tx.wait(1);
    return receipt.hash;
  };
   const sendSOL = async () => {
    const privateKey = walletData?.solana?.privateKey;
    if (!privateKey) throw new Error("SOL Private Key not found");
    const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const secretKey = new Uint8Array(JSON.parse(privateKey));
    const fromKeypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
    
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: new solanaWeb3.PublicKey(address),
        lamports: parseFloat(amount) * solanaWeb3.LAMPORTS_PER_SOL,
      })
    );

    const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
    return signature;
  }
     const sendBTC = async () => {
    const privateKey = walletData?.bitcoin?.privateKey;
    if (!privateKey) throw new Error("BTC Private Key not found");

    const network = bitcoin.networks.bitcoin;
    const keyPair = ECPair.fromWIF(privateKey, network);
    const { address: fromAddr } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });

  
    const { data: utxos } = await axios.get(`https://blockstream.info/api/address/${fromAddr}/utxo`);
    if (utxos.length === 0) throw new Error("No UTXOs found. Balance is 0.");

    const psbt = new bitcoin.Psbt({ network });
    
  
    let totalInputSatoshis = 0;
    const targetSendSatoshis = parseInt(amount); 
    const estimatedFee = 2500; 

    for (const utxo of utxos) {
        const { data: txHex } = await axios.get(`https://blockstream.info/api/tx/${utxo.txid}/hex`);
        psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            nonWitnessUtxo: Buffer.from(txHex, 'hex'),
        });
        totalInputSatoshis += utxo.value;
        if (totalInputSatoshis >= targetSendSatoshis + estimatedFee) break;
    }

    if (totalInputSatoshis < targetSendSatoshis + estimatedFee) {
        throw new Error("Insufficient balance to cover amount + fees");
    }

    psbt.addOutput({
        address: address,
        value: targetSendSatoshis,
    });

  
    const changeAmount = totalInputSatoshis - targetSendSatoshis - estimatedFee;
    if (changeAmount > 546) { 
        psbt.addOutput({
            address: fromAddr,
            value: changeAmount,
        });
    }

  
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();
    const rawTx = psbt.extractTransaction().toHex();


    const { data: txid } = await axios.post(`https://blockstream.info/api/tx`, rawTx);
    return txid;
};

  const handleSend = async () => {
    if (!address || !amount) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }
    
    setLoading(true);
    setStatus({ type: 'info', message: `Broadcasting to ${coin} Mainnet...` });
    
    try {
      let txHash = "";
      if (coin === 'ETH') txHash = await sendETH();
      else if (coin === 'SOL') txHash = await sendSOL();
      else if (coin === 'BTC') txHash = await sendBTC();
      
      setStatus({ type: 'success', message: `Transaction Sent! ID: ${txHash.slice(0, 20)}...` });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-10"
    >
      <div className="relative overflow-hidden bg-[#0d0d0d] text-white rounded-[2rem] border border-white/10 shadow-2xl p-8">
      
        <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${getNetworkColor()} blur-[80px] opacity-30`} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Transfer</h2>
            <p className="text-xs text-gray-500 font-medium">MAINNET ENVIRONMENT</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Network Selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">Select Network</label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
              {['ETH', 'SOL', 'BTC'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCoin(c)}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${
                    coin === c ? `bg-gradient-to-r ${getNetworkColor()} shadow-lg` : 'hover:bg-white/5'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

      
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">Recipient Address</label>
            <input 
              placeholder={`Paste ${coin} address...`}
              className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 focus:border-white/20 outline-none transition-all font-mono text-sm"
              onChange={(e) => setAddress(e.target.value)} 
            />
          </div>

        
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1 text-between flex justify-between">
              <span>Amount</span>
              <span className="text-gray-600">{coin === 'BTC' ? 'Sats' : coin}</span>
            </label>
            <input 
              type="number" 
              placeholder="0.00"
              className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 focus:border-white/20 outline-none transition-all text-xl font-bold"
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>

          
        
            <div className="flex gap-2">
              
              <motion.button 
                initial={{ flex: 1 }}
                animate={{ flex: 2 }}
                onClick={handleSend}
                disabled={loading}
                className="py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? 'Sending...' : 'Confirm Send'}
              </motion.button>
            </div>
          
          
          <AnimatePresence>
            {status.message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-start gap-3 p-4 rounded-2xl border ${
                  status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                  status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}
              >
                {status.type === 'error' ? <AlertCircle className="shrink-0 w-5 h-5" /> : <CheckCircle className="shrink-0 w-5 h-5" />}
                <p className="text-xs font-mono break-all leading-relaxed">{status.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default SendTransaction;
