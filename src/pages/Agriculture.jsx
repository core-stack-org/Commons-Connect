import React, { useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Agriculture = () => {
  const MainStore = useMainStore((state) => state);
  const navigate  = useNavigate();
  const { t } = useTranslation();

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
  

  const toggleFormsUrl = (toggle) => {
    let gpsCoords = MainStore.gpsLocation

    if(gpsCoords === null){
      try{
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            gpsCoords = [coords.longitude, coords.latitude];
          },
          (err) => console.error('Geo error:', err)
        );
      }catch(e){
          const options = {
              enableHighAccuracy: true, 
              timeout: 5000,            
              maximumAge: 0             
            };
          window.navigator.geolocation.getCurrentPosition(
              ({ coords }) => {
                gpsCoords = [coords.longitude, coords.latitude];
              },
              (err) => setError(err.message),
              options
          );
      }
    }
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
          toggle,
          gpsCoords
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

  const handleAnalyze = () =>{
    MainStore.setIsAgriculture(true)
    MainStore.setIsOpen(true)
  }

  return (
    <>
      {/* Title Bubble (UNCHANGED) */}
      <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
        <div className="relative w-full max-w-lg mx-auto flex items-center">
          <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
            {t("Agriculture")}
          </div>
        </div>
      </div>

      {/* 2. Top-left buttons */}
      <div className="absolute top-20 left-0 w-full px-4 z-10 flex justify-start pointer-events-auto">
            <div className="flex gap-4 max-w-lg">
            <div className="flex flex-col gap-3">
                {/* GPS Button */}
                <button
                className="flex-shrink-0 w-9 h-9 rounded-md shadow-sm flex items-center justify-center"
                style={{
                    backgroundColor: '#D6D5C9',
                    color: '#592941',
                    border: 'none',
                    backdropFilter: 'none',
                }}
                onClick={() => {MainStore.setIsGPSClick(true)}}
                >
                <svg viewBox="-16 0 130 130" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="50" cy="130" rx="18" ry="6" fill="#00000010" />
                  <path d="M50 20 C70 20 85 35 85 55 C85 75 50 110 50 110 C50 110 15 75 15 55 C15 35 30 20 50 20 Z" 
                        fill="#592941" 
                        stroke="#592941" 
                        strokeWidth="1.5"/>
                  <circle cx="50" cy="55" r="16" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="1.5"/>
                  <circle cx="50" cy="55" r="6" fill="#592941"/>
                  <ellipse cx="46" cy="38" rx="6" ry="10" fill="#FFFFFF25" />
                </svg>
                </button>
                
                {/* INFO Button */}
                <button
                    className="w-9 h-9 rounded-md shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                    onClick={() => MainStore.setIsInfoOpen(true)}
                >
                    <svg viewBox="-16 0 130 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="40" fill="#592941" stroke="#592941" strokeWidth="2"/>

                        <circle cx="50" cy="50" r="36" fill="#592941"/>

                        <circle cx="50" cy="35" r="4" fill="#FFFFFF"/>

                        <rect x="46" y="45" width="8" height="25" rx="4" fill="#FFFFFF"/>

                        <ellipse cx="42" cy="42" rx="8" ry="12" fill="#FFFFFF20"/>
                      </svg>
                </button>
                </div>

                {/* Plan selector with dropdown */}
                <div className="relative">
                <button
                    className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm"
                    style={{
                    backgroundColor: '#D6D5C9',
                    color: '#592941',
                    border: 'none',
                    backdropFilter: 'none',
                    }}
                >
                    {getPlanLabel()}
                </button>
                  <button
                      className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm ml-2"
                      style={{
                        backgroundColor: '#D6D5C9',
                        color: '#592941',
                        border: 'none',
                        backdropFilter: 'none',
                      }}
                      onClick={() =>{
                        MainStore.setIsAgriculture(false)
                        MainStore.setIsLayerStore(true)
                        MainStore.setIsOpen(true)
                      }}
                      >
                      {"Layers"}
                  </button>
                </div>
            </div>
      </div>

     {/* ─── Slider + popup (step 0 only) - MOVED FURTHER DOWN TO AVOID OVERLAP ─── */}
     {MainStore.currentStep === 0 && (
        <div className="absolute top-44 left-0 w-full px-4 z-10">
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
            </div>
        </div>
        )}

      {/* Bottom Controls (UNCHANGED) */}
      <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
        {MainStore.currentStep === 0 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => handleAnalyze()}
              disabled={!MainStore.isMarkerPlaced}
              style={{
                backgroundColor: !MainStore.isMarkerPlaced ? "#696969" : "#D6D5C9",
                color: !MainStore.isMarkerPlaced ? "#A8A8A8" : "#592941",
                border: "none",
              }}
            >
              {t("Analyze")}
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => MainStore.setCurrentStep(1)}
              style={{ backgroundColor: "#D6D5C9", color: "#592941", border: "none" }}
            >
              {t("Start Planning")}
            </button>
          </div>
        )}

        {MainStore.currentStep === 1 && (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                onClick={() => toggleFormsUrl(false)}
                disabled={!MainStore.isMarkerPlaced}
                style={{
                  backgroundColor: !MainStore.isMarkerPlaced ? "#696969" : "#D6D5C9",
                  color: !MainStore.isMarkerPlaced ? "#A8A8A8" : "#592941",
                  border: "none",
                }}
              >
                {t("Propose new Irrigation Work")}
              </button>

              <button
                className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                onClick={() => toggleFormsUrl(true)}
                style={{ 
                  backgroundColor: !MainStore.isMarkerPlaced ? "#696969" : "#D6D5C9",
                  color: !MainStore.isMarkerPlaced ? "#A8A8A8" : "#592941",
                  border: "none", 
                }}
                disabled={!MainStore.isMarkerPlaced}
              >
                {t("Propose Maintenance")}
              </button>
            </div>

            <button
              className="w-1/2 self-center px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => navigate("/")}
              style={{ backgroundColor: "#D6D5C9", color: "#592941", border: "none" }}
            >
              {t("Finish")}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Agriculture;