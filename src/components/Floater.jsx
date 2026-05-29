import { useEffect, useState, useRef } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';

const Floater = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const floaterRef = useRef(null);

    const formatCoordinate = (coord) => {
        return coord ? parseFloat(coord).toFixed(4) : "0.0000";
    };

    // Calculate position and width based on info button location and screen size
    const calculatePosition = () => {
        const infoButton = document.querySelector('button[aria-label="Info"]') || 
                          document.querySelector('button svg circle[fill="#592941"]')?.closest('button');
        
        if (infoButton) {
            const rect = infoButton.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const leftPadding = rect.left;
            const rightPadding = leftPadding;
            
            return {
                top: rect.bottom + 8,
                left: rect.left + 55,
                width: screenWidth - rect.left - rightPadding
            };
        }
    };

    // Control visibility and animation based on marker placement
    useEffect(() => {
        if (MainStore.isMarkerPlaced && MainStore.markerCoords) {
            const newPosition = calculatePosition();
            if (newPosition) {
                setPosition(newPosition);
                setIsVisible(true);
                setTimeout(() => setIsAnimating(true), 50);
            }
        } else {
            setIsAnimating(false);
            setIsPinned(false);
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [MainStore.isMarkerPlaced, MainStore.markerCoords]);

    // Update position when window resizes or scrolls
    useEffect(() => {
        if (isVisible) {
            const updatePosition = () => {
                const newPosition = calculatePosition();
                if (newPosition) {
                    setPosition(newPosition);
                }
            };

            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            };
        }
    }, [isVisible]);

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

    const handleClose = () => {
        setIsAnimating(false);
        setIsPinned(false);
        setTimeout(() => setIsVisible(false), 300);
    };

    const handlecopy = () => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(MainStore.markerCoords).then(
                () => toast.success("Copied ✔︎"),
                () => toast.error("Failed ✖︎")
            )
        }
    };

    const content = getFloaterContent();

    if (!isVisible || !content) {
        return null;
    }

    return (
        <div
            ref={floaterRef}
            className="fixed z-10 pointer-events-none"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
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
                        title="Copy coordinates"
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