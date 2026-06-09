"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

// Mock data for the chart, in real world this comes from props
const defaultData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 2000 },
  { name: 'Apr', revenue: 2780 },
  { name: 'May', revenue: 1890 },
  { name: 'Jun', revenue: 2390 },
  { name: 'Jul', revenue: 3490 },
];

interface RevenueChartProps {
  data?: { name: string; revenue: number }[];
}

export default function RevenueChart({ data = defaultData }: RevenueChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className="glass-card p-6 w-full h-full flex flex-col"
    >
      <div className="mb-6">
        <h3 className="heading-sm">Tren Pendapatan</h3>
        <p className="text-surface-sub text-sm mt-1">Akumulasi pendapatan 7 hari terakhir</p>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#111827" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `Rp${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              }}
              itemStyle={{ color: '#111827', fontWeight: 'bold' }}
              labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
              formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#111827"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
