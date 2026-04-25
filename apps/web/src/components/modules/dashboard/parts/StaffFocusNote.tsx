export default function StaffFocusNote() {
  return (
    <div className="bg-white border border-[rgba(228,190,180,0.2)] rounded-lg overflow-hidden">
      {/* Header well */}
      <div className="bg-[#e8e8e8] px-6 py-4 border-b border-[rgba(228,190,180,0.15)]">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1c1c]">
          Shift Focus
        </h3>
      </div>
      <div className="p-5 grid gap-3 sm:grid-cols-2">
        {/* Transaction accuracy */}
        <div className="flex items-start gap-3 p-3 border-l-4 border-[#ff5722] bg-[#f9f9f9] rounded-r-md">
          <span
            className="material-symbols-outlined text-[#ff5722] mt-0.5 shrink-0"
            style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
          >
            fact_check
          </span>
          <div>
            <p className="text-xs font-bold text-[#1a1c1c]">Transaction Accuracy</p>
            <p className="text-[10px] text-[#546067] font-medium mt-1 leading-relaxed">
              Verify payment method and item quantities before finalizing checkout.
            </p>
          </div>
        </div>
        {/* Stock awareness */}
        <div className="flex items-start gap-3 p-3 border-l-4 border-[#546067] bg-[#f9f9f9] rounded-r-md">
          <span
            className="material-symbols-outlined text-[#546067] mt-0.5 shrink-0"
            style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
          >
            inventory_2
          </span>
          <div>
            <p className="text-xs font-bold text-[#1a1c1c]">Stock Awareness</p>
            <p className="text-[10px] text-[#546067] font-medium mt-1 leading-relaxed">
              Prioritize low-stock alerts while recommending alternative products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
