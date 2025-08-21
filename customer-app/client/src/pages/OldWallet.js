import { useEffect, useState } from "react";
import API from "../api";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    API.get("/profile").then((res) => setBalance(res.data.wallet));
  }, []);

  const addMoney = async () => {
    await API.post("/wallet/add", { amount: parseInt(amount) });
    setBalance(balance + parseInt(amount));
    setAmount("");
  };

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h2 className="text-3xl font-bold text-evgreen mb-6">Wallet</h2>
      <p>Balance: ₹{balance}</p>
      <input
        type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
        className="p-2 rounded bg-gray-800 mr-2"
      />
      <button onClick={addMoney} className="bg-evgreen text-black px-4 py-2 rounded">
        Add Money
      </button>
    </div>
  );
}
