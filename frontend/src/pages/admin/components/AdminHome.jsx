import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest, API_CONFIG } from "../../../services/httpClient";

const API_ORIGIN = API_CONFIG.ORIGIN;

export default function AdminHome({ stats }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const kpiCards = [
    {
      label: "Total Users", value: stats.totalUsers, unit: "registered",
      to: "/admin/users",
      icon: "👥",
      gradient: "from-blue-500 to-cyan-500", light: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      border: "border-blue-200 dark:border-blue-800", text: "text-blue-600 dark:text-blue-400", hoverRing: "hover:ring-blue-300 dark:hover:ring-blue-700",
    },
    {
      label: "Active Members", value: stats.activeMembers, unit: "currently active",
      to: "/admin/users",
      icon: "✅",
      gradient: "from-emerald-500 to-teal-500", light: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-600 dark:text-emerald-400", hoverRing: "hover:ring-emerald-300 dark:hover:ring-emerald-700",
    },
    {
      label: "Total Revenue", value: `${(stats.totalRevenue || 0).toLocaleString()}`, unit: "EGP earned",
      to: "/admin/subscriptions",
      icon: "💰",
      gradient: "from-violet-500 to-purple-600", light: "from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20",
      border: "border-violet-200 dark:border-violet-800", text: "text-violet-600 dark:text-violet-400", hoverRing: "hover:ring-violet-300 dark:hover:ring-violet-700",
    },
    {
      label: "Branches", value: stats.branches, unit: "locations",
      to: "/admin/branches",
      icon: "🏢",
      gradient: "from-orange-500 to-amber-500", light: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
      border: "border-orange-200 dark:border-orange-800", text: "text-orange-600 dark:text-orange-400", hoverRing: "hover:ring-orange-300 dark:hover:ring-orange-700",
    },
  ];

  return (
    <div className="space-y-7 animate-fadeIn">
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
        <div className="relative z-10 p-8 md:p-10 text-white">
          <p className="text-indigo-300 text-sm font-semibold uppercase">{greeting}</p>
          <h1 className="text-3xl font-black mt-1">Administrator Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">{dateStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <Link key={card.label} to={card.to} className={`bg-gradient-to-br ${card.light} rounded-2xl border-2 ${card.border} p-5 hover:shadow-xl transition-all`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className={`text-2xl font-black ${card.text}`}>{card.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{card.unit}</div>
            <div className={`text-xs font-bold ${card.text} mt-2`}>{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {stats.activities.map(a => (
            <div key={a.id} className="flex items-center gap-4">
              <span className="text-xl">{a.icon}</span>
              <div>
                <p className="text-sm font-medium">{a.user} {a.action} <span className="text-blue-600">{a.target}</span></p>
                <p className="text-xs text-gray-500">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
