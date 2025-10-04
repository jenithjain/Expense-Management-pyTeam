"use client"

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface StatisticsData {
  totalExpenses: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  categoryStats: Array<{ category: string; count: number; amount: number }>;
  monthlyStats: Array<{ month: string; amount: number }>;
  topSpenders?: Array<{ name: string; amount: number }>;
}

interface StatisticsChartsProps {
  data: StatisticsData;
  userRole: 'MANAGER' | 'ADMIN';
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const StatisticsCharts: React.FC<StatisticsChartsProps> = ({ data, userRole }) => {
  const statusData = [
    { name: 'Approved', value: data.approved, color: '#10b981' },
    { name: 'Pending', value: data.pending, color: '#f59e0b' },
    { name: 'Rejected', value: data.rejected, color: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Amount') ? `₹${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Count: {data.value} ({((data.value / data.payload.total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 p-6 bg-card rounded-lg border border-border">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {userRole === 'MANAGER' ? 'Team' : 'Company'} Expense Analytics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{data.totalExpenses}</div>
            <div className="text-sm text-muted-foreground">Total Expenses</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-500">{data.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-500">{data.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-500">{data.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>
        <div className="mt-4 bg-primary/10 rounded-lg p-4">
          <div className="text-3xl font-bold text-primary">₹{data.totalAmount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Amount</div>
        </div>
      </div>

      {/* Status Distribution Pie Chart */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Expense Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryStats}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="category" 
                className="text-muted-foreground text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-muted-foreground text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Spending Trend */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Spending Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthlyStats}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" className="text-muted-foreground text-xs" />
            <YAxis className="text-muted-foreground text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#06b6d4" 
              strokeWidth={3}
              name="Amount"
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Spenders (Manager Only) */}
      {userRole === 'MANAGER' && data.topSpenders && data.topSpenders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Team Spenders</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topSpenders} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" className="text-muted-foreground text-xs" />
              <YAxis 
                dataKey="name" 
                type="category" 
                className="text-muted-foreground text-xs"
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#10b981" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Amount Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Category Amount Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.categoryStats}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="category" 
              className="text-muted-foreground text-xs"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-muted-foreground text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#f59e0b" name="Amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};