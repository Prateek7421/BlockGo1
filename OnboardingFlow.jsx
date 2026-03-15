import { useMemo, useState } from "react";
import { INITIAL_ASSETS } from "./data";
import { Routes, Route } from "react-router-dom";
import CryptoChart from "./CryptoChart";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Onboarding,
  Sidebar,
  Dashboard,
  Activity,
  AIView,
  Settings,
} from "./UI";
import { useBitcoinPrices } from "./pricesApi";
import OnboardingFlow from "./OnboardingFlow";
import { useEffect } from "react";
import axios from "axios";
export default function App() {
  const [view, setView] = useState("onboarding");
  const [onboardingStep, setOnboardingStep] = useState("start");
  const [addresses, setAddresses] = useState(null);
  const [assets,setAssets] = useState(INITIAL_ASSETS);
  const [transactions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
  
    if (location.pathname !== "/") {
      console.log("Deep link detected on refresh. Redirecting to home...");
      navigate("/", { replace: true });
    }
  }, []);
 useEffect(() => {
  const saved = localStorage.getItem("wallet_data");
  if (saved) {
    setAddresses(JSON.parse(saved));
  }
}, []);
const generateWallet = () => {
  const res = localStorage.getItem("wallet_data");
  if (res) {
    setAddresses(JSON.parse(res));
  }
};

  const prices = {};
  assets.forEach((a) => {
    prices[a.clid] = useBitcoinPrices(a.clid);
  });

  useEffect(() => {
  const fetchBalances = async () => {
    
    await Promise.all(assets.map(a => a.update()));
    setAssets([...assets]); 
  };
  
  fetchBalances();
}, []); 

const totalBalance = useMemo(() => {
  return assets.reduce((sum, a) => {
    return sum + (a.balance * (prices[a.clid]?.price_usd || 0));
  }, 0);
}, [assets, prices]);

  
  
  
  if (view === "onboarding") {
    return (
      <OnboardingFlow
        step={onboardingStep}
        setStep={setOnboardingStep}
        assets={assets}
        total={totalBalance}
        onFinish={() => {
          generateWallet();
          setView("dashboard");
          setOnboardingStep("start");
        }}
         onAddressesGenerated={setAddresses}
      />
    );
  }



  return (
    <div className="min-h-screen w-full flex bg-black text-white">
      <Sidebar view={view} setView={setView} />

      <main className="flex-1 p-6">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {view === "dashboard" && (
                  <Dashboard assets={assets} total={totalBalance} Address={addresses}/>
                )}
                {view === "activity" && <Activity txs={transactions} />}
                {view === "ai" && <AIView />}
                {view === "settings" && (
                  <Settings onLogout={() => setView("onboarding")} />
                )}
              </>
            }
          />

          <Route
            path="/crypto/:coin/:clid/:name/:symbol/:day"
            element={<CryptoChart assets={assets}/>}
          />
        </Routes>
      </main>
    </div>
  );
}
