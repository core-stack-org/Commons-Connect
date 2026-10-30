import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import HamburgerMenu from "../components/HamburgerMenu.jsx";
import SyncDataModal from "../components/SyncDataModal.jsx";
import PlanSheet from "../components/PlanSheet.jsx";
import { useTranslation } from "react-i18next";
import authService from "../services/authService.js";
import NorthIndicator from "../components/NorthIndicator.jsx";
import  {NREGA_MAPPINGS} from "../store/NregaMapping.jsx";
import MapControls from "../components/MapControls.jsx";
import PillButton from "../components/ui/PillButton.jsx";


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
          return (
            name
              .replace(/[()]/g, "")
              // .replace(/-+/g, "_")
              .replace(/\s+/g, "_")
              .replace(/_+/g, "_")
              .replace(/^_|_$/g, "")
              .toLowerCase()
          );
        };

        MainStore.setDistrictName(transformName(searchParams.get("dist_name")));
        MainStore.setBlockName(transformName(searchParams.get("block_name")));
        MainStore.setBlockId?.(searchParams.get("block_id"));

        const language = searchParams.get("language");
        if (language && ["en", "hi"].includes(language)) {
          i18n.changeLanguage(language);
        }
      }

      MainStore.setIsResourceOpen(false);
      MainStore.setCurrentScreen("HomeScreen");
      MainStore.setCurrentStep(0);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const fetchPlansIfReady = async () => {
      if (MainStore.isAuthenticated && authService.isAuthenticated()) {
        const userData = authService.getUserData();
        if (userData?.project_details?.length > 0) {
          await MainStore.fetchPlans(userData.project_details[0].project_id);
        }
      }
    };

    fetchPlansIfReady();
  }, [MainStore.isAuthenticated]);

  const handleSelect = (section) => {
    if (!MainStore.currentPlan) {
      toast.error(t("select_plan"));
      return;
    }
    setIsPlanningOpen(false);
    MainStore.setCurrentCategory(
      section === "Surface Waterbodies"
        ? "SurfaceWaterbodies"
        : section
    );
    if (section === "Groundwater") {
      MainStore.setCurrentScreen("Groundwater");
      navigate("/groundwater");
    } else if (section === "Surface Waterbodies") {
      MainStore.setCurrentScreen("SurfaceWater");
      navigate("/surfaceWater");
    } else if (section === "Agriculture") {
      MainStore.setCurrentScreen("Agriculture");
      navigate("/agriculture");
    } else if (section === "Livelihood") {
      MainStore.setCurrentScreen("Livelihood");
      navigate("/livelihood");
    } else if (section === "Agrohorticulture") {
      MainStore.setCurrentScreen("Agrohorticulture");
      navigate("/agrohorticulture");
    }
  };

  return (
    <div>
      <HamburgerMenu
        open={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
      />
      <SyncDataModal />
      {/* 1. Header — hamburger + full-width title + compass */}
      <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
        <div className="relative w-full max-w-lg mx-auto flex items-center gap-3">
          {/* Hamburger — glass pin style */}
          <button
            className="pointer-events-auto flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
            onClick={() => setIsSideMenuOpen(true)}
            aria-label={t("Menu")}
          >
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="28" width="60" height="10" rx="5" fill="white" />
              <rect x="20" y="45" width="60" height="10" rx="5" fill="white" />
              <rect x="20" y="62" width="60" height="10" rx="5" fill="white" />
              <ellipse cx="34" cy="22" rx="12" ry="6" fill="rgba(255,255,255,0.35)" />
            </svg>
          </button>

          {/* Title bubble — full width */}
          <div
            className="flex-1 px-5 py-2 text-center rounded-full
                         bg-white/10 backdrop-blur-sm border border-white/20
                         text-white font-extrabold text-md shadow-md truncate"
          >
            {MainStore.blockName
              ? MainStore.blockName
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")
              : "Homepage"}
          </div>

          {/* North indicator */}
          <div className="pointer-events-auto flex-shrink-0">
            <NorthIndicator />
          </div>
        </div>
      </div>

      {/* 2. Top-left controls — GPS / info column, plan selector, NREGA */}
      <MapControls onPlanClick={() => setIsPlanSheetOpen(true)} />

      {/* 3. Bottom buttons */}
      {isPlanningOpen && (
        // Tap anywhere outside the menu to close it
        <div
          className="absolute inset-0 z-10"
          onClick={() => setIsPlanningOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="absolute left-0 w-full px-4 z-10 pointer-events-auto bottom-[calc(3.25rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-4 w-full">
          {/* ─── RESOURCE MAPPING ───────────────────────────────────────────── */}
          <div className="relative flex-1 min-w-0">
            <PillButton
              shape="xl"
              className="w-full"
              onClick={() => {
                if (MainStore.currentPlan) {
                  MainStore.setCurrentScreen("Resource_mapping");
                  navigate("/resourcemapping");
                } else {
                  toast.error(t("select_plan"));
                }
              }}
            >
              <span className="truncate">{t("Resource Mapping")}</span>
            </PillButton>
          </div>

          {/* ─── PLANNING + MENU ────────────────────────────────────────────── */}
          <div className="relative flex-1 min-w-0">
            <PillButton
              shape="xl"
              className="w-full"
              aria-expanded={isPlanningOpen}
              onClick={() => setIsPlanningOpen((o) => !o)}
            >
              <span className="truncate">{t("Planning")}</span>
            </PillButton>

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
                  "Agrohorticulture",
                ].map((item) => (
                  <PillButton
                    key={item}
                    shape="xl"
                    className="w-48 h-12"
                    onClick={() => handleSelect(item)}
                  >
                    {t(item)}
                  </PillButton>
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
