import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Type definition for window.pako since we load it via CDN
declare global {
  interface Window {
    pako: any;
  }
}

// --- Helper Functions ---

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper to convert Uint8Array to Base64 safely
const uint8ToBase64 = (u8Arr: Uint8Array): string => {
  const CHUNK_SIZE = 0x8000;
  let index = 0;
  let length = u8Arr.length;
  let result = '';
  while (index < length) {
    const slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
    result += String.fromCharCode.apply(null, Array.from(slice));
    index += CHUNK_SIZE;
  }
  return btoa(result);
};

// Helper to convert Base64 to Uint8Array
const base64ToUint8 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// --- Icons ---
const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

// --- Components ---

const JsonNode = ({ 
  name, 
  value, 
  isLast, 
  level = 0 
}: { 
  name?: string; 
  value: any; 
  isLast: boolean; 
  level?: number 
}) => {
  const [expanded, setExpanded] = useState(true);
  
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;
  
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const indent = level * 1.5; // rem indent

  if (isObject) {
    const keys = Object.keys(value);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';
    const size = keys.length;

    return (
      <div className="font-mono text-sm leading-6">
        <div 
          className="flex items-center hover:bg-slate-800 cursor-pointer select-none whitespace-nowrap"
          style={{ paddingLeft: `${indent}rem` }}
          onClick={toggle}
        >
          {/* Caret */}
          <span className={`mr-1 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''} ${isEmpty ? 'opacity-0' : ''}`}>
            ▶
          </span>
          
          {/* Key Name */}
          {name && <span className="text-purple-400 mr-1">"{name}":</span>}
          
          {/* Opening Bracket */}
          <span className="text-slate-300">{openBracket}</span>
          
          {/* Collapsed Preview */}
          {!expanded && !isEmpty && (
            <span className="text-slate-500 text-xs italic ml-2">
              {isArray ? `Array(${size})` : `Object{${size}}`} ...
            </span>
          )}

          {/* Empty State */}
          {isEmpty && <span className="text-slate-300">{closeBracket}{!isLast && ','}</span>}
        </div>

        {/* Children */}
        {expanded && !isEmpty && (
          <div>
            {keys.map((key, idx) => (
              <JsonNode
                key={key}
                name={isArray ? undefined : key}
                value={value[key as any]}
                isLast={idx === keys.length - 1}
                level={level + 1}
              />
            ))}
            <div 
              className="hover:bg-slate-800"
              style={{ paddingLeft: `${indent + 1.2}rem` }}
            >
              <span className="text-slate-300">{closeBracket}</span>
              {!isLast && <span className="text-slate-300">,</span>}
            </div>
          </div>
        )}
        
        {/* Closing Bracket for collapsed state (if not empty) */}
        {!expanded && !isEmpty && (
          <span className="text-slate-300 ml-1">{closeBracket}{!isLast && ','}</span>
        )}
      </div>
    );
  }

  // Primitives
  let renderValue = null;
  let colorClass = "text-slate-200";

  if (typeof value === 'string') {
    renderValue = `"${value}"`;
    colorClass = "text-emerald-400";
  } else if (typeof value === 'number') {
    renderValue = value;
    colorClass = "text-blue-400";
  } else if (typeof value === 'boolean') {
    renderValue = value.toString();
    colorClass = "text-amber-400";
  } else if (value === null) {
    renderValue = "null";
    colorClass = "text-red-400";
  }

  return (
    <div 
      className="font-mono text-sm leading-6 hover:bg-slate-800 flex whitespace-nowrap"
      style={{ paddingLeft: `${indent + 1.2}rem` }}
    >
      {name && <span className="text-purple-400 mr-1">"{name}":</span>}
      <span className={colorClass}>{renderValue}</span>
      {!isLast && <span className="text-slate-400">,</span>}
    </div>
  );
};

const App = () => {
  const [jsonText, setJsonText] = useState('{\n  "welcome": "JSON Editor",\n  "features": [\n    "Tree View",\n    "Validation",\n    "Gzip Compression"\n  ],\n  "active": true,\n  "count": 42,\n  "metadata": null\n}');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [gzipResult, setGzipResult] = useState('');
  const [gzipInput, setGzipInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [gzipError, setGzipError] = useState<string | null>(null);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchMatches, setSearchMatches] = useState<{start: number, end: number}[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Validation Effect
  useEffect(() => {
    if (!jsonText.trim()) {
      setParsedJson(null);
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      setParsedJson(parsed);
      setError(null);
    } catch (e: any) {
      setParsedJson(null);
      setError(e.message);
    }
  }, [jsonText]);

  // Search Logic Effect
  useEffect(() => {
    if (!searchText || !isSearchOpen) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }
    
    const matches: {start: number, end: number}[] = [];
    const lowerText = jsonText.toLowerCase();
    const lowerQuery = searchText.toLowerCase();
    let startIndex = 0;
    let index;
    
    // Simple loop to find all occurrences
    while ((index = lowerText.indexOf(lowerQuery, startIndex)) > -1) {
      matches.push({ start: index, end: index + lowerQuery.length });
      startIndex = index + 1;
    }
    
    setSearchMatches(matches);
    // Reset match index to 0 when search text changes
    setCurrentMatchIndex(0);
  }, [searchText, jsonText, isSearchOpen]);

  // Highlight/Scroll to match
  const scrollToMatch = (index: number) => {
    if (searchMatches.length > 0 && index >= 0 && index < searchMatches.length) {
       const match = searchMatches[index];
       if (textareaRef.current) {
         textareaRef.current.focus();
         textareaRef.current.setSelectionRange(match.start, match.end);
         
         // Attempt to ensure it is in view. 
         // blur/focus is a simple hack to force browser scroll to cursor
         textareaRef.current.blur();
         textareaRef.current.focus();
       }
    }
  };

  // Handle navigation
  const handleSearchNav = (direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;
    
    let newIndex = direction === 'next' ? currentMatchIndex + 1 : currentMatchIndex - 1;
    
    if (newIndex >= searchMatches.length) newIndex = 0;
    if (newIndex < 0) newIndex = searchMatches.length - 1;
    
    setCurrentMatchIndex(newIndex);
    scrollToMatch(newIndex);
  };

  // Also scroll when match index is reset or updated automatically if matches exist
  useEffect(() => {
    if (searchMatches.length > 0 && isSearchOpen) {
        // We only auto-scroll if the user is actively searching (interacting with search box or next buttons)
        // If they are typing in search box, we might want to scroll to the first match.
    }
  }, [currentMatchIndex, searchMatches]);


  // Actions
  const handleFormat = () => {
    if (parsedJson) {
      setJsonText(JSON.stringify(parsedJson, null, 2));
    }
  };

  const handleMinify = () => {
    if (parsedJson) {
      setJsonText(JSON.stringify(parsedJson));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  // Gzip Actions
  const handleEncodeGzip = () => {
    setGzipError(null);
    try {
      if (!window.pako) throw new Error("Pako library not loaded");
      const textEncoder = new TextEncoder();
      const data = textEncoder.encode(jsonText);
      const compressed = window.pako.gzip(data);
      const base64 = uint8ToBase64(compressed);
      setGzipResult(base64);
    } catch (e: any) {
      setGzipError("Compression failed: " + e.message);
    }
  };

  const handleDecodeGzip = () => {
    setGzipError(null);
    try {
      if (!gzipInput.trim()) return;
      if (!window.pako) throw new Error("Pako library not loaded");
      
      const compressed = base64ToUint8(gzipInput);
      const decompressed = window.pako.ungzip(compressed);
      const textDecoder = new TextDecoder();
      const resultString = textDecoder.decode(decompressed);
      
      // Validate if it's JSON, but allow putting it in editor regardless
      try {
        const formatted = JSON.stringify(JSON.parse(resultString), null, 2);
        setJsonText(formatted);
      } catch {
        setJsonText(resultString);
      }
    } catch (e: any) {
      setGzipError("Decompression failed: " + e.message);
    }
  };

  // Stats
  const originalSize = useMemo(() => new Blob([jsonText]).size, [jsonText]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs font-bold">JE</div>
          <h1 className="font-semibold text-lg">JSON Editor</h1>
        </div>
        <div className="text-xs text-slate-500">
          Using React + Tailwind + Pako
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Pane: Editor */}
        <div className="flex-1 flex flex-col border-r border-slate-800 min-w-0">
          <div className="flex-1 relative group">
            
            {/* Search Toolbar */}
            {isSearchOpen ? (
              <div className="absolute top-4 right-6 z-20 bg-slate-800 p-1.5 rounded shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={searchText} 
                  onChange={(e) => setSearchText(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchNav('next');
                    }
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                      textareaRef.current?.focus();
                    }
                  }}
                  placeholder="Find..." 
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-32 text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  autoFocus
                />
                <span className="text-xs text-slate-500 min-w-[3rem] text-center font-mono">
                  {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0/0'}
                </span>
                <div className="flex gap-0.5">
                  <button onClick={() => handleSearchNav('prev')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Previous Match">
                    <ChevronUpIcon />
                  </button>
                  <button onClick={() => handleSearchNav('next')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Next Match">
                    <ChevronDownIcon />
                  </button>
                </div>
                <button onClick={() => setIsSearchOpen(false)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white ml-1" title="Close Search">
                  <XIcon />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="absolute top-4 right-6 z-10 p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity border border-transparent hover:border-slate-700"
                title="Find (Ctrl+F)"
              >
                <SearchIcon />
              </button>
            )}

            <textarea
              ref={textareaRef}
              className="w-full h-full bg-slate-950 p-4 font-mono text-sm resize-none focus:outline-none text-slate-300 leading-6 selection:bg-blue-900 selection:text-white"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              placeholder="Paste JSON here..."
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const val = e.currentTarget.value;
                  e.currentTarget.value = val.substring(0, start) + '  ' + val.substring(end);
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                  setJsonText(e.currentTarget.value);
                }
                // Basic shortcut to open search if needed, though browser default might interfere
                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                  e.preventDefault();
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }}
            />
          </div>
          
          {/* Status Bar */}
          <div className={`h-10 border-t border-slate-800 px-4 flex items-center text-xs font-mono shrink-0 ${error ? 'bg-red-950/30' : 'bg-slate-900'}`}>
            {error ? (
              <div className="flex items-center text-red-400 w-full">
                <span className="mr-2">⛔</span>
                <span className="truncate">{error}</span>
              </div>
            ) : (
              <div className="flex items-center text-emerald-400">
                <span className="mr-2">✓</span>
                <span>Valid JSON</span>
                <span className="mx-3 text-slate-600">|</span>
                <span className="text-slate-500">Size: {formatBytes(originalSize)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Tools & Tree */}
        <div className="flex-1 flex flex-col lg:w-1/2 min-w-0 bg-slate-925">
          
          {/* Toolbar */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex gap-2 flex-wrap shrink-0">
            <button 
              onClick={handleFormat} 
              disabled={!!error}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              Format
            </button>
            <button 
              onClick={handleMinify} 
              disabled={!!error}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              Minify
            </button>
            <button 
              onClick={handleCopy}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
            >
              {copyFeedback ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-auto p-4">
            
            {/* Tree View Section */}
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Tree View</h2>
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-2 overflow-x-auto min-h-[200px]">
                {error || !jsonText ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10 text-sm">
                    <span>{error ? 'Fix validation errors to see tree' : 'Enter JSON to view tree'}</span>
                  </div>
                ) : parsedJson ? (
                  <JsonNode value={parsedJson} isLast={true} />
                ) : null}
              </div>
            </div>

            {/* Gzip Tools Section */}
            <div className="border-t border-slate-800 pt-6">
               <h2 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 flex justify-between items-center">
                 <span>Gzip Compression (Base64)</span>
                 {gzipResult && (
                   <span className="text-emerald-400 normal-case font-normal">
                     {formatBytes(base64ToUint8(gzipResult).length)} (gzip) vs {formatBytes(originalSize)} (raw)
                   </span>
                 )}
               </h2>
               
               {/* Encoder */}
               <div className="bg-slate-900 rounded p-3 border border-slate-800 mb-4">
                 <div className="flex justify-between mb-2">
                    <span className="text-xs text-slate-400">Current Editor Content</span>
                    <button 
                      onClick={handleEncodeGzip}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded"
                    >
                      Encode to Gzip
                    </button>
                 </div>
                 <textarea 
                    readOnly 
                    value={gzipResult}
                    placeholder="Encoded result will appear here..."
                    className="w-full h-20 bg-slate-950 text-slate-400 text-xs p-2 rounded font-mono border border-slate-800 focus:border-emerald-500 focus:outline-none"
                    onClick={(e) => e.currentTarget.select()}
                 />
               </div>

               {/* Decoder */}
               <div className="bg-slate-900 rounded p-3 border border-slate-800">
                 <div className="flex justify-between mb-2">
                    <span className="text-xs text-slate-400">Decode Base64 Gzip</span>
                    <button 
                      onClick={handleDecodeGzip}
                      className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded"
                    >
                      Decode to Editor
                    </button>
                 </div>
                 <textarea 
                    value={gzipInput}
                    onChange={(e) => setGzipInput(e.target.value)}
                    placeholder="Paste Base64 Gzip string here..."
                    className="w-full h-20 bg-slate-950 text-slate-300 text-xs p-2 rounded font-mono border border-slate-800 focus:border-amber-500 focus:outline-none"
                 />
                 {gzipError && (
                   <div className="mt-2 text-xs text-red-400 bg-red-950/20 p-1 rounded">
                     {gzipError}
                   </div>
                 )}
               </div>
            </div>

            {/* About Developer Section */}
            <div className="border-t border-slate-800 pt-6 mt-6 pb-2">
               <h2 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">About Developer</h2>
               <a 
                 href="https://www.juanmiguel.dev/"
                 target="_blank"
                 rel="noopener noreferrer" 
                 className="block bg-slate-900 border border-slate-800 rounded p-3 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
               >
                 <div className="flex items-center justify-between mb-1">
                   <span className="font-medium text-blue-400 group-hover:text-blue-300">Juan Miguel</span>
                   <span className="text-xs text-slate-500 group-hover:text-slate-400 flex items-center gap-1">
                     Visit Website 
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                     </svg>
                   </span>
                 </div>
                 <div className="text-xs text-slate-500 font-mono truncate">
                   https://www.juanmiguel.dev/
                 </div>
               </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);