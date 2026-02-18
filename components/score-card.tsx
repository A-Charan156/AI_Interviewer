'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function ScoreCard({ title, score, color }: { title: string; score: number; color: string }) {
    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    return (
        <Card className="bg-neutral-900 border-neutral-800 flex flex-col items-center justify-center p-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">{title}</CardTitle>
            </CardHeader>
            <div className="w-[180px] h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive={false}
                        >
                            <Cell key="score" fill={color} />
                            <Cell key="remaining" fill="#262626" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-white">{score}</span>
                </div>
            </div>
        </Card>
    )
}
