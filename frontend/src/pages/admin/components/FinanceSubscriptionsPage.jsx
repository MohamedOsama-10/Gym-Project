import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../services/httpClient";
import { useNotifications } from "../../../context/NotificationContext";

export default function FinanceSubscriptionsPage() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [r, s] = await Promise.all([
          apiRequest("/admin/subscription-requests"),
          apiRequest("/admin/subscriptions"),
        ]);
        setRequests(r);
        setSubscriptions(s);
      } catch (e) { } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-br from-violet-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl">
          <h2 className="text-3xl font-black">Finance & Subscriptions</h2>
          <p className="opacity-80">Manage member payments and plans</p>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex gap-4">
             <button onClick={() => setActiveTab("requests")} className={`font-bold ${activeTab === 'requests' ? 'text-violet-600' : 'text-gray-400'}`}>Requests ({requests.length})</button>
             <button onClick={() => setActiveTab("subscriptions")} className={`font-bold ${activeTab === 'subscriptions' ? 'text-violet-600' : 'text-gray-400'}`}>Active ({subscriptions.length})</button>
          </div>
          <div className="p-6">
             {activeTab === 'requests' ? (
                <div className="space-y-4">
                   {requests.map(r => (
                      <div key={r.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl flex justify-between items-center">
                         <div>
                            <p className="font-bold">{r.user_name}</p>
                            <p className="text-sm text-gray-500">{r.plan_name} — {r.requested_price} EGP</p>
                         </div>
                         <button className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-sm">Approve</button>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="space-y-4">
                   {subscriptions.map(s => (
                      <div key={s.id} className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between">
                         <span className="font-medium">{s.user_name}</span>
                         <span className="font-bold text-violet-600">{s.price} EGP</span>
                      </div>
                   ))}
                </div>
             )}
          </div>
       </div>
    </div>
  );
}
