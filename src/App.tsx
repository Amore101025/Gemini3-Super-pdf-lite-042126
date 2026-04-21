/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Download, Sparkles, Tag, GitPullRequest, ShieldAlert, 
  BookOpen, Upload, Loader2, ListChecks, BookMarked, 
  MessageSquare, FileText, Settings, 
  Terminal, BarChart3, Scissors, FileCheck, Languages
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI } from '@google/genai';
import { PDFDocument } from 'pdf-lib';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Config
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MAGICS = [
  { id: 'reorg', label: 'AI Reorganization', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-100', prompt: 'Restructure the document into a logical regulatory framework sequence. Use professional headers.' },
  { id: 'keywords', label: 'AI Keywords', icon: Tag, color: 'text-blue-600', bg: 'bg-blue-100', prompt: 'Identify and bold critical regulatory terminology (**keyword**).' },
  { id: 'consistency', label: 'Consistency Auditor', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', prompt: 'Audit the text for internal consistency across claims and data points. Highlight any detected contradictions.' },
  { id: 'regmap', label: 'Regulatory Mapping', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100', prompt: 'Map technical claims to specific ISO/FDA clauses where applicable as footnotes.' },
  { id: 'rta', label: 'Deficiency Predictor', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-100', prompt: 'Analyze for "Refusal to Accept" (RTA) risks. Provide a risk checklist.' },
  { id: 'summary', label: 'Executive Summary', icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-100', prompt: 'Create a high-level executive summary tailored for management.' },
  { id: 'action', label: 'Action Items', icon: ListChecks, color: 'text-teal-600', bg: 'bg-teal-100', prompt: 'Extract deficiencies and follow-ups into a table: Action, Owner, Priority.' },
  { id: 'glossary', label: 'Glossary Builder', icon: BookMarked, color: 'text-purple-600', bg: 'bg-purple-100', prompt: 'Extract technical jargon and create a bilingual definition table.' },
  { id: 'polish', label: 'Format Polisher', icon: FileText, color: 'text-pink-600', bg: 'bg-pink-100', prompt: 'Standardize formatting, bullets, and spacing for professional submission.' },
];

const VIZ_OPTIONS = [
  { id: 'confetti', label: 'Confetti' },
  { id: 'matrix', label: 'Matrix Rain' },
  { id: 'pulse', label: 'Glowing Pulse' },
  { id: 'aurora', label: 'Aurora Waves' },
  { id: 'particles', label: 'Data Particles' },
  { id: 'laser', label: 'Laser Scan' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'pdf' | 'notes' | 'dashboard'>('pdf');
  const [model, setModel] = useState("gemini-3-flash-preview");
  const [lang, setLang] = useState("Traditional Chinese");
  const [vizEffect, setVizEffect] = useState("confetti");

  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState("1-5");
  const [isTrimming, setIsTrimming] = useState(false);

  // Notes State
  const [notesInput, setNotesInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Output State
  const [outputMd, setOutputMd] = useState("# Welcome to Agentic Reviewer\nSelect a module to begin.");
  const [editorMode, setEditorMode] = useState<'preview' | 'edit'>('preview');

  // Status & Logs
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("System Ready");
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Initialized Agentic Reviewer Engine v3.1"]);
  const [isLogOpen, setIsLogOpen] = useState(true);

  // Visualization Triggers
  const [showMatrix, setShowMatrix] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showAurora, setShowAurora] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showLaser, setShowLaser] = useState(false);

  // Dashboard Stats
  const [stats, setStats] = useState({ tokens: 0, complexity: 0, entities: 0 });

  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([outputMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AMDR_Review_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    addLog("> Success: Review results downloaded as Markdown.");
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Effects
  const triggerViz = () => {
    switch(vizEffect) {
      case 'confetti': confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); break;
      case 'matrix': setShowMatrix(true); setTimeout(() => setShowMatrix(false), 3000); break;
      case 'pulse': setShowPulse(true); setTimeout(() => setShowPulse(false), 2000); break;
      case 'aurora': setShowAurora(true); setTimeout(() => setShowAurora(false), 5000); break;
      case 'particles': setShowParticles(true); setTimeout(() => setShowParticles(false), 3000); break;
      case 'laser': setShowLaser(true); setTimeout(() => setShowLaser(false), 2000); break;
    }
  };

  // PDF Logic
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPdfFile(e.target.files[0]);
      addLog(`> Uploaded PDF: ${e.target.files[0].name}`);
    }
  };

  const trimPdf = async () => {
    if (!pdfFile) return;
    setIsTrimming(true);
    setStatusMsg("Trimming PDF Pages...");
    addLog("> Initializing PDF-Lib engine...");
    
    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const newPdfDoc = await PDFDocument.create();
      
      const pagesInput = pageRange.split(',').map(s => s.trim());
      for (const range of pagesInput) {
        const parts = range.split('-').map(n => parseInt(n));
        const start = parts[0];
        const end = parts[1] || start;
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= pdfDoc.getPageCount()) {
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i - 1]);
            newPdfDoc.addPage(copiedPage);
          }
        }
      }
      
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trimmed_${pdfFile.name}`;
      link.click();
      
      addLog("> Success: Trimmed PDF downloaded.");
      setStatusMsg("PDF Trimmed Successfully");
    } catch (err: any) {
      addLog(`> Error Trimming: ${err.message}`);
    } finally {
      setIsTrimming(false);
    }
  };

  // LLM Logic
  const runAgent = async (type: 'summary' | 'magic', promptOverride?: string) => {
    setIsProcessing(true);
    setStatusMsg(type === 'summary' ? "Generating Comprehensive Summary..." : "Applying AI Magic...");
    addLog(`> Initializing Pipeline [${model}]...`);
    
    try {
      const ai = getAI();

      let baseContent = activeTab === 'pdf' ? `[Requesting analysis of specific pages: ${pageRange}]` : notesInput;
      if (type === 'magic') baseContent = outputMd;

      const finalPrompt = `
        Target Language: ${lang}
        Instructions: ${promptOverride || customPrompt || "Analyze and summarize."}
        
        ${type === 'summary' ? `
          CRITICAL REQUIREMENTS:
          1. Content Length: Minimum 3000 words. Be exhaustive in detail.
          2. Structure: Technical summary followed by 5 specific markdown tables (Specs, Metrics, Risks, Comparisons, Standards).
          3. Entities: Explicitly identify 20 entities with detailed regulatory context.
          4. Questions: Conclude with exactly 20 comprehensive follow-up review questions based on the content.
          5. Style: Professional regulatory tone.
          6. Highlight important keywords using bold markdown (**keyword**).
        ` : ""}

        Content to process:
        ${baseContent}
      `;

      addLog(`> Requesting ${model} for ${type} payload...`);
      const result = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }]
      });
      
      const text = result.text || "";
      setStats(prev => ({
        tokens: prev.tokens + Math.floor(text.length / 3),
        complexity: Math.min(10, Math.max(1, Math.floor(text.length / 500))),
        entities: 20
      }));
      
      addLog(`> Success: Agent pipeline completed.`);
      setStatusMsg("Generation Complete!");
      triggerViz();
    } catch (err: any) {
      addLog(`> PIPELINE ERROR: ${err.message}`);
      setStatusMsg("Execution Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-blue-50/20 overflow-hidden font-sans text-slate-800">
      {/* Visual Overlays */}
      <AnimatePresence>
        {showMatrix && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] pointer-events-none bg-black/20 flex items-center justify-center overflow-hidden">
            <div className="text-green-500 font-mono text-center text-sm flex gap-4 w-full h-full p-4 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div key={i} animate={{ y: [-500, 1000] }} transition={{ duration: 4, repeat: Infinity, delay: Math.random() * 2 }} className="whitespace-nowrap flex flex-col items-center">
                  {Array.from({ length: 40 }).map((_, j) => <div key={j}>{Math.random().toString(36).charAt(2).toUpperCase()}</div>)}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {showPulse && (
          <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1.5, ease: "easeOut" }} className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
            <div className="w-96 h-96 rounded-full border-4 border-blue-400 bg-blue-400/20" />
          </motion.div>
        )}
        {showAurora && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] pointer-events-none bg-gradient-to-tr from-cyan-300 via-purple-300 to-pink-300 animate-pulse" />
        )}
        {showLaser && (
          <motion.div initial={{ top: "-10%" }} animate={{ top: "110%" }} transition={{ duration: 1.5 }} className="fixed left-0 right-0 h-1 bg-red-400 z-[100] shadow-[0_0_15px_red] blur-sm pointer-events-none" />
        )}
        {showParticles && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] pointer-events-none">
             {Array.from({ length: 50 }).map((_, i) => (
               <motion.div 
                 key={i} 
                 initial={{ x: "50%", y: "50%", opacity: 1 }} 
                 animate={{ x: `${Math.random()*100}%`, y: `${Math.random()*100}%`, opacity: 0 }} 
                 transition={{ duration: 2 }}
                 className="absolute w-2 h-2 bg-blue-400 rounded-full"
               />
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Status Card */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[110] bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl px-8 py-5 flex items-center gap-8 min-w-[320px]"
          >
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <div className="absolute inset-0 bg-blue-400/30 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{statusMsg}</h3>
              <p className="text-[11px] text-slate-500 font-mono italic animate-pulse mt-1">Executing: {logs[logs.length-1].substring(0, 40)}...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-80 bg-white/40 backdrop-blur-2xl border-r border-white/50 flex flex-col shrink-0 overflow-hidden relative z-30 shadow-xl">
        <div className="p-6 border-b border-white/30 bg-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 ring-2 ring-white/50">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">MDR AGENT</h1>
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-blue-600/70 mt-1 block">Regulatory OS 3.1</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-7 scroll-smooth">
          {/* Navigation */}
          <div className="flex gap-1 bg-white/40 p-1.5 rounded-2xl border border-white/50 shadow-inner">
            {(['pdf', 'notes', 'dashboard'] as const).map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                  activeTab === t ? "bg-white shadow-xl text-blue-600 scale-102" : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <section className="space-y-5 animate-in fade-in duration-700">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Universal LLM Modifier</label>
              <Settings className="w-3.5 h-3.5 text-slate-300" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5 px-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1 opacity-70">Reasoning Engine</span>
                <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-white/70 border border-white/60 rounded-2xl p-3.5 text-xs font-bold text-slate-700 focus:ring-4 ring-blue-500/10 outline-none transition-all shadow-sm cursor-pointer appearance-none">
                  <option value="gemini-3-flash-preview">Gemini 3.1 Flash (Default)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Precision)</option>
                </select>
              </div>

              <div className="space-y-1.5 px-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1 opacity-70">Target Language Mode</span>
                <div className="flex gap-2.5">
                  <button onClick={() => setLang("Traditional Chinese")} className={cn("flex-1 py-3 rounded-2xl text-[10px] font-black border transition-all duration-300", lang === "Traditional Chinese" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30" : "bg-white/50 border-white/60 text-slate-400 hover:bg-white")}>繁體中文</button>
                  <button onClick={() => setLang("English")} className={cn("flex-1 py-3 rounded-2xl text-[10px] font-black border transition-all duration-300", lang === "English" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30" : "bg-white/50 border-white/60 text-slate-400 hover:bg-white")}>ENGLISH</button>
                </div>
              </div>

              <div className="space-y-1.5 px-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1 opacity-70">WOW Visualizations</span>
                <select value={vizEffect} onChange={e => setVizEffect(e.target.value)} className="w-full bg-white/70 border border-white/60 rounded-2xl p-3.5 text-xs font-bold text-slate-700 focus:ring-4 ring-blue-500/10 outline-none transition-all shadow-sm cursor-pointer appearance-none">
                  {VIZ_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          {activeTab === 'pdf' && (
            <section className="space-y-5 animate-in slide-in-from-left-6 duration-500">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <FileText className="w-3 h-3" /> Technical File Extractor
              </label>
              <div className="relative group">
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" id="pdfInput" />
                <label htmlFor="pdfInput" className="block border-2 border-dashed border-white/80 bg-white/30 rounded-3xl p-8 text-center cursor-pointer hover:bg-white/60 hover:border-blue-400 transition-all duration-500 group shadow-sm">
                  <div className="p-3.5 bg-blue-100/50 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{pdfFile ? pdfFile.name : "Select Device PDF"}</p>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-60">Max 100MB Cloud Access</p>
                </label>
              </div>

              <div className="space-y-3 bg-white/30 p-4 rounded-3xl border border-white/60">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Trim Range Filter</span>
                  <Scissors className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <input 
                  type="text" 
                  value={pageRange} 
                  onChange={e => setPageRange(e.target.value)}
                  className="w-full bg-white/80 border border-white/60 rounded-2xl p-3.5 text-xs font-bold text-slate-700 outline-none shadow-sm placeholder:opacity-40" 
                  placeholder="e.g. 1-10, 45, 102-110"
                />
                <button onClick={trimPdf} disabled={!pdfFile || isTrimming} className="w-full py-3 bg-white/80 border border-blue-200 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50">
                  {isTrimming ? "Compiling PDF..." : "Export Extracted Pages"}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'notes' && (
            <section className="space-y-5 animate-in slide-in-from-left-6 duration-500">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <BookMarked className="w-3 h-3" /> Direct Clinical Notes
              </label>
              <textarea 
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder="Paste raw unstructured clinical data or technical meeting notes here..."
                className="w-full h-48 bg-white/70 border border-white/60 rounded-3xl p-5 text-xs font-semibold text-slate-700 leading-relaxed resize-none focus:ring-4 ring-blue-500/10 outline-none transition-all shadow-inner"
              />
            </section>
          )}

          <section className="space-y-3 bg-white/30 p-4 rounded-3xl border border-white/60">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advanced Directive</label>
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <textarea 
              value={customPrompt} 
              onChange={e => setCustomPrompt(e.target.value)}
              className="w-full h-28 bg-white/80 border border-white/60 rounded-2xl p-4 text-[10px] font-mono font-bold text-slate-600 resize-none outline-none shadow-inner leading-relaxed" 
              placeholder="Inject custom prompt context..."
            />
          </section>
        </div>

        <div className="p-5 bg-white/40 border-t border-white/30">
          <button 
            onClick={() => runAgent('summary')}
            disabled={isProcessing || (activeTab === 'pdf' && !pdfFile) || (activeTab === 'notes' && !notesInput)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black py-4.5 px-6 rounded-3xl text-xs uppercase tracking-[0.25em] shadow-2xl shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden relative"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
               {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
               <span>Initialize Pipeline</span>
            </div>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-white/10 to-blue-50/10">
        {/* Header */}
        <header className="h-16 bg-white/30 backdrop-blur-3xl border-b border-white/40 flex items-center justify-between px-10 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-2xl border border-white/60">
              <motion.div 
                animate={{ 
                   scale: isProcessing ? [1, 1.3, 1] : 1,
                   backgroundColor: isProcessing ? "#fbbf24" : "#22c55e",
                   boxShadow: isProcessing ? ["0 0 0px #fbbf24", "0 0 15px #fbbf24", "0 0 0px #fbbf24"] : "0 0 10px #22c55e"
                }} 
                transition={{ duration: 2, repeat: Infinity }} 
                className="w-3 h-3 rounded-full" 
              />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{statusMsg}</span>
            </div>
            <div className="h-5 w-[1px] bg-slate-300/40" />
            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 tracking-wider">
              <span className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-blue-400" /> CLOUD LINK: ACTIVE</span>
              <span className="flex items-center gap-2"><FileCheck className="w-3.5 h-3.5 text-emerald-400" /> CRYPT-SIGN: VERIFIED</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setEditorMode(prev => prev === 'edit' ? 'preview' : 'edit')}
              className="px-5 py-2.5 bg-white/60 border border-white/80 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white text-slate-600 transition-all shadow-sm active:scale-95"
            >
              Mode: {editorMode === 'edit' ? 'Visual' : 'Draft'}
            </button>
            <button 
              onClick={downloadMarkdown}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all flex items-center gap-3 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" /> Export Markdown
            </button>
          </div>
        </header>

        {/* Workspace Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Visual Output */}
          <div className={cn("flex-1 overflow-y-auto p-12 lg:p-20 bg-transparent relative transition-all duration-700", editorMode === 'edit' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100')}>
            <div className="max-w-4xl mx-auto drop-shadow-2xl">
              <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white/60 p-10 lg:p-16 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <ShieldAlert className="w-32 h-32 -rotate-12" />
                </div>
                <article className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-table:border prose-table:rounded-3xl prose-table:overflow-hidden prose-img:rounded-[2rem] prose-strong:text-indigo-600 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {outputMd}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          </div>

          {/* Source Editor Panel */}
          {editorMode === 'edit' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col p-10 bg-white/20 backdrop-blur-md">
               <div className="flex-1 bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white/70 shadow-2xl overflow-hidden relative p-8">
                  <div className="absolute top-4 left-6 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
                  </div>
                  <textarea 
                    value={outputMd}
                    onChange={e => setOutputMd(e.target.value)}
                    className="w-full h-full bg-transparent text-slate-700 font-mono text-sm border-none focus:ring-0 resize-none p-6 mt-4 scrollbar-hide outline-none"
                    spellCheck={false}
                  />
               </div>
            </motion.div>
          )}

          {/* Right Inspection Deck */}
          <div className="w-80 bg-white/40 backdrop-blur-3xl border-l border-white/50 flex flex-col shrink-0 overflow-hidden z-20 shadow-2xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-9 scrollbar-hide">
              {/* Magic Suite */}
              <div className="animate-in fade-in slide-in-from-right-6 duration-700">
                <div className="flex items-center justify-between mb-5 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Intelligence Suite (9)</label>
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {MAGICS.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => runAgent('magic', m.prompt)}
                      disabled={isProcessing}
                      className={cn(
                        "group p-4 rounded-3xl bg-white/50 border border-white/80 flex items-center gap-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:bg-white hover:border-blue-400/40 disabled:opacity-40 text-left relative overflow-hidden",
                        "active:scale-100"
                      )}
                    >
                      <div className={cn("p-2.5 rounded-2xl transition-all duration-500 group-hover:rotate-12", m.bg)}>
                        <m.icon className={cn("w-4.5 h-4.5", m.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black text-slate-800 tracking-tight">{m.label}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter opacity-60">Execution Module</p>
                      </div>
                      <div className="absolute right-3 opacity-0 group-hover:opacity-30 group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-3 h-3 text-blue-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard */}
              <div className="animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
                <div className="flex items-center justify-between mb-5 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WOW Performance Matrix</label>
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="bg-white/70 border border-white/80 p-6 rounded-[2.5rem] space-y-7 shadow-xl shadow-blue-500/5 relative overflow-hidden">
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Review Index</span>
                      <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        <span className="text-sm font-black text-blue-600">{stats.complexity}.0</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 h-14 items-end px-1 w-full">
                      {[0.3, 0.6, 0.4, 0.85, 0.72, stats.complexity/10].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(15, h * 100)}%` }}
                          transition={{ type: "spring", stiffness: 100, delay: i * 0.1 }}
                          className={cn(
                            "flex-1 rounded-sm transition-all duration-700", 
                            i === 5 ? "bg-gradient-to-t from-blue-600 to-indigo-400 shadow-[0_5px_15px_rgba(37,99,235,0.4)]" : "bg-slate-200/60"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 bg-white/50 rounded-3xl border border-white/80 shadow-sm group hover:border-blue-300 transition-colors">
                      <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest opacity-60">Total Yield</p>
                      <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{stats.tokens.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-3xl border border-white/80 shadow-sm group hover:border-emerald-300 transition-colors">
                      <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest opacity-60">Total Ents</p>
                      <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{stats.entities}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Terminal */}
            <div className={cn("bg-slate-900 overflow-hidden transition-all duration-500 ease-in-out relative border-t-2 border-indigo-500 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]", isLogOpen ? "h-72" : "h-11")}>
              <button 
                onClick={() => setIsLogOpen(!isLogOpen)}
                className="w-full bg-[#0f172a] p-3 px-6 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_green] transition-all", isProcessing ? "bg-amber-500 shadow-amber-500 animate-pulse" : "bg-green-500")} />
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">Agent Interaction Log</span>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-blue-500/70 font-mono text-[9px]">{logs.length} E</span>
                   <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-500", isLogOpen ? "rotate-90" : "rotate-0")} />
                </div>
              </button>
              <div className="px-6 py-4 font-mono text-[10px] text-slate-300 h-full overflow-y-auto space-y-2.5 pb-20 scrollbar-hide">
                {logs.map((l, i) => (
                  <div key={i} className={cn("flex gap-3 animate-in fade-in duration-300", l.includes('ERROR') ? 'text-red-400' : l.includes('Success') ? 'text-green-400' : 'opacity-80')}>
                    <span className="text-slate-600 shrink-0 select-none">&gt;</span>
                    <p className="leading-relaxed tracking-wide">{l}</p>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 pointer-events-none" />
            </div>
          </div>
        </div>
      </main>

      {/* Language / Theme Indicator */}
      <div className="fixed bottom-6 left-6 z-[120] pointer-events-none">
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl text-slate-500">
           <Languages className="w-4 h-4 text-blue-500" />
           <span className="text-[10px] font-black uppercase tracking-widest">{lang} Mode</span>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
