import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import HamburgerMenu from "../components/HamburgerMenu.jsx";
import PlanSheet from "../components/PlanSheet.jsx";
import { useTranslation } from "react-i18next";
import authService from "../services/authService.js";

const Homepage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { t, i18n } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const [isPlanSheetOpen, setIsPlanSheetOpen] = useState(false);
    const [isPlanningOpen, setIsPlanningOpen] = useState(false);
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
    const planRef = useRef(null);

    // TODO: dry run block names
    useEffect(() => {
        const initializeApp = async () => {
            await MainStore.initializeAuth();

            if (MainStore.blockName === null) {
                const transformName = (name) => {
                    if (!name) return name;
                    return name
                        .replace(/\s*\(\s*/g, "") // Remove "("
                        .replace(/\s*\)\s*/g, "") // Remove ")"
                        .replace(/\s+/g, "_") // Replace remaining spaces with "_"
                        .toLowerCase();
                };

                MainStore.setDistrictName(
                    transformName(searchParams.get("dist_name")),
                );
                MainStore.setBlockName(
                    transformName(searchParams.get("block_name")),
                );
                MainStore.setBlockId?.(searchParams.get("block_id"));

                const language = searchParams.get("language");
                if (language && ["en", "hi"].includes(language)) {
                    i18n.changeLanguage(language);
                }
                const homepageUrl = window.location.href;
                MainStore.setHomepageUrl(homepageUrl);
                
                // 🎯 NEW: Check if we should automatically open items list
                const shouldOpenItems = searchParams.get('open_items') === 'true';
                if (shouldOpenItems) {
                    // 🎯 NEW: Check if this navigation is from ODK form (not hard refresh)
                    const isFromOdkForm = sessionStorage.getItem('odkFormNavigation') === 'true';
                    
                    if (isFromOdkForm) {
                        // 🎯 NEW: Get community info from URL parameters
                        const communityId = searchParams.get('community_id');
                        const communityName = searchParams.get('community_name');
                        
                        if (communityId && communityName) {
                            // Store this community info in MainStore for InfoBox to use
                            MainStore.setAcceptedWorkDemandCommunityInfo(communityId, communityName);
                        } else {
                            console.log('ℹ️ Homepage - No community info in URL parameters');
                        }
                        
                        // Clean up URL parameters
                        let cleanUrl = homepageUrl.replace(/[?&]open_items=true/, '');
                        if (communityId) cleanUrl = cleanUrl.replace(/[?&]community_id=[^&]*/, '');
                        if (communityName) cleanUrl = cleanUrl.replace(/[?&]community_name=[^&]*/, '');
                        window.history.replaceState({}, '', cleanUrl);
                        
                        // Set menu option to communities to trigger items list
                        setTimeout(() => {
                            MainStore.setMenuOption('communities');
                            MainStore.setIsInfoOpen(true); // 🎯 CRITICAL: Open InfoBox
                        }, 100);
                        
                        // 🎯 NEW: Clear the ODK form navigation flag after use
                        sessionStorage.removeItem('odkFormNavigation');
                    } else {
                        // Clean up URL parameters without opening InfoBox
                        let cleanUrl = homepageUrl.replace(/[?&]open_items=true/, '');
                        const communityId = searchParams.get('community_id');
                        const communityName = searchParams.get('community_name');
                        if (communityId) cleanUrl = cleanUrl.replace(/[?&]community_id=[^&]*/, '');
                        if (communityName) cleanUrl = cleanUrl.replace(/[?&]community_name=[^&]*/, '');
                        window.history.replaceState({}, '', cleanUrl);
                    }
                }
                
                // 🎯 NEW: Reset community state on hard refresh (when no ODK form navigation AND no items trigger)
                if (!shouldOpenItems && !sessionStorage.getItem('odkFormNavigation')) {
                    MainStore.clearAcceptedWorkDemandCommunityInfo();
                }
            }


            MainStore.setIsResourceOpen(false);
            MainStore.setCurrentScreen("HomeScreen");
            MainStore.setCurrentStep(0);
        };

        initializeApp();
    }, [searchParams]);

    useEffect(() => {
        const fetchPlansIfReady = async () => {
            if (MainStore.isAuthenticated && authService.isAuthenticated()) {
                const userData = authService.getUserData();
                if (userData?.project_details?.length > 0) {
                    await MainStore.fetchPlans(
                        userData.project_details[0].project_id,
                    );
                }
            }
        };

        

        fetchPlansIfReady();
    }, [MainStore.isAuthenticated]);

    const getPlanLabel = () => {
        if (!MainStore.currentPlan) return t("Select Plan");

        const planName = MainStore.currentPlan.plan || "Unknown Plan";
        const capitalizeWords = (str) => {
            return str
                .split(" ")
                .map(
                    (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase(),
                )
                .join(" ");
        };

        const capitalizedPlan = capitalizeWords(planName);
        if (capitalizedPlan.length > 15) {
            return capitalizedPlan.slice(0, 13) + "..";
        }
        return capitalizedPlan;
    };
    const handleNregaSheet = () => {
        MainStore.setNregaSheet(true);
        MainStore.setIsOpen(true);
    };

    const handleSelect = (section) => {
      if(!MainStore.currentPlan){
        toast.error(t('select_plan'));
        return
      }
      setIsPlanningOpen(false);
      // Ensure planning flow always starts from step 0 with clean state
      try {
        MainStore.setCurrentStep(0);
        MainStore.setFeatureStat?.(false);
      } catch (e) {
        console.log('ℹ️ Homepage - Could not reset planning step/feature state:', e);
      }
      
      if(section === "Groundwater"){
        MainStore.setCurrentScreen('Groundwater');
        navigate('/groundwater');
      }
      else if(section === "Surface Waterbodies"){
        MainStore.setCurrentScreen('SurfaceWater');
        navigate('/surfaceWater');
      }
      else if(section === "Agriculture"){
        MainStore.setCurrentScreen('Agriculture');
        navigate('/agriculture');
      }
      else if(section === "Livelihood"){
        MainStore.setCurrentScreen('Livelihood');
        navigate('/livelihood');
      }
    };

    return (
      <div>
        <HamburgerMenu open={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
        {/* 1. Header + hamburger wrapper */}
        <div
          className={`absolute left-0 w-full px-2 z-50 pointer-events-none ${
            MainStore.acceptedWorkDemandItem && !MainStore.isMapEditable ? 'top-12' : 'top-4'
          }`}
        >
          <div className="relative w-full max-w-lg mx-auto flex items-center">
            {/* Hamburger button: re-enable pointer events just for this */}
            <button
              className="pointer-events-auto p-2"
              onClick={() => setIsSideMenuOpen(true)}
            >
              {/* simple SVG "hamburger" icon */}
              <svg
                className="h-10 w-10 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
      
            {/* Title bubble (still purely decorative) */}
            <div
              className="flex-1 px-6 py-3 text-center rounded-full
                         bg-white/10 backdrop-blur-sm border border-white/20
                         text-white font-extrabold text-md shadow-md"
            >
              {MainStore.blockName ? MainStore.blockName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1) ).join(' ') : 'Homepage'}
            </div>
          </div>
        </div>
      
        {/* 2. Top-left buttons */}
        <div className={`absolute left-0 w-full px-4 z-45 flex justify-start pointer-events-auto ${
          MainStore.acceptedWorkDemandItem && !MainStore.isMapEditable ? 'top-28' : 'top-20'
        }`}>
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
              onClick={() => {
                MainStore.setIsGPSClick(!MainStore.isGPSClick)
              }}
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

                        <button
                            className="w-9 h-9 rounded-md shadow-sm flex items-center justify-center"
                            style={{
                                backgroundColor: "#D6D5C9",
                                color: "#592941",
                                border: "none",
                            }}
                            onClick={() => MainStore.setIsInfoOpen(true)}
                        >
                            <svg
                                viewBox="-16 0 130 100"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="#592941"
                                    stroke="#592941"
                                    strokeWidth="2"
                                />

                                <circle cx="50" cy="50" r="36" fill="#592941" />

                                <circle cx="50" cy="35" r="4" fill="#FFFFFF" />

                                <rect
                                    x="46"
                                    y="45"
                                    width="8"
                                    height="25"
                                    rx="4"
                                    fill="#FFFFFF"
                                />

                                <ellipse
                                    cx="42"
                                    cy="42"
                                    rx="8"
                                    ry="12"
                                    fill="#FFFFFF20"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Plan selector with sheet */}
                    <div className="relative">
                        <button
                            onClick={() => setIsPlanSheetOpen(true)}
                            className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm"
                            style={{
                                backgroundColor: "#D6D5C9",
                                color: "#592941",
                                border: "none",
                                backdropFilter: "none",
                            }}
                        >
                            {getPlanLabel()}
                        </button>
                    </div>

                    <button
                        className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm h-9"
                        style={{
                            backgroundColor: "#D6D5C9",
                            color: "#592941",
                            border: "none",
                            backdropFilter: "none",
                        }}
                        onClick={handleNregaSheet}
                    >
                        {t("NREGA Works")}
                    </button>
                </div>

                {/* Maintenance Required Indicator - only show when plan is selected */}
                {MainStore.currentPlan && (
                    <div className="absolute left-17 top-12 z-10 pointer-events-auto">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: "#ffd60a" }}
                            ></div>
                            <span className="text-white text-xs font-medium">
                                {t("Maintenance required")}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Bottom buttons */}
            <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
                <div className="flex gap-4 w-full">
                    {/* ─── RESOURCE MAPPING ───────────────────────────────────────────── */}
                    <div className="relative flex-1">
                        <button
                            className="w-full px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center justify-center transition-all duration-300 ease-in-out transform active:scale-95 whitespace-nowrap"
                            style={{
                                backgroundColor: !MainStore.isMapEditable
                                    ? "#696969"
                                    : "#D6D5C9",
                                color: !MainStore.isMapEditable
                                    ? "#A8A8A8"
                                    : "#592941",
                                border: "none",
                                minHeight: "44px",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                            disabled={!MainStore.isMapEditable}
                            onClick={() => {
                                if (MainStore.currentPlan) {
                                    MainStore.setCurrentScreen(
                                        "Resource_mapping",
                                    );
                                    navigate("/resourcemapping");
                                } else {
                                    toast.error("Please Select a Plan !");
                                }
                            }}
                            onTouchStart={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            {t("Resource Mapping")}
                        </button>
                    </div>

                    {/* ─── PLANNING + MENU ────────────────────────────────────────────── */}
                    <div className="relative flex-1">
                        <button
                            className="w-full px-6 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center justify-center transition-all duration-300 ease-in-out transform active:scale-95"
                            style={{
                                backgroundColor: "#D6D5C9",
                                color: "#592941",
                                border: "none",
                                height: "44px",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                            onClick={() => setIsPlanningOpen((o) => !o)}
                            onTouchStart={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)";
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            {t("Planning")}
                        </button>

                        {isPlanningOpen && (
                            <div
                                className="
                    absolute bottom-full mb-4 left-1/2 -translate-x-1/2
                    w-54 max-w-sm
                    space-y-4 p-6
                    rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30
                    shadow-xl
                    flex flex-col items-center
                  "
                            >
                                {[
                                    "Groundwater",
                                    "Surface Waterbodies",
                                    "Agriculture",
                                    "Livelihood",
                                ].map((item) => (
                                    <button
                                        key={item}
                                        className="w-48 px-2 py-2 rounded-xl shadow-lg text-sm font-medium flex items-center justify-center transition-all duration-300 ease-in-out transform active:scale-95"
                                        style={{
                                            backgroundColor: "#D6D5C9",
                                            color: "#592941",
                                            border: "none",
                                            height: "48px",
                                            boxShadow:
                                                "0 4px 20px rgba(0, 0, 0, 0.3)",
                                        }}
                                        onClick={() => handleSelect(item)}
                                        onTouchStart={(e) => {
                                            e.currentTarget.style.transform =
                                                "scale(0.95)";
                                        }}
                                        onTouchEnd={(e) => {
                                            e.currentTarget.style.transform =
                                                "scale(1)";
                                        }}
                                        onMouseDown={(e) => {
                                            e.currentTarget.style.transform =
                                                "scale(0.95)";
                                        }}
                                        onMouseUp={(e) => {
                                            e.currentTarget.style.transform =
                                                "scale(1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform =
                                                "scale(1)";
                                        }}
                                    >
                                        {t(item)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Plan Selection Sheet */}
            <PlanSheet
                isOpen={isPlanSheetOpen}
                onClose={() => setIsPlanSheetOpen(false)}
            />
        </div>
    );
};

export default Homepage;
