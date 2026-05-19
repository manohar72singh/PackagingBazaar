import React, { useState, useEffect } from "react";
import { 
  Users, 
  Store, 
  TrendingUp, 
  Clock, 
  LayoutDashboard,
  RefreshCcw,
  Package,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  fetchDashboardStats, 
  fetchAllProductsAdmin, 
  fetchAnalyticsStats 
} from "../../services/adminServices";
import { useNotification } from "../../context/NotificationContext";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#F97316', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    uniqueProducts: 0,
    totalOrders: 0,
    totalInquiries: 0,
  });
  const [analytics, setAnalytics] = useState({
    leadStatus: [],
    lostReasons: [],
    categories: [],
    monthlyVolume: [],
    topSellers: []
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifyError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, analyticsRes] = await Promise.all([
        fetchDashboardStats(),
        fetchAllProductsAdmin(1, 5),
        fetchAnalyticsStats()
      ]);
      
      if (statsRes.success) setStats(statsRes.stats);
      if (productsRes.success) setRecentProducts(productsRes.products);
      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
    } catch (err) {
      notifyError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Users",
      val: stats.totalUsers,
      icon: <Users size={20} />,
      color: "blue",
      path: "/admin/users",
    },
    {
      label: "Pending Sellers",
      val: stats.pendingSellers,
      icon: <Clock size={20} />,
      color: "orange",
      path: "/admin/pending-sellers",
    },
    {
      label: "Active Sellers",
      val: stats.totalSellers,
      icon: <Store size={20} />,
      color: "green",
      path: "/admin/sellers",
    },
    {
      label: "Total Products",
      val: stats.totalProducts,
      icon: <Package size={20} />,
      color: "red",
      path: "/admin/products",
    },
    {
      label: "Leads",
      val: stats.totalInquiries,
      icon: <TrendingUp size={20} />,
      color: "purple",
      path: "/admin/inquiries",
    },
  ];

  if (loading && recentProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 min-h-[400px]">
        <RefreshCcw className="animate-spin text-accent mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="font-syne font-black text-3xl text-gray-900 uppercase tracking-tight">
              Admin Control
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Manage marketplace operations, users, and business leads.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm cursor-pointer relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div
              className={`w-12 h-12 flex items-center justify-center mb-4 rounded-2xl ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                stat.color === 'green' ? 'bg-green-50 text-green-600' :
                stat.color === 'red' ? 'bg-red-50 text-red-600' :
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                'bg-purple-50 text-purple-600'
              }`}
            >
              {stat.icon}
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <h3 className="text-3xl font-syne font-black text-gray-900">
              {stat.val}
            </h3>
            {stat.subLabel && (
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                {stat.subLabel}: <span className="text-accent">{stat.subVal}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Lead Performance Pie Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
           <h3 className="font-syne font-black text-lg uppercase tracking-tight mb-6">Lead Performance</h3>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={analytics.leadStatus}
                   innerRadius={60}
                   outerRadius={100}
                   paddingAngle={5}
                   dataKey="value"
                   nameKey="name"
                 >
                   {analytics.leadStatus.map((entry, index) => (
                     <Cell key={`lead-status-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                 />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Monthly Volume Area Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm min-h-[400px]">
           <h3 className="font-syne font-black text-lg uppercase tracking-tight mb-6">Inquiry Trends (6M)</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="99%" height="100%">
               <AreaChart data={analytics.monthlyVolume}>
                 <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                 <Tooltip />
                 <Area type="monotone" dataKey="count" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Analytics Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Lost Reasons Bar Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm min-h-[400px]">
           <h3 className="font-syne font-black text-lg uppercase tracking-tight mb-6">Top Barriers (Lost Reasons)</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="99%" height="100%">
               <BarChart data={analytics.lostReasons} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, textTransform: 'uppercase'}} width={100} />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="value" fill="#EF4444" radius={[0, 10, 10, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Category Demand Bar Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm min-h-[400px]">
           <h3 className="font-syne font-black text-lg uppercase tracking-tight mb-6">Demand by Category</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="99%" height="100%">
               <BarChart data={analytics.categories}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, textTransform: 'uppercase'}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="value" fill="#8B5CF6" radius={[10, 10, 0, 0]} barSize={30} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Recent Products & Live Activity Grid */}
      <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products (Left - 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center">
                   <Package size={16} />
                </div>
                <h2 className="font-syne font-black text-xl uppercase tracking-tight">Recently Added Products</h2>
             </div>
             <button 
                onClick={() => navigate("/admin/products")}
                className="flex items-center gap-2 text-xs font-black uppercase text-accent hover:gap-3 transition-all"
             >
                View All <ArrowRight size={14} />
             </button>
          </div>

          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-gray-50">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Info</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Seller</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Pricing</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {recentProducts.map((p, idx) => (
                      <tr key={`recent-prod-${p.id}-${idx}`} className="hover:bg-gray-50/30 transition-all">
                         <td className="px-8 py-5">
                            <div className="font-bold text-gray-900">{p.name || "Untitled Product"}</div>
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">
                               {p.category_name} • {p.thickness ? `${p.thickness}mic` : "N/A"} • {p.color || "Standard"}
                            </div>
                         </td>
                         <td className="px-8 py-5 text-sm font-semibold text-gray-600 italic">
                            {p.seller_name}
                         </td>
                         <td className="px-8 py-5 text-right">
                            <div className="font-black text-accent">₹{p.price_min} – ₹{p.price_max}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">per {p.unit || "kg"}</div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Live Activity Hub (Right - 1 Col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center animate-pulse">
                   <Clock size={16} />
                </div>
                <h2 className="font-syne font-black text-xl uppercase tracking-tight">Platform Activities</h2>
             </div>
          </div>

          <div className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[380px] h-[calc(100%-3rem)]">
            <div className="space-y-4.5">
              {[
                { type: "inquiry", text: "New commercial inquiry matching triggered for Corrugated Box", time: "Just now", color: "orange" },
                { type: "seller", text: "Supplier 'Apex Polyfilms' profile details verified by routing suite", time: "12m ago", color: "green" },
                { type: "product", text: "New product 'Multilayer BOPP Roll' submitted for review", time: "34m ago", color: "blue" },
                { type: "lead", text: "Lead #PB-LID-108 forwarded to 3 compatible sellers on WhatsApp", time: "2h ago", color: "purple" },
                { type: "blog", text: "Yoast SEO rating checklist verified for new B2B packaging blog", time: "5h ago", color: "indigo" }
              ].map((activity, idx) => (
                <div key={idx} className="flex gap-3 items-start group">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    activity.color === 'orange' ? 'bg-orange-500 shadow-sm shadow-orange-300' :
                    activity.color === 'green' ? 'bg-green-500 shadow-sm shadow-green-300' :
                    activity.color === 'blue' ? 'bg-blue-500 shadow-sm shadow-blue-300' :
                    activity.color === 'purple' ? 'bg-purple-500 shadow-sm shadow-purple-300' :
                    'bg-indigo-500 shadow-sm shadow-indigo-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-accent transition-colors">
                      {activity.text}
                    </p>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mt-1">
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-50 pt-4 mt-6 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>Status: <span className="text-green-500">Live</span></span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                Live Syncing
              </span>
            </div>
          </div>
        </div>
      </div></section>
    </div>
  );
}
