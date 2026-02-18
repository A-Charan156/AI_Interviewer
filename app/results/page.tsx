'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Star, Code, MessageSquare, Brain, Users } from 'lucide-react';
import { Suspense } from 'react';

// New interface matching Backend JSON
interface AnalysisData {
    technical_score: number;
    communication_score: number;
    problem_solving_score: number;
    cultural_fit_score: number;
    technical_feedback: string;
    communication_feedback: string;
    problem_solving_feedback: string;
    cultural_fit_feedback: string;
    overall_summary: string;
    key_strengths?: string[]; // Backwards compatibility or future use
    areas_for_improvement?: string[];
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-black text-white flex items-center justify-center"><Loader2 className="animate-spin mr-2" />Generating Detailed Report...</div>}>
            <ResultsContent />
        </Suspense>
    );
}

function ResultsContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalysisData | null>(null);

    useEffect(() => {
        if (!sessionId) { setLoading(false); return; }

        const fetchData = async () => {
            try {
                const { supabase } = await import('@/lib/supabase');
                const { data: sessionData } = await supabase
                    .from('interview_history')
                    .select('*')
                    .eq('session_id', sessionId)
                    .single();

                if (sessionData && sessionData.json_analysis) {
                    const j = sessionData.json_analysis;
                    setData({
                        technical_score: j.technical_score || 0,
                        communication_score: j.communication_score || 0,
                        problem_solving_score: j.problem_solving_score || 0,
                        cultural_fit_score: j.cultural_fit_score || 0,
                        technical_feedback: j.technical_feedback || "No feedback generated.",
                        communication_feedback: j.communication_feedback || "No feedback generated.",
                        problem_solving_feedback: j.problem_solving_feedback || "No feedback generated.",
                        cultural_fit_feedback: j.cultural_fit_feedback || "No feedback generated.",
                        overall_summary: j.overall_summary || "No summary."
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Analyzing Interview Performance...</span>
            </div>
        )
    }

    if (!data) return (
        <div className="h-screen bg-black text-white p-8 flex flex-col items-center justify-center gap-4">
            <p>Analysis not found or pending.</p>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
    );

    const overallScore = Math.round(
        (data.technical_score + data.communication_score + data.problem_solving_score + data.cultural_fit_score) / 4
    );

    return (
        <div className="min-h-screen w-full bg-black text-white p-6 md:p-12 overflow-y-auto font-sans">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <Button variant="ghost" className="text-neutral-400 pl-0 hover:text-white" onClick={() => router.push('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <h1 className="text-4xl font-bold mt-2">Feedback on the Interview</h1>
                        <p className="text-neutral-500 mt-1">Session ID: {sessionId}</p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center gap-6">
                        <div>
                            <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Overall Impression</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-blue-400">{overallScore}</span>
                                <span className="text-neutral-500">/100</span>
                            </div>
                        </div>
                        <div className="h-12 w-px bg-neutral-800" />
                        <div className="text-sm text-neutral-400 max-w-xs">
                            {data.overall_summary}
                        </div>
                    </div>
                </div>

                {/* Score Breakdown Grid */}
                <div>
                    <h2 className="text-2xl font-semibold mb-6">Breakdown of the Interview</h2>
                    <div className="grid grid-cols-1 gap-6">

                        <BreakdownCard
                            title="Communication Skills"
                            score={data.communication_score}
                            icon={MessageSquare}
                            color="text-purple-400"
                            feedback={data.communication_feedback}
                        />
                        <BreakdownCard
                            title="Technical Knowledge"
                            score={data.technical_score}
                            icon={Code}
                            color="text-blue-400"
                            feedback={data.technical_feedback}
                        />
                        <BreakdownCard
                            title="Problem Solving"
                            score={data.problem_solving_score}
                            icon={Brain}
                            color="text-amber-400"
                            feedback={data.problem_solving_feedback}
                        />
                        <BreakdownCard
                            title="Cultural Fit"
                            score={data.cultural_fit_score}
                            icon={Users}
                            color="text-green-400"
                            feedback={data.cultural_fit_feedback}
                        />

                    </div>
                </div>

            </div>
        </div>
    );
}

function BreakdownCard({ title, score, icon: Icon, color, feedback }: any) {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-neutral-800 ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${color}`}>{score}</span>
                    <span className="text-neutral-600 text-sm">/100</span>
                </div>
            </div>
            <p className="text-neutral-400 leading-relaxed pl-14">
                {feedback}
            </p>
        </div>
    )
}
