'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { Mic, MicOff, ChevronDown, Loader2, Play, CheckCircle2, ArrowLeft, User, ShieldCheck, Upload, FileText, Check, MessageSquare } from 'lucide-react';
import { Spotlight } from '@/components/ui/spotlight';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------
// 1. KEYS CONFIGURATION
// ---------------------------------------------------------
const VAPI_PUBLIC_KEY = 'c3e8993d-20fa-40c3-ba56-24d4d09c8f0d';
const VAPI_ASSISTANT_ID = 'b6dc7590-6734-43d7-9686-69c4df214dba';

const vapi = new Vapi(VAPI_PUBLIC_KEY);

// ---------------------------------------------------------
// 2. CANDIDATE PROFILES
// ---------------------------------------------------------
const CANDIDATES = [
    { id: '1', name: 'Alice', role: 'Frontend Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    { id: '2', name: 'Bob', role: 'Backend Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    { id: '3', name: 'Charlie', role: 'DevOps', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
    { id: '4', name: 'David', role: 'Mobile Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 'custom', name: 'Upload My Resume', role: 'Personalized Interview', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User' }
];

export default function InterviewPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-black text-white flex items-center justify-center"><Loader2 className="animate-spin mr-2" />Initializing Interviewer...</div>}>
            <InterviewContent />
        </Suspense>
    );
}

function InterviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [status, setStatus] = useState('Idle'); // Idle, Connecting, Live, Ended
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(CANDIDATES[0]);
    const [resumeText, setResumeText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Captions State
    const [activeTranscript, setActiveTranscript] = useState('');

    useEffect(() => {
        vapi.on('call-start', () => setStatus('Live'));
        vapi.on('call-end', () => {
            setStatus('Ended');
            setIsSpeaking(false);
            setActiveTranscript('');
        });
        vapi.on('speech-start', () => setIsSpeaking(true));
        vapi.on('speech-end', () => setIsSpeaking(false));

        // Live Transcription Logic
        vapi.on('message', (message) => {
            if (message.type === 'transcript' || message.type === 'message') {
                if (message.transcript) {
                    setActiveTranscript(message.transcript);
                }
            }
        });

        vapi.on('error', (e) => {
            console.error('Vapi Error:', e);
            setStatus('Idle');
        });

        return () => {
            vapi.stop();
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeTranscript]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file.');
            return;
        }

        setIsUploading(true);
        setUploadSuccess(false);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload-resume', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setResumeText(data.extracted_text);
            setUploadSuccess(true);
        } catch (error) {
            console.error('Resume upload error:', error);
            alert('Failed to process resume. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const toggleCall = () => {
        if (status === 'Live') {
            vapi.stop();
            setStatus('Ended');
        } else {
            setStatus('Connecting');

            const basePrompt = `You are 'Alex', an elite Technical Recruiter conducting an interview.
      GOAL: Assess the candidate's fit for their respective role through deep technical and behavioral questions.
      STYLE: Professional, slightly challenging but fair. Keep responses concise (under 2 sentences). Ask exactly ONE question at a time.
      Start by introducing yourself briefly and then jumping straight into the first question based on the candidate's background.`;

            const contextPrompt = selectedCandidate.id === 'custom' && resumeText
                ? `CONTEXT FROM UPLOADED RESUME: ${resumeText}`
                : `CONTEXT: The candidate is interviewing for the ${selectedCandidate.role} position. Their name is ${selectedCandidate.name}.`;

            const fullPrompt = `${basePrompt}\n\n${contextPrompt}`;

            const firstMessage = selectedCandidate.id === 'custom'
                ? `Hello! I've analyzed your resume. Let's start the interview. Can you tell me about your most significant project?`
                : `Hi ${selectedCandidate.name}, I'm Alex. I'll be conducting your ${selectedCandidate.role} interview today. Shall we get started?`;

            vapi.start(VAPI_ASSISTANT_ID, {
                variableValues: {
                    candidate_name: selectedCandidate.name
                },
                firstMessage: firstMessage,
                model: {
                    provider: "openai",
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: fullPrompt
                        }
                    ]
                },
                voice: {
                    provider: "11labs",
                    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel (very clear)
                },
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en-US",
                }
            });
        }
    };

    return (
        <div className="min-h-screen w-full bg-black/[0.96] text-white relative overflow-hidden font-sans selection:bg-blue-500/30">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

            {/* Navigation */}
            <div className="absolute top-8 left-8 z-50">
                <Button
                    variant="ghost"
                    className="text-neutral-400 hover:text-white hover:bg-white/5"
                    onClick={() => router.push('/dashboard')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </div>

            <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 z-10 relative">

                {/* Profile Card & Header */}
                <div className="w-full max-w-2xl mb-12 flex flex-col items-center text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                            AI Interview Session
                        </h1>
                        <p className="text-neutral-500 font-medium tracking-wide">
                            {status === 'Idle' && `Ready to evaluate ${selectedCandidate.name}`}
                            {status === 'Connecting' && `Preparing high-clarity voice engine...`}
                            {status === 'Live' && `Interview in Progress: ${selectedCandidate.role}`}
                            {status === 'Ended' && "Session Complete"}
                        </p>
                    </div>

                    {/* Candidate Profile Selector */}
                    <div className={`w-full transition-all duration-700 ${status !== 'Idle' ? 'opacity-40 scale-95 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-sm p-6 overflow-hidden relative">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 p-1 overflow-hidden">
                                        <img src={selectedCandidate.avatar} alt={selectedCandidate.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Interviewer</p>
                                        <h3 className="text-2xl font-bold text-white leading-none">{selectedCandidate.name}</h3>
                                        <p className="text-neutral-500 mt-1">{selectedCandidate.role}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <div className="relative w-full md:w-48">
                                        <select
                                            value={selectedCandidate.id}
                                            onChange={(e) => {
                                                const cand = CANDIDATES.find(c => c.id === e.target.value);
                                                if (cand) setSelectedCandidate(cand);
                                            }}
                                            className="w-full appearance-none bg-black/50 border border-neutral-800 text-white rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-neutral-800 transition-colors text-sm"
                                        >
                                            {CANDIDATES.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-500 pointer-events-none" />
                                    </div>

                                    {selectedCandidate.id === 'custom' && (
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={isUploading}
                                                className={`h-9 border-dashed ${uploadSuccess ? 'border-green-500/50 bg-green-500/5 text-green-400' : 'border-neutral-700 bg-neutral-800/50 text-neutral-400'} hover:border-blue-500/50`}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                ) : uploadSuccess ? (
                                                    <Check className="w-3.5 h-3.5 mr-2" />
                                                ) : (
                                                    <Upload className="w-3.5 h-3.5 mr-2" />
                                                )}
                                                {isUploading ? "Reading Resume..." : uploadSuccess ? "Resume Attached" : "Upload Resume (PDF)"}
                                            </Button>
                                            {uploadSuccess && <p className="text-[10px] text-green-500/70 font-bold uppercase text-center tracking-tighter">Memory Optimized</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Interaction Hub */}
                <div className="flex flex-col items-center gap-12 w-full max-w-2xl relative">

                    <div className="relative group">
                        {/* Ambient Background Glow */}
                        <div className={`absolute -inset-8 rounded-full blur-[40px] transition-all duration-1000 opacity-20
              ${status === 'Live' ? 'bg-blue-500 group-hover:opacity-40' : 'bg-neutral-700'}
              ${status === 'Connecting' ? 'bg-amber-500 animate-pulse' : ''}
              ${status === 'Ended' ? 'bg-green-500' : ''}
              ${(selectedCandidate.id === 'custom' && !resumeText) ? 'grayscale opacity-5' : ''}
            `} />

                        <button
                            onClick={toggleCall}
                            disabled={status === 'Connecting' || (selectedCandidate.id === 'custom' && !resumeText)}
                            className={`
                relative flex items-center justify-center w-48 h-48 rounded-full transition-all duration-700 border-2
                ${status === 'Idle' ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 hover:scale-[1.02] shadow-2xl' : ''}
                ${status === 'Live' ? 'bg-black border-blue-500/50 shadow-[0_0_80px_rgba(59,130,246,0.25)]' : ''}
                ${status === 'Connecting' ? 'bg-neutral-900 border-neutral-800 scale-95' : ''}
                ${status === 'Ended' ? 'bg-neutral-900 border-green-500/40' : ''}
                ${(selectedCandidate.id === 'custom' && !resumeText) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                        >
                            {/* Ripple Circles when AI Speaks */}
                            {status === 'Live' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`w-full h-full rounded-full border border-blue-500/30 transition-all duration-1000 ${isSpeaking ? 'animate-[ping_2s_infinite] scale-125' : 'scale-100'}`} />
                                    <div className={`absolute w-full h-full rounded-full border border-blue-500/20 transition-all duration-1000 delay-300 ${isSpeaking ? 'animate-[ping_2.5s_infinite] scale-150' : 'scale-100'}`} />
                                </div>
                            )}

                            <div className="z-10 flex flex-col items-center gap-2">
                                {status === 'Idle' && (
                                    <>
                                        <Play className="w-14 h-14 text-white fill-current translate-x-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                                            {selectedCandidate.id === 'custom' && !resumeText ? "Upload First" : "Begin Call"}
                                        </span>
                                    </>
                                )}
                                {status === 'Connecting' && <Loader2 className="w-14 h-14 text-blue-400 animate-spin" />}
                                {status === 'Live' && (
                                    <>
                                        <Mic className={`w-14 h-14 transition-colors duration-500 ${isSpeaking ? 'text-white' : 'text-blue-500'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">End Session</span>
                                    </>
                                )}
                                {status === 'Ended' && (
                                    <>
                                        <CheckCircle2 className="w-14 h-14 text-green-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-500">Finished</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* CAPTIONS AREA */}
                    {status === 'Live' && (
                        <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500 mt-4">
                            <Card className="bg-white border-neutral-200 backdrop-blur-xl p-5 min-h-[100px] flex items-center justify-center relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                                <div className="flex gap-4 items-start w-full">
                                    <div className={`p-2 rounded-lg ${isSpeaking ? 'bg-blue-500/20 text-blue-600' : 'bg-neutral-100 text-neutral-600'} transition-colors duration-300`}>
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-md font-medium leading-relaxed text-black transition-opacity duration-300 ${activeTranscript ? 'opacity-100' : 'opacity-40 italic'}`}>
                                            {activeTranscript || (isSpeaking ? "Capturing interviewer speech..." : "Waiting for candidate...")}
                                        </p>
                                    </div>
                                </div>

                                {/* Live Indicator */}
                                <div className="absolute bottom-2 right-4 flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-600">Live Captions</span>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Dynamic Status Display */}
                    <div className="h-16 flex flex-col items-center justify-center">
                        {status === 'Live' && (
                            <div className="space-y-2 flex flex-col items-center">
                                <p className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-500 ${isSpeaking ? 'text-blue-400' : 'text-neutral-500'}`}>
                                    {isSpeaking ? "Alex is speaking" : "Listening to you"}
                                </p>
                            </div>
                        )}
                        {status === 'Ended' && (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                                    <ShieldCheck className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-semibold text-green-400 tracking-wider uppercase">Data Analyzed</span>
                                </div>
                                <Button
                                    className="bg-white text-black hover:bg-neutral-200"
                                    onClick={() => router.push(`/results?session_id=${sessionId || 'test'}`)}
                                >
                                    View Detailed Feedback <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                </Button>
                            </div>
                        )}
                        {status === 'Idle' && (
                            <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
                                <span className="flex items-center gap-1.5"><Mic className="w-3 h-3" /> HQ Audio</span>
                                <div className="w-1 h-1 rounded-full bg-neutral-800" />
                                <span className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Live Transcripts</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Info */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.3em]">
                    Evaluation Protocol 9.5 • Deepgram Nova-2 Integration
                </p>
            </div>

            <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
        </div>
    );
}
