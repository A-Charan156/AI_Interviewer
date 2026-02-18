'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Layout, ChevronRight, User, Smartphone, Clock } from 'lucide-react';

const INTERVIEW_TYPES = [
    {
        id: 'frontend',
        title: 'Front End Interview',
        icon: Layout,
        color: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        type: 'Technical'
    },
    {
        id: 'fullstack',
        title: 'Full Stack Interview',
        icon: Layers,
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        type: 'Mixed'
    },
    {
        id: 'mobile',
        title: 'Mobile Developer Interview',
        icon: Smartphone,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        type: 'Technical'
    },
    {
        id: 'resume',
        title: 'Resume Based',
        icon: User,
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        type: 'Personalized'
    }
];

export default function DashboardPage() {
    const router = useRouter();
    const [duration, setDuration] = useState(15);

    const startInterview = (typeId: string) => {
        // Encode type in session_id so Agent knows what to do (e.g. "frontend-uuid")
        const sessionId = `${typeId}-${crypto.randomUUID()}`;
        router.push(`/interview?session_id=${sessionId}&duration=${duration}`);
    };

    return (
        <div className="min-h-screen w-full bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-neutral-900 to-black p-8 rounded-3xl border border-neutral-800 relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-white mb-2">Get Interview-Ready with AI</h1>
                        <p className="text-neutral-400 max-w-xl">
                            Practice real interview questions and get instant feedback. Choose a specialized track or upload your resume for a personalized session.
                        </p>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
                </div>

                {/* Duration Selector */}
                <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 w-fit">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Duration:</span>
                    </div>
                    <div className="flex gap-2">
                        {[5, 10, 15, 30].map((mins) => (
                            <Button
                                key={mins}
                                variant={duration === mins ? "default" : "outline"}
                                onClick={() => setDuration(mins)}
                                className={`rounded-lg ${duration === mins ? 'bg-white text-black hover:bg-neutral-200' : 'bg-transparent text-neutral-400 border-neutral-700 hover:bg-neutral-800'}`}
                                size="sm"
                            >
                                {mins}m
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Section: Take Interviews */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Take Interviews</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {INTERVIEW_TYPES.map((item) => (
                            <Card key={item.id} className="bg-white border-neutral-200 hover:border-blue-400 transition-all hover:shadow-xl group">
                                <CardHeader className="relative">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-xl ${item.bg} w-fit`}>
                                            <item.icon className={`w-8 h-8 ${item.color}`} />
                                        </div>
                                        <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                                            {item.type}
                                        </Badge>
                                    </div>
                                    <CardTitle className="mt-4 text-xl text-black">{item.title}</CardTitle>
                                    <CardDescription className="text-neutral-600">
                                        {duration} min session • {item.type} Analysis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="text-sm text-neutral-600 flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                            Ready
                                        </div>
                                        <Button
                                            onClick={() => startInterview(item.id)}
                                            className="bg-black text-white hover:bg-neutral-800"
                                        >
                                            Start <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
