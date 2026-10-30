import { useEffect, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';

// Rendered inside MapControls, so it sits under the plan row without measuring the DOM.
const Floater = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const formatCoordinate = (coord) => {
        return coord ? parseFloat(coord).toFixed(4) : "0.0000";
    };

    // Control visibility and animation based on marker placement
    useEffect(() => {
        if (MainStore.isMarkerPlaced && MainStore.markerCoords) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsAnimating(true), 50);
            return () => clearTimeout(timer);
        }
        setIsAnimating(false);
        const timer = setTimeout(() => setIsVisible(false), 300);
        return () => clearTimeout(timer);
    }, [MainStore.isMarkerPlaced, MainStore.markerCoords]);

    // Determine what information to show based on the current state
    const getFloaterContent = () => {
        const coords = MainStore.markerCoords;
        if (!coords) return null;

        const lat = formatCoordinate(coords[1]);
        const lon = formatCoordinate(coords[0]);

        const baseContent = {
            title: t("Marked Pin Location"),
            lat: lat,
            lon: lon
        };

        // Always show settlement info if available (from any previous step)
        const hasSettlement = MainStore.settlementName && MainStore.settlementName.trim() !== "";
        
        // Determine current resource being marked (if any)
        let currentResource = null;
        if (MainStore.isFeatureClicked && MainStore.resourceType && MainStore.selectedResource) {
            const resourceTypeMap = {
                "Well": t("Selected Well"),
                "Waterbody": t("Selected Waterbody"), 
                "Cropgrid": t("Selected Crop Area"),
                "Livelihood": t("Selected Livelihood")
            };

            // Only show current resource if it's not a settlement (settlement should be persistent)
            if (MainStore.resourceType !== "Settlement") {
                const resourceName = MainStore.selectedResource.well_id ||
                                   MainStore.selectedResource.wb_id ||
                                   MainStore.selectedResource.name ||
                                   MainStore.selectedResource?.id;

                currentResource = {
                    type: resourceTypeMap[MainStore.resourceType] || t("Selected Resource"),
                    name: resourceName
                };
            }
        }

        return {
            ...baseContent,
            showDivider: hasSettlement || currentResource,
            settlementInfo: hasSettlement ? {
                type: t("Selected Settlement"),
                name: MainStore.settlementName
            } : null,
            currentResource: currentResource
        };
    };

    // Copy as "lat, lon" — the order shown on screen and what Google Maps expects.
    const handlecopy = () => {
        const [lon, lat] = MainStore.markerCoords;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(`${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}`)
                .then(
                    () => toast.success(t("Copied")),
                    () => toast.error(t("Copy failed"))
                );
        }
    };

    const content = getFloaterContent();

    if (!isVisible || !content) {
        return null;
    }

    return (
        <div className="pointer-events-none max-w-full">
            <div
                className={`pointer-events-auto transition-all duration-300 ease-out ${
                    isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                }`}
            >
                <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 flex flex-wrap items-center gap-1.5">
                    {/* Label */}
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mr-0.5">
                        {t("Pin")}
                    </span>

                    {/* Coordinates chip */}
                    <button
                        onClick={handlecopy}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs text-white font-mono transition-colors"
                        title={t("Copy coordinates")}
                        aria-label={t("Copy coordinates")}
                    >
                        <svg className="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {content.lat}, {content.lon}
                    </button>

                    {/* Settlement chip */}
                    {content.settlementInfo && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-xs text-amber-100">
                            <svg className="w-3 h-3 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                            </svg>
                            {content.settlementInfo.name}
                        </span>
                    )}

                    {/* Resource chip */}
                    {content.currentResource && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-400/20 border border-blue-300/30 text-xs text-blue-100">
                            {content.currentResource.type}: {content.currentResource.name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Floater;