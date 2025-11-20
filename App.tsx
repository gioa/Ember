
import React, { useState, useEffect, useRef } from 'react';
import { Candle } from './components/Candle';
import { Timer } from './components/Timer';
import { AshParticles } from './components/AshParticles';
import { generateComfortingMessage } from './services/geminiService';
import { initTelemetry, getTracer } from './services/telemetryService';
import { AppState } from './types';
import { soundManager } from './utils/sound';
import { Flame, RefreshCw, Volume2, VolumeX } from 'lucide-react';

const SESSION_DURATION = 12 * 60; 
const BURN_ANIMATION_DURATION_MS = 3000; // 3 seconds for faster burn
const IGNITION_DELAY_MS = 1500; // Time for candle to slide up before burn starts

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WRITING);
  const [noteContent, setNoteContent] = useState('');
  const [comfortMessage, setComfortMessage] = useState('');
  const [isMuted, setIsMuted] = useState(true); // Default to muted
  
  // New state to control the sequence: Candle Up -> Ignition -> Burning
  const [burnSequenceStarted, setBurnSequenceStarted] = useState(false); // Triggers Candle slide up
  const [isBurning, setIsBurning] = useState(false); // Triggers Mask/Fire animation

  // Initialize audio on first interaction
  const hasInitializedAudio = useRef(false);

  useEffect(() => {
    // Initialize OpenTelemetry
    initTelemetry();
    getTracer().startSpan('app_loaded').end();
  }, []);

  const initAudio = () => {
    if (!hasInitializedAudio.current) {
      soundManager.init();
      hasInitializedAudio.current = true;
    }
  };

  const toggleMute = () => {
    initAudio();
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    soundManager.toggle(!newMuteState); // if not muted, play
  };

  useEffect(() => {
    // Sync sound manager if state changes externally (rare, but good practice)
    if (hasInitializedAudio.current) {
      soundManager.toggle(!isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    if (appState === AppState.BURNING) {
      // 1. Start Sequence: Candle slides up
      setBurnSequenceStarted(true);
      generateComfortingMessage().then(setComfortMessage);

      // 2. Ignition Delay: Wait for candle to reach paper, then start burn
      const ignitionTimer = setTimeout(() => {
          setIsBurning(true);
          soundManager.setBurning(true);
      }, IGNITION_DELAY_MS);

      // 3. Completion: End after burn duration
      const completionTimer = setTimeout(() => {
        setAppState(AppState.COMPLETED);
        setNoteContent('');
        setBurnSequenceStarted(false);
        setIsBurning(false);
        
        // Log completion
        getTracer().startSpan('burn_sequence_completed').end();
      }, BURN_ANIMATION_DURATION_MS + IGNITION_DELAY_MS);
      
      return () => {
          clearTimeout(ignitionTimer);
          clearTimeout(completionTimer);
          // Ensure burn sound stops if we leave the state early or complete
          soundManager.setBurning(false);
      };
    }
  }, [appState]);

  const handleBurn = () => {
    if (noteContent.trim().length === 0) return;
    
    // Log burn action
    const span = getTracer().startSpan('user_initiated_burn');
    span.setAttribute('note_length', noteContent.length);
    span.end();

    initAudio(); // Ensure audio context is ready
    setAppState(AppState.BURNING);
  };

  const handleReset = () => {
    getTracer().startSpan('user_reset_session').end();
    setNoteContent('');
    setComfortMessage('');
    setAppState(AppState.WRITING);
    setBurnSequenceStarted(false);
    setIsBurning(false);
    soundManager.setBurning(false); // Double check sound is off
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-[#0f172a] text-slate-200 selection:bg-orange-500/30 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-[#0f172a] to-black pointer-events-none"></div>

      {/* HEADER */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center p-6 opacity-70 hover:opacity-100 transition-opacity">
          <h1 className="font-journal font-bold text-3xl tracking-wide text-orange-100/60">Ember</h1>
          <div className="flex items-center gap-4">
              <button 
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                title={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
          </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="z-10 w-full max-w-3xl px-6 flex flex-col items-center transition-all duration-1000 ease-in-out h-screen justify-center">
        
        {(appState === AppState.WRITING || appState === AppState.BURNING) && (
          <div className="w-full flex flex-col items-center relative animate-slideUp">
            
            {/* Toolbar */}
            <div className={`w-full flex justify-between items-center mb-4 px-2 transition-all duration-500 ${appState === AppState.BURNING ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100'}`}>
                <Timer 
                    durationSeconds={SESSION_DURATION} 
                    isActive={appState === AppState.WRITING} 
                    onComplete={() => {}}
                />
                <button
                    onClick={handleBurn}
                    disabled={noteContent.length === 0}
                    className={`
                        flex items-center gap-2 px-5 py-2 rounded-full text-lg font-journal transition-all duration-500
                        ${noteContent.length > 0 
                            ? 'bg-orange-700/80 text-orange-50 shadow-[0_0_20px_rgba(194,65,12,0.3)] hover:bg-orange-600 hover:shadow-[0_0_25px_rgba(234,88,12,0.5)]' 
                            : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}
                    `}
                >
                    <span>Burn Note</span>
                    <Flame size={16} className={noteContent.length > 0 ? 'animate-pulse' : ''} />
                </button>
            </div>

            {/* Paper & Candle Container */}
            <div className="relative w-full h-[65vh] flex justify-center perspective-1000 group">
                
                {/* Wrapper for Paper and Overlays - Keeps them aligned */}
                <div className="relative w-full max-w-2xl h-full z-20">
                    
                    {/* 
                       THE PAPER
                       Stays stationary inside wrapper. 
                       Mask applied only when 'isBurning' is true.
                    */}
                    <div 
                      className={`
                        absolute inset-0 bg-white text-slate-800 rounded-sm shadow-2xl overflow-hidden flex flex-col
                        transition-all duration-1000 origin-bottom
                        ${isBurning ? 'burning-paper-mask animate-burn-mask' : ''}
                      `}
                    >
                        {/* Paper Texture */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-multiply"
                             style={{ filter: 'url(#paper-noise)' }}></div>
                        
                        {/* Lined Paper Pattern */}
                        <div className="absolute inset-0 pointer-events-none opacity-10"
                            style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '100% 2rem', marginTop: '2rem' }}>
                        </div>

                        {/* Red Margin Line */}
                        <div className="absolute top-0 bottom-0 left-10 md:left-14 w-px bg-red-300/30 pointer-events-none"></div>
                        
                        {/* Input Area */}
                        {appState === AppState.WRITING ? (
                           <textarea
                               className="w-full h-full bg-transparent resize-none outline-none border-none font-journal text-lg md:text-xl leading-[2rem] note-scroll placeholder:text-slate-300 z-10 p-6 pl-14 md:pl-20 pt-8"
                               placeholder="Write whatever weighs on your mind..."
                               value={noteContent}
                               onChange={(e) => setNoteContent(e.target.value)}
                               onFocus={initAudio}
                               spellCheck={false}
                               autoFocus
                           />
                        ) : (
                           /* Static view during burning */
                           <div className="w-full h-full p-6 pl-14 md:pl-20 pt-8 font-journal text-lg md:text-xl leading-[2rem] overflow-hidden whitespace-pre-wrap break-words">
                               {noteContent}
                           </div>
                        )}
                    </div>

                    {/* 
                        FIRE LINE & ASHES 
                        Moves from bottom to top.
                        This container matches the position of the "mask edge".
                    */}
                    {isBurning && (
                        <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
                            <div className="absolute left-0 right-0 h-32 fire-line-anim translate-y-1/2">
                                 
                                {/* 1. The Char Line (Burnt edge) */}
                                <div className="absolute bottom-[50%] w-full h-6 bg-black char-distortion blur-[1px] opacity-80"></div>

                                {/* 2. The Flame Glow (Main fire body) */}
                                <div className="absolute bottom-[20%] w-full h-24 bg-gradient-to-t from-orange-600 via-orange-500 to-yellow-300 fire-distortion mix-blend-screen opacity-90"></div>
                                
                                {/* 3. Secondary Glow (Wide ambient light) */}
                                <div className="absolute bottom-0 w-full h-40 bg-orange-600/40 blur-3xl rounded-[50%]"></div>
                                
                                {/* 4. Particles Emitter (Attached to this moving line) */}
                                <AshParticles />
                            </div>
                        </div>
                    )}

                </div>

                {/* 
                    THE CANDLE 
                    Starts hidden below.
                    Slides up to touch the bottom of the paper (translate-y of -50% of its own height roughly places it correctly if positioned at bottom 0).
                    Adjust translate-y to perfectly kiss the bottom of the paper container.
                */}
                <div className={`
                    absolute bottom-0 left-1/2 -translate-x-1/2 z-40
                    transition-all duration-[1500ms] cubic-bezier(0.25, 1, 0.5, 1)
                    ${burnSequenceStarted ? '-translate-y-[0rem] opacity-100' : 'translate-y-40 opacity-0'}
                `}>
                    <Candle className="scale-125 drop-shadow-2xl" />
                </div>

            </div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {appState === AppState.COMPLETED && (
           <div className="text-center space-y-10 animate-fadeIn slow-fade w-full max-w-lg z-40">
               <div className="relative">
                   <Candle isLit={true} className="mx-auto mb-8 opacity-90 scale-110" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
               </div>

               <div className="space-y-6">
                   <p className="text-xl md:text-2xl font-journal text-orange-100 leading-relaxed drop-shadow-md px-8">
                       "{comfortMessage || "The smoke has cleared. Your burden is lighter."}"
                   </p>
                   <div className="h-px w-32 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent mx-auto"></div>
               </div>

               <button
                   onClick={handleReset}
                   className="mt-12 text-slate-400 hover:text-orange-200 transition-colors flex items-center gap-3 mx-auto text-sm uppercase tracking-widest group font-medium"
               >
                   <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500"/>
                   <span>New Session</span>
               </button>
           </div>
        )}

      </div>
      
      <style>{`
        .slow-fade { animation-duration: 2s; }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 1.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
