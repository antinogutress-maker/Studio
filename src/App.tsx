import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseMCQs } from './services/geminiService';
import { MCQ, MCQResponse } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<MCQResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setInputText(text);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
    },
    multiple: false
  } as any);

  const handleConvert = async () => {
    if (!inputText.trim()) return;
    
    setIsParsing(true);
    setError(null);
    try {
      const data = await parseMCQs(inputText);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.mcqs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcqs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.mcqs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setInputText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
              <FileJson size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">MCQ Parser AI</h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Structured Data Converter</p>
            </div>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              <button 
                onClick={reset}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                title="Reset"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
        {!result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 max-w-2xl mx-auto mb-8">
              <h2 className="text-3xl font-bold text-zinc-900">Convert MCQs to JSON</h2>
              <p className="text-zinc-600">
                Upload your text file or paste the content below. Our AI will automatically identify questions, options, and answers even if they are unorganized.
              </p>
            </div>

            {/* Upload Area */}
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4",
                isDragActive ? "border-zinc-900 bg-zinc-100" : "border-zinc-200 bg-white hover:border-zinc-400"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-900">Click to upload or drag and drop</p>
                <p className="text-sm text-zinc-500">TXT or PDF files (Text extraction only)</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-zinc-50 px-3 text-sm font-medium text-zinc-500 uppercase tracking-widest">Or paste text</span>
              </div>
            </div>

            {/* Text Area */}
            <div className="space-y-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your unorganized MCQ text here..."
                className="w-full h-64 p-4 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all font-mono text-sm resize-none"
              />
              
              <button
                onClick={handleConvert}
                disabled={isParsing || !inputText.trim()}
                className={cn(
                  "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                  isParsing || !inputText.trim() 
                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" 
                    : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                )}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Parsing MCQs...
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    Convert to JSON
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                  Conversion Complete
                </h2>
                <p className="text-zinc-500">Found {result.mcqs.length} questions in your text.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 md:flex-none px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 md:flex-none px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                >
                  <Download size={16} />
                  Download .json
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Preview</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.mcqs.map((mcq, idx) => (
                    <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                          {idx + 1}
                        </span>
                        <p className="font-semibold text-zinc-900">{mcq.question}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 pl-9">
                        {mcq.options.map((opt, oIdx) => (
                          <div 
                            key={oIdx} 
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm border",
                              opt === mcq.correctAnswer 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium" 
                                : "bg-zinc-50 border-zinc-100 text-zinc-600"
                            )}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      {mcq.explanation && (
                        <div className="pl-9 pt-2">
                          <p className="text-xs text-zinc-500 italic">
                            <span className="font-bold uppercase not-italic mr-1">Explanation:</span>
                            {mcq.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON View */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Raw JSON</h3>
                <div className="bg-zinc-900 rounded-xl p-4 h-[600px] overflow-auto shadow-inner">
                  <pre className="text-xs text-zinc-300 font-mono leading-relaxed">
                    {JSON.stringify(result.mcqs, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 p-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-xs font-medium">
          <p>© 2024 MCQ Parser AI. Powered by Gemini.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}</style>
    </div>
  );
}
