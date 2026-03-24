export default function LoadingPopup({ message = "Initializing Systems...", title = "System Access" }: { message?: string, title?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020617]/80 backdrop-blur-2xl p-4 animate-fade-in font-[Orbitron]">
      <div className="bg-white/[0.03] border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.2)] rounded-[2.5rem] p-12 flex flex-col items-center justify-center animate-scale-up relative overflow-hidden group">
        {/* Scanning beam effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-[-100%] w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_2s_linear_infinite]" />
        </div>
        
        <div className="relative w-24 h-24 mb-8">
          {/* Glowing rings */}
          <div className="absolute inset-0 border-4 border-white/[0.05] rounded-full scale-110"></div>
          <div className="absolute inset-0 border-2 border-blue-500/50 border-t-transparent rounded-full animate-[spin_1.2s_linear_infinite]"></div>
          <div className="absolute inset-4 border-2 border-indigo-500/40 border-b-transparent rounded-full animate-[spin_0.8s_reverse_linear_infinite]"></div>
          
          {/* Core glow */}
          <div className="absolute inset-8 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        </div>

        <div className="space-y-4 text-center">
          <h3 className="text-2xl font-black text-white tracking-[0.2em] uppercase">{title}</h3>
          
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em] animate-pulse">
               {message}
            </p>
            {/* Progress bar simulation */}
            <div className="w-48 h-1 bg-white/[0.05] rounded-full overflow-hidden border border-white/10">
               <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 w-[60%] animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
