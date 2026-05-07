'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
    data: Array<{ name: string; value: number; fill?: string }>;
    height?: number;
}

export function ElectionBarChart({ data, height = 300 }: BarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                    dataKey="name"
                    stroke="#a1a1aa"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                />
                <YAxis
                    stroke="#a1a1aa"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#fafafa',
                    }}
                />
                <Legend />
                <Bar
                    dataKey="value"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
