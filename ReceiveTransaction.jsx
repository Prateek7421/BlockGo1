import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { useState, useEffect } from "react";

import axios from "axios";
export default function CreateWallet({ onDone, step, setparentpin }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const canContinue = hasVault
    ? pin.length >= 4
    : (email.includes("@") && pin.length >= 4 && email.includes('gmail.com'));
  const handlePinChange = (e) => {
    const value = e.target.value;
    setPin(value); 
    setparentpin(value); 
  };
  const handleClick = async () => {
     setLoading(true);
    await handleSubmit();
    setTimeout(() => {
      setLoading(false);
      onDone();
    }, 1000);
  };
  const handleClick2 = async () => {
    setLoading(true);
    const resp = await handleSubmit2(pin);
    console.log(resp);
    if (resp != false) {
      setTimeout(() => {
        setLoading(false);
        onDone();
      }, 6000);
    }
    else {
      setLoading(false);
      alert("Invalid Credentials");
    }
  };
  async function handleSubmit2(password) {
    async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw", 
    encoder.encode(password), 
    "PBKDF2", 
    false, 
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
    const data = JSON.parse(localStorage.getItem("encrypted_wallet"));
    if (!data) return console.error("No wallet found");
    console.log("DEBUG SALT:", JSON.stringify(data.salt));
    const salt = new Uint8Array(atob(data.salt.trim()).split("").map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(data.iv).split("").map(c => c.charCodeAt(0)));
    const encryptedContent = new Uint8Array(atob(data.ciphertext).split("").map(c => c.charCodeAt(0)));
 
    try {
      const key = await deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedContent
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (e) {
      return false;
    }
  }


  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "https://blockgo-backend.onrender.com/signup",
        {
          email: email,
          password: pin
        },
        {
          withCredentials: true, 
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Success:", response.data);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
    }
  };
  
  useEffect(() => {
    const vault = localStorage.getItem("encrypted_wallet");
    if (vault) {
      setHasVault(true);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.05 }}
      className="text-white"
    >
      {!hasVault ? (
        <>
          <h2 className="text-xl font-semibold mb-2">Create a Wallet</h2>

          <p className="text-sm text-gray-400 mb-6">
            Secure your wallet with an email and a PIN.
          </p>

        
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <div className="flex items-center bg-[#161616] rounded-lg px-3">
              <Mail size={16} className="text-gray-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent flex-1 px-2 py-2 outline-none text-sm"
              />
            </div>
          </div>
          <div className="mb-6">

          <label className="text-xs text-gray-400 mb-1 block">PIN</label>
          <div className="flex items-center bg-[#161616] rounded-lg px-3">
            <Lock size={16} className="text-gray-500" />
            <input
              type="password"
              value={pin}
              onChange={handlePinChange}
              className="bg-transparent flex-1 px-2 py-2 outline-none text-sm"
            />
          </div>
        </div>
        </>
      ) : (
        <div className="mb-6">

          <p className="text-xl font-heading text-gray-400 mb-6">
            Enter your PIN.
          </p>

          <label className="text-xs text-gray-400 mb-1 block">PIN</label>
          <div className="flex items-center bg-[#161616] rounded-lg px-3">
            <Lock size={16} className="text-gray-500" />
            <input
              type="password"
              value={pin}
              onChange={handlePinChange}
              className="bg-transparent flex-1 px-2 py-2 outline-none text-sm"
            />
          </div>
        </div>
      )}
      

      {step == "create" && (<button
        disabled={!canContinue || loading}
        onClick={handleClick}
        className={`w-full py-3 rounded-xl font-medium transition
          ${canContinue
            ? "bg-[#a996ff] text-black"
            : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
          }
        `}
      >
        {loading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent mr-2" />
            Creating...
          </>
        ) : (
          "Continue"
        )}
      </button>)
      }
      {step == "created" && (<button
        disabled={!canContinue || loading}
        onClick={handleClick2}
        className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center
      ${canContinue
            ? "bg-[#a996ff] text-black hover:bg-[#9683e6]"
            : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"}
    `}
      >
        {loading ? (
          <>
      
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent mr-2" />
            Processing...
          </>
        ) : (
          "Continue"
        )}
      </button>)}
      <p className="text-center text-xs text-gray-500 mt-4">
        By continuing, you agree to the Terms of Service
      </p>
    </motion.div>
  );
}
