import { useNavigate } from "react-router";

/**
 * Industrial Atelier — 404 Not Found Page
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 bg-[#f9f9f9]"
      aria-labelledby="not-found-title"
      style={{
        backgroundImage:
          "linear-gradient(rgba(228,190,180,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(228,190,180,0.15) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="text-center space-y-6 max-w-sm bg-white border border-[rgba(228,190,180,0.25)] p-10 shadow-[0_2px_12px_rgba(84,96,103,0.08)]">
        {/* Error code */}
        <div>
          <div className="text-[80px] font-extrabold leading-none tracking-tighter text-[#e8e8e8]">
            404
          </div>
          <div className="w-12 h-1 bg-[#ff5722] mx-auto mt-2" />
        </div>

        {/* Heading */}
        <div>
          <h1 id="not-found-title" className="text-lg font-extrabold text-[#1a1c1c] tracking-tight">
            Node Not Found
          </h1>
          <p className="text-xs text-[#546067] font-medium mt-2 leading-relaxed">
            The page you're looking for doesn't exist in this workstation's route map.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-[rgba(228,190,180,0.4)] text-[#1a1c1c] text-[10px] font-bold uppercase tracking-widest hover:bg-[#f3f3f3] transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-[#ff5722] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#e04a1e] active:scale-[0.98] transition-all"
          >
            Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
