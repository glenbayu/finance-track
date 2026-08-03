export default function Loading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 dark:bg-slate-950">
      {/* Background Blobs for Glassmorphism Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-indigo-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Pulsing Logo Container */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-xl shadow-blue-500/40">
          
          {/* Radar Ping Effect behind the logo */}
          <div className="absolute inset-0 rounded-3xl bg-blue-400 opacity-75 animate-ping duration-[3000ms]"></div>
          
          {/* Animated Icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="42" 
            height="42" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="relative z-10 animate-pulse duration-[2000ms]"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
        </div>
        
        {/* Loading Text */}
        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 animate-pulse">
            Menyelaraskan Data
          </h2>
          <p className="mt-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Mempersiapkan dompet dan transaksi...
          </p>
        </div>
      </div>
    </main>
  );
}
