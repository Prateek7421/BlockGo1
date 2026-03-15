import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, X, CheckCircle2, ShieldCheck } from 'lucide-react';

const ReceiveTransaction = ({ isOpen, onClose }) => {
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [copied, setCopied] = useState(false);

  const getStoredAddress = (coin) => {
    const savedData = JSON.parse(localStorage.getItem('wallet_data') || '{}');
    if (coin === 'BTC') return savedData.bitcoin?.address;
    if (coin === 'ETH') return savedData.ethereum?.address;
    if (coin === 'SOL') return savedData.solana?.address;
    return null;
  };

  const [address, setAddress] = useState(() => getStoredAddress('BTC'));

  useEffect(() => {
    if (isOpen) {
      setAddress(getStoredAddress(selectedCoin));
    }
  }, [isOpen, selectedCoin]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const coinConfig = {
    BTC: { name: 'Bitcoin', color: '#F7931A', bg: 'shadow-orange-500/20' },
    ETH: { name: 'Ethereum', color: '#627EEA', bg: 'shadow-blue-500/20' },
    SOL: { name: 'Solana', color: '#14F195', bg: 'shadow-emerald-500/20' },
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#0F0F0F] border border-white/10 rounded-[40px] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
        <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-transform hover:rotate-90"><X size={20} /></button>

        <div className="p-8">
          <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Receive</h2>
          <div className="flex items-center gap-1 mb-8">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Network Verified</span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5">
            {['BTC', 'ETH', 'SOL'].map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSelectedCoin(symbol)}
                className={`py-2.5 text-xs font-black rounded-xl transition-all ${
                  selectedCoin === symbol ? 'bg-white text-black shadow-xl' : 'text-slate-500'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center mb-8 relative">
            <div className={`absolute inset-0 blur-3xl opacity-20 ${coinConfig[selectedCoin].bg}`} />
            <div className="relative bg-white p-5 rounded-[32px] shadow-2xl transform transition-transform hover:scale-105">
              {address ? (
                <QRCodeSVG value={address} size={160} fgColor="#000" level="H" />
              ) : (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-black font-black text-xs text-center px-2 uppercase">No Address Found</div>
              )}
            </div>
          </div>

          <div onClick={handleCopy} className="cursor-pointer group bg-white/[0.03] border border-white/10 p-5 rounded-3xl transition-all active:scale-95 hover:bg-white/[0.06]">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Your {selectedCoin} Address</p>
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[11px] text-slate-200 break-all leading-relaxed">{address || 'Unavailable'}</p>
              <div className="bg-white text-black p-2 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveTransaction;