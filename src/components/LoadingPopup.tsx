export default function LoadingPopup({ message = "Loading...", title = "Please Wait" }: { message?: string, title?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center animate-scale-up border border-white">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-gray-200/60 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]"></div>
        </div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 font-medium text-center max-w-xs">{message}</p>
      </div>
    </div>
  );
}
