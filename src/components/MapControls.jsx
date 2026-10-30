import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";
import NregaButton from "./NregaButton.jsx";

const capitalizeWords = (str) =>
    str
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

const GpsIcon = () => (
    <svg viewBox="-16 0 130 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="50" cy="130" rx="18" ry="6" fill="#00000010" />
        <path
            d="M50 20 C70 20 85 35 85 55 C85 75 50 110 50 110 C50 110 15 75 15 55 C15 35 30 20 50 20 Z"
            fill="#592941"
            stroke="#592941"
            strokeWidth="1.5"
        />
        <circle cx="50" cy="55" r="16" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="1.5" />
        <circle cx="50" cy="55" r="6" fill="#592941" />
        <ellipse cx="46" cy="38" rx="6" ry="10" fill="#FFFFFF25" />
    </svg>
);

const InfoIcon = () => (
    <svg viewBox="-16 0 130 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="50" cy="50" r="40" fill="#592941" stroke="#592941" strokeWidth="2" />
        <circle cx="50" cy="50" r="36" fill="#592941" />
        <circle cx="50" cy="35" r="4" fill="#FFFFFF" />
        <rect x="46" y="45" width="8" height="25" rx="4" fill="#FFFFFF" />
        <ellipse cx="42" cy="42" rx="8" ry="12" fill="#FFFFFF20" />
    </svg>
);

// Top-left map controls shared by every map screen: GPS + Info column, plan chip,
// optional NREGA button. `children` render under the plan row (e.g. the pin Floater).
const MapControls = ({ onPlanClick, showNrega = true, children }) => {
    const { t } = useTranslation();
    const isGPSClick = useMainStore((s) => s.isGPSClick);
    const setIsGPSClick = useMainStore((s) => s.setIsGPSClick);
    const setIsInfoOpen = useMainStore((s) => s.setIsInfoOpen);
    const currentPlan = useMainStore((s) => s.currentPlan);

    const planLabel = currentPlan
        ? capitalizeWords(currentPlan.plan || "Unknown Plan")
        : t("Select Plan");

    const planChipClass =
        "h-9 max-w-[10rem] px-3 rounded-xl shadow-sm text-sm bg-sand text-plum flex items-center gap-1";

    return (
        <div className="absolute top-20 left-0 w-full px-4 z-10 flex justify-start pointer-events-none">
            <div className="flex gap-4 max-w-lg min-w-0">
                <div className="flex flex-col gap-3 pointer-events-auto">
                    <button
                        type="button"
                        aria-label={t("My location")}
                        aria-pressed={isGPSClick}
                        title={t("My location")}
                        className={`relative flex-shrink-0 w-9 h-9 rounded-md shadow-sm flex items-center justify-center bg-sand transition-shadow ${
                            isGPSClick ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent" : ""
                        }`}
                        onClick={() => setIsGPSClick(!isGPSClick)}
                    >
                        <GpsIcon />
                        {isGPSClick && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        aria-label={t("Info")}
                        title={t("Info")}
                        className="w-9 h-9 rounded-md shadow-sm flex items-center justify-center bg-sand"
                        onClick={() => setIsInfoOpen(true)}
                    >
                        <InfoIcon />
                    </button>
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                    <div className="flex gap-4 min-w-0 pointer-events-auto">
                        {onPlanClick ? (
                            <button
                                type="button"
                                onClick={onPlanClick}
                                className={`${planChipClass} cursor-pointer active:scale-95 transition-transform`}
                            >
                                <span className="truncate">{planLabel}</span>
                                <svg
                                    className="w-3 h-3 flex-shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        ) : (
                            <div className={planChipClass} title={currentPlan?.plan}>
                                <span className="truncate">{planLabel}</span>
                            </div>
                        )}
                        {showNrega && <NregaButton />}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default MapControls;
