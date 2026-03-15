import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import axios from "axios";
import { useEffect, useState } from "react";
import { useBitcoinPrices } from "./pricesApi";
import { useParams, useNavigate } from "react-router-dom";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  TimeScale
);



const TIMEFRAMES = [
  { label: "1H", value: "0.04" },
  { label: "1D", value: "1" },
  { label: "1W", value: "7" },
  { label: "1M", value: "30" },
  { label: "1Y", value: "365" },
];
const PERCENT_CHANGE_MAP = {
  "0.04": "percent_change_1h",  
  "1": "percent_change_24h",    
  "7": "percent_change_7d",    
};

 


export default function CryptoChart({assets}) {
  const { coin, clid, name, symbol, day } = useParams();
  const currentAsset = assets.find(a => a.name === name);
  const userEthBalance = currentAsset ? currentAsset.balance : 0;

  const navigate = useNavigate();

  const [prices, setPrices] = useState([]);
  const priceData = useBitcoinPrices(clid);
    const percentKey = PERCENT_CHANGE_MAP[day];
const percentValue = percentKey ? priceData?.[percentKey] : null;
  

  useEffect(() => {
    async function fetchData() {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coin}/market_chart`,
        {
          params: {
            vs_currency: "usd",
            days: day,
          },
        }
      );
      setPrices(res.data.prices);
    }

    fetchData();
  }, [coin, day]);

    const coinData = {
  name: priceData ? priceData.name : "",
  symbol: priceData ? priceData.symbol : "",
  market_cap_usd: priceData ? priceData.market_cap_usd : 0,
  price_usd: priceData ? priceData.price_usd : 0,
  percent_change_24h:priceData ? priceData.percent_change_24h :0,
  percent_change_1h:priceData ? priceData.percent_change_1h :0,
  percent_change_7d:priceData ? priceData.percent_change_7d :0,
  rank: priceData ? priceData.rank : 0,
}
  

  const handleTimeframeChange = (newDay) => {
    navigate(`/crypto/${coin}/${clid}/${name}/${symbol}/${newDay}`);
  };


let percentChange = 0;

if (prices && prices.length > 0) {
  const startPrice = prices[0][1]; 
  const endPrice = prices[prices.length - 1][1]; 
  percentChange = ((endPrice - startPrice) / startPrice) * 100;
}
const data = {
  datasets: [
    {
      data: prices.map((p) => ({ x: p[0], y: p[1] })),
      fill: true,
      borderColor: percentChange >= 0 ? "#22c55e" : "#ef4444",
      backgroundColor: "rgba(0,0,0,0.12)",
      tension: 0.4,
      pointRadius: 0,
    },
  ],
};

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit:
            Number(day) <= 1
              ? "hour"
              : Number(day) <= 30
              ? "day"
              : "month",
          tooltipFormat: "MMM d, HH:mm",
        },
        ticks: { maxTicksLimit: 14 },
        grid: { display: false },
      },
      y: {
        ticks: {
          callback: (v) => `$${v.toFixed(2)}`,
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  return (
   

    <div className="flex flex-col items-center text-white space-y-6 overflow-x-hidden">

  
      <div className="flex items-center gap-4 mt-4">
        <img
          src={`https://files.coinswitch.co/public/coins/${symbol?.toLowerCase()}.png`}
          className="h-10 w-10"
          alt=""
        />
        <h1 className="text-4xl font-bold">{name}</h1>
      </div>

    
      <div className="text-[37px] font-bold font-sans">
        ${priceData ? priceData.price_usd : ""}
      </div>

      <div className="flex gap-5 items-center">
        <div
          className={`text-xl font-bold text-black rounded-xl px-3 font-sans
          ${
            percentChange >= 0
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          $
          {priceData
            ? (percentChange * priceData.price_usd).toFixed(2)
            : ""}
        </div>

        <div
          className={`text-black text-xl font-bold text-center font-sans px-3 min-w-[4rem] rounded-xl
          ${
          percentChange>= 0
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {priceData ?percentChange : ""}%
        </div>
      </div>




      <div className="flex gap-4 mt-2 bg-[#121212] p-2 rounded-xl">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.label}
            onClick={() => handleTimeframeChange(tf.value)}
            className={`px-4 py-1 rounded-lg text-sm font-semibold transition
              ${
                day === tf.value
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
          >
            {tf.label}
          </button>
        ))}
      </div>
     


    
      <div className="mt-4 w-[1170px] h-[450px]">
        <Line data={data} options={options} />
      </div>
     
<div className="bg-[#121212] text-2xl font-sans rounded-2xl p-5 w-[820px] mt-6">

  <h3 className="text-2xl font-heading mb-4">Your Position</h3>

  <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Balance</span>
    <span className="font-semibold">
      {userEthBalance} ETH
    </span>
  </div>

  <div className="flex justify-between py-2">
    <span className="text-gray-400">Value</span>
    <span className="font-semibold">
      ${(userEthBalance * priceData.price_usd).toFixed(2)}
    </span>
  </div>

</div>

  
<div className="bg-[#121212] rounded-2xl text-2xl font-sans p-5 w-[820px]">

  <div className="flex">
  <h3 className="text-2xl font-heading mb-4">Info</h3>
  <img
          src={`https://files.coinswitch.co/public/coins/${symbol?.toLowerCase()}.png`}
          className="h-8 w-8 relative left-2"
          alt=""
        />
  </div>

  
  <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Name</span>
      
    <span className="font-light">{name}</span>
  </div>

  {/* ROW */}
  <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Symbol</span>
    <span className="font-light">{symbol}</span>
  </div>
  
  <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Market Cap</span>
    <span className="font-light">
      ${(coinData?.market_cap_usd)}</span>
  </div>
     <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Current Price</span>
    <span className="font-light">
      ${Number(coinData?.price_usd).toLocaleString()}</span>
  </div>
    <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Percent Change(1h)</span>
    <span className={`font-light ${ coinData?.percent_change_1h >= 0 ? 'text-green-500' : 'text-red-500' }`}>
      {Number(coinData?.percent_change_1h).toLocaleString()}%</span>
  </div>
    <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Percent Change(24h)</span>
    <span className={`font-light ${coinData?.percent_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
      {Number(coinData?.percent_change_24h).toLocaleString()}%</span>
  </div>
    <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Percent Change(7d)</span>
    <span className={`font-light ${coinData?.percent_change_7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
      {Number(coinData?.percent_change_7d).toLocaleString()}%</span>
  </div>
     <div className="flex justify-between py-2 border-b border-white/5">
    <span className="text-gray-400">Rank</span>
    <span className="font-light">
      {Number(coinData?.rank).toLocaleString()}</span>
  </div>
</div>

    </div>
  );
}
