import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Video,
  Send,
  Sparkles,
  ExternalLink,
  Bot,
  User,
  RotateCw,
  Play,
  Film,
  Globe,
  ShieldCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AIAssistantDesk: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'search_grounding' | 'video_generator'>('chat');

  // 1. Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: `Welcome to the AICTE Regulation Bureau Advisory Portal. I am your specialized regulatory intelligence assistant powered by Gemini. You can ask me regarding the Approval Process Handbook (APH 2024-27), Fixed Deposit Receipts (FDR) lock-in tenure, mandatory lien endorsements, or release procedures.`,
      timestamp: '10:00 AM',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const historyPayload = chatMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          model: 'gemini-3.8-flash',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text || 'No response returned by regulatory engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Regulatory Service Error: ${err.message || 'Unable to connect to AICTE Gemini service'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 2. Search Grounding State
  const [searchQuery, setSearchQuery] = useState('Current list of RBI Scheduled Commercial Banks for institutional fixed deposits');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ text: string; sources: { title: string; uri: string }[] } | null>(null);

  const handleExecuteSearchGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search grounding failed');
      setSearchResult(data);
    } catch (err: any) {
      alert(`Search Grounding Error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Video Generation State (gemini-omni-1.1-flash)
  const [videoPrompt, setVideoPrompt] = useState(
    'A high-tech digital animation showing an Indian government regulatory bank vault door unlocking, fixed deposit certificate turning into a verified gold shield with AICTE emblem, 4k cinematic lighting.'
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoStatusMsg, setVideoStatusMsg] = useState<string | null>(null);

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim() || isGeneratingVideo) return;

    setIsGeneratingVideo(true);
    setVideoStatusMsg('Calling gemini-omni-1.1-flash via Interactions API for video synthesis...');
    setGeneratedVideoUrl(null);

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video generation failed');
      setGeneratedVideoUrl(data.videoUrl);
      setVideoStatusMsg('Video generated successfully!');
    } catch (err: any) {
      console.error(err);
      setVideoStatusMsg(`Notice: Video generation requires paid key or quota: ${err.message}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span>AICTE Regulatory Intelligence Suite</span>
              <span>·</span>
              <span>Gemini Foundation Models</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              AI Advisory & Regulatory Research Hub
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Multi-turn regulatory consultation, live Google Search grounding for real-time banking
              regulations, and multimodal video generation via Gemini Omni Flash.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'chat'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>APH Chatbot</span>
            </button>
            <button
              onClick={() => setActiveSubTab('search_grounding')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'search_grounding'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Search Grounding</span>
            </button>
            <button
              onClick={() => setActiveSubTab('video_generator')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'video_generator'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Omni Video Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: MULTI-TURN CHATBOT */}
      {activeSubTab === 'chat' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  AICTE Regulation Bureau Advisory Assistant
                </h3>
                <span className="text-[11px] text-slate-500">
                  Model: gemini-3.8-flash · Approval Process Handbook 2024-27 Trained
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                setChatMessages([
                  {
                    id: 'init-reset',
                    role: 'model',
                    text: 'Conversation history reset. How may I assist you with AICTE security deposit regulations today?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded"
            >
              Clear Thread
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="font-semibold text-slate-500 shrink-0">Sample Queries:</span>
            <button
              onClick={() => {
                setChatInput('What is the minimum lock-in period for Engineering vs Management colleges?');
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 whitespace-nowrap"
            >
              Lock-in Period Norms
            </button>
            <button
              onClick={() => {
                setChatInput('What are the rules for releasing an FDR after 10 years completion?');
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 whitespace-nowrap"
            >
              10-Year Release Procedure
            </button>
            <button
              onClick={() => {
                setChatInput('Why is lien marking to Member Secretary AICTE mandatory?');
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 whitespace-nowrap"
            >
              Mandatory Lien Clause
            </button>
            <button
              onClick={() => {
                setChatInput('Explain the 20% concession for women and minority technical institutions.');
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 whitespace-nowrap"
            >
              Women/Minority Concessions
            </button>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed space-y-1 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div
                    className={`text-[10px] text-right font-mono ${
                      msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 max-w-xl">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Consulting Approval Process Handbook regulations...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              placeholder="Ask any question about AICTE security deposit regulations, lien rules, or APH clauses..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isChatLoading}
              className="px-4 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: GOOGLE SEARCH GROUNDING */}
      {activeSubTab === 'search_grounding' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Google Search Grounded Regulatory Verification</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Queries real-time web sources, RBI scheduled banks gazettes, and official educational notices using Gemini Search Grounding.
            </p>
          </div>

          <form onSubmit={handleExecuteSearchGrounding} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-slate-900 font-medium"
              placeholder="Enter regulatory query to ground against live Google Search..."
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 text-xs font-bold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isSearching ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search Grounding</span>
            </button>
          </form>

          {/* Search Result Output */}
          {searchResult && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-1">
                  Grounded Verification Summary
                </span>
                <div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {searchResult.text}
                </div>
              </div>

              {searchResult.sources.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-2">
                    Verified Google Search Web Sources ({searchResult.sources.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {searchResult.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-white border border-slate-200 hover:border-slate-400 rounded-lg flex items-center justify-between text-[11px] text-blue-700 font-medium transition-colors"
                      >
                        <span className="truncate pr-2">{s.title || s.uri}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: OMNI VIDEO GENERATION */}
      {activeSubTab === 'video_generator' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-600" />
              <span>Omni Flash Text-to-Video Studio (gemini-omni-1.1-flash)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate regulatory explainer and statutory video clips directly from text prompts via Gemini Interactions API.
            </p>
          </div>

          <form onSubmit={handleGenerateVideo} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Video Generation Text Prompt
              </label>
              <textarea
                rows={3}
                required
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="Describe the desired video clip..."
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-md font-semibold"
                >
                  <option value="16:9">16:9 Landscape (Desktop & Projection)</option>
                  <option value="9:16">9:16 Portrait (Mobile Stream)</option>
                </select>
              </div>

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={isGeneratingVideo}
                  className="px-5 py-2 text-xs font-bold bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isGeneratingVideo ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Video className="w-3.5 h-3.5" />
                  )}
                  <span>{isGeneratingVideo ? 'Synthesizing Video...' : 'Generate Video'}</span>
                </button>
              </div>
            </div>

            {videoStatusMsg && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs">
                {videoStatusMsg}
              </div>
            )}
          </form>

          {/* Generated Video Player */}
          {generatedVideoUrl && (
            <div className="p-4 bg-slate-900 rounded-xl space-y-2 text-center text-white">
              <span className="text-xs font-bold text-slate-300 block">
                Generated Video Preview (gemini-omni-1.1-flash)
              </span>
              <video
                controls
                src={generatedVideoUrl}
                className="max-h-[380px] mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
