import React, { useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";

const Agriculture = () => {
  const MainStore = useMainStore((state) => state);
  const navigate  = useNavigate();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

/* ─── Year‑slider setup ───────────────────────────────────── */
    const years = [
        "17-18",
        "18-19",
        "19-20",
        "20-21",
        "21-22",
        "22-23",
        "23-24",
    ];
    const [dragging, setDrag] = useState(false);
    
    const handleYearChange = (e) => {
        MainStore.setLulcYearIdx(Number(e.target.value));
    }
    const percent = (MainStore.lulcYearIdx / (years.length - 1)) * 100;    // 0 – 100 %
  

  /* ─── Existing helper (unchanged) ───────────────────── */
  const toggleFormsUrl = (toggle) => {
    if (MainStore.markerCoords) {
      MainStore.setIsForm(true);
      MainStore.setFormUrl(
        getOdkUrlForScreen(
          MainStore.currentScreen,
          MainStore.currentStep,
          MainStore.markerCoords,
          "",
          "",
          MainStore.blockName,
          MainStore.currentPlan.plan_id,
          MainStore.currentPlan.plan,
          "",
          toggle
        )
      );
      MainStore.setIsOpen(true);
    }
  };


  const getPlanLabel = () => {
    const plan = MainStore.currentPlan?.plan ?? "Select Plan";
  
    const words = plan.trim().split(/\s+/);
    if (words.length > 15) {
      return words.slice(0, 15).join(' ') + '…';
    }
    return plan;
  };


  return (
    <>
      {/* Title Bubble (UNCHANGED) */}
      <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
        <div className="relative w-full max-w-lg mx-auto flex items-center">
          <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
            Agriculture
          </div>
        </div>
      </div>

      {/* 2. Top-left buttons */}
      <div className="absolute top-20 left-0 w-full px-4 z-10 flex justify-start pointer-events-auto">
        <div className="flex gap-4 max-w-lg">
          <div className="flex flex-col gap-3">
              {/* GPS Button */}
              <button
              className="flex-shrink-0 w-10 h-10 rounded-md shadow-sm flex items-center justify-center"
              style={{
                  backgroundColor: '#D6D5C9',
                  color: '#592941',
                  border: 'none',
                  backdropFilter: 'none',
              }}
              onClick={() => {}}
              >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                  <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                  />
              </svg>
              </button>

              <button
                className="w-10 h-10 rounded-md shadow-sm flex items-center justify-center"
                style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                onClick={() => setIsInfoOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8h.01M11 12h1v4h1m0 4a9 9 0 100-18 9 9 0 000 18z"
                  />
                </svg>
              </button>
            </div>

          {/* Plan selector with dropdown */}
          <div className="relative">
          <button
              className="flex-1 px-2 py-2 rounded-md shadow-sm text-sm"
              style={{
                backgroundColor: '#D6D5C9',
                color: '#592941',
                border: 'none',
                backdropFilter: 'none',
              }}
            >
              {getPlanLabel()}
            </button>
          </div>
        </div>
      </div>

     {/* ─── Slider + popup (step 0 only) - MOVED BELOW TOP BUTTONS ─── */}
     {MainStore.currentStep === 0 && (
        <div className="absolute top-36 left-0 w-full px-4 z-10 pointer-events-auto">
            <div className="relative w-3/4 max-w-md mx-auto">
            <input
                type="range"
                min="0"
                max={years.length - 1}          // 0 … 6
                step="1"
                value={MainStore.lulcYearIdx}
                onChange={handleYearChange}
                onMouseDown={() => setDrag(true)}
                onMouseUp={() => setDrag(false)}
                onTouchStart={() => setDrag(true)}
                onTouchEnd={() => setDrag(false)}
                className="w-full accent-[#592941]"
            />

            {/* floating label */}
            {(dragging || true) && (
                <div
                className="absolute -top-8 px-2 py-1 rounded-md text-xs font-semibold text-white bg-black/60 pointer-events-none"
                style={{
                    left: `calc(${percent}% )`,
                    transform: "translateX(-50%)",
                    backdropFilter: "blur(2px)",
                }}
                >
                {years[MainStore.lulcYearIdx]}
                </div>
            )}

            {/* evenly spaced year labels */}
            {/* <div className="flex justify-between text-white text-xs mt-1 px-1">
                {years.map((y) => (
                <span key={y} className="flex-1 text-center">
                    {y}
                </span>
                ))}
            </div> */}
            </div>
        </div>
        )}

      {/* Bottom Controls (UNCHANGED) */}
      <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
        {MainStore.currentStep === 0 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => handleAnalyze()}
              disabled={!MainStore.isMarkerPlaced}
              style={{
                backgroundColor: !MainStore.isMarkerPlaced ? "#696969" : "#D6D5C9",
                color: !MainStore.isMarkerPlaced ? "#A8A8A8" : "#592941",
                border: "none",
              }}
            >
              Analyze
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => MainStore.setCurrentStep(1)}
              style={{ backgroundColor: "#D6D5C9", color: "#592941", border: "none" }}
            >
              Start Planning
            </button>
          </div>
        )}

        {MainStore.currentStep === 1 && (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
                onClick={() => toggleFormsUrl(false)}
                disabled={!MainStore.isMarkerPlaced}
                style={{
                  backgroundColor: !MainStore.isMarkerPlaced ? "#696969" : "#D6D5C9",
                  color: !MainStore.isMarkerPlaced ? "#A8A8A8" : "#592941",
                  border: "none",
                }}
              >
                Propose new Irrigation Work
              </button>

              <button
                className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
                onClick={() => toggleFormsUrl(true)}
                style={{ backgroundColor: "#D6D5C9", color: "#592941", border: "none" }}
              >
                Propose Maintenance
              </button>
            </div>

            <button
              className="w-1/2 self-center px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => navigate("/")}
              style={{ backgroundColor: "#D6D5C9", color: "#592941", border: "none" }}
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Agriculture;