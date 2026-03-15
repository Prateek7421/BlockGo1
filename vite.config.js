import axios from 'axios';

export const NAV_ITEMS = [
  { id: "dashboard", label: "Assets" },
  { id: "activity", label: "Activity" },
  { id: "ai", label: "AI" },
  { id: "settings", label: "Settings" },
];

export const INITIAL_ASSETS = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    chain: "Bitcoin",
    balance: 0, 
    clid: "90",
    day: "1",
    
    update: async function() {
      try {
        const raw = localStorage.getItem('wallet_data');
        const address = raw ? JSON.parse(raw)?.bitcoin?.address : null;
        if (!address) return 0;

     
        const res = await axios.get(`https://blockchain.info/q/addressbalance/${address}?cors=true`);
        const val = parseFloat(res.data) / 1e8;
        
        this.balance = val; 
        return val;
      } catch (e) {
        console.error("BTC fetch error", e);
        return 0;
      }
    }
  },
 {
  name: "Ethereum",
  symbol: "ETH",
  chain: "Ethereum",
  balance: 0,
  clid: "80",
  day: "1",
  update: async function() {
    try {
      const raw = localStorage.getItem('wallet_data');
      const address = raw ? JSON.parse(raw)?.ethereum?.address : null;
      
      const apiKey = "1PXBDXRXXVUIBWYVZVZYRQZMT7ZXCDB8JV"; 

      if (!address) return 0;


      const res = await axios.get(`https://api.etherscan.io/v2/api`, {
        params: {
          chainid: 1,
          module: "account",
          action: "balance",
          address: address,
          tag: "latest",
          apikey: apiKey
        }
      });

      const weiString = res.data.result;

      if (!weiString || weiString === "0") {
        this.balance = 0;
        return 0;
      }

 
      const amount = Number(BigInt(weiString)) / 1e18;

      this.balance = amount;
      
      console.log("ETH Balance from Etherscan:", amount);
      return amount;
      
    } catch (e) {
      console.error("Etherscan ETH logic failed:", e);
      return 0;
    }
  }
},
  {
    name: "Solana",
    symbol: "SOL",
    chain: "Solana",
    balance: 0,
    clid: "48543",
    day: "30",
    update: async function() {
      try {
        const raw = localStorage.getItem('wallet_data');
        const address = raw ? JSON.parse(raw)?.solana?.address : null;
        if (!address) return 0;

        const res = await axios.get(`https://api.tatum.io/v3/solana/account/balance/${address}`, {
          headers: { 'x-api-key': 't-69a1a8b671af32f725eebf7a-4127a68fd3bb468f88ac4159' }
        });
        const val = parseFloat(res.data.balance) || 0;
        this.balance = val;
        return val;
      } catch (e) { return 0; }
    }
  }
];

export async function getAIInsights() {
  return {
    sentiment: "Market is moderately bullish.",
    strategy: "Hold major assets and avoid overtrading.",
  };
}
