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

    // Format coordinates to display with proper precision
    const formatCoordinate = (coord) => {
        return coord ? parseFloat(coord).toFixed(6) : "0.000000";
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
            title: t("Pin Location"),
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
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transformOrigin: 'top left'
            }}
        >
            {/* Main floater content with glassy effect */}
            <div 
                className={`bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl shadow-black/20 transition-all duration-300 ease-out relative overflow-hidden pointer-events-auto w-full ${
                    isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{
                    transformOrigin: 'top left'
                }}
            >
                {/* Content container */}
                <div className="px-4 py-3">
                    {/* Header with buttons on the right */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <div className="text-md font-semibold text-white mb-1 drop-shadow-sm">
                                {content.title}
                            </div>
                            <div className="text-sm text-white/90 drop-shadow-sm">
                                Lat: {content.lat} Lon: {content.lon}
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex ml-4">
                            <button
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 backdrop-blur-sm bg-white/40 text-white border border-white/50 shadow-md`} 
                                onClick={handlecopy}
                            >
                                📋
                            </button>
                        </div>
                    </div>

                    {/* Settlement and Resource Info */}
                    {content.showDivider && (
                        <div className="border-t border-white/30 pt-2 space-y-2">
                            {/* Persistent Settlement Info */}
                            {content.settlementInfo && (
                                <div className="text-sm text-white/90 drop-shadow-sm">
                                    <div className="font-semibold text-white">
                                        {content.settlementInfo.type}: {content.settlementInfo.name}
                                    </div>
                                </div>
                            )}
                            
                            {/* Current Resource Info */}
                            {content.currentResource && (
                                <div className="text-sm text-white/90 drop-shadow-sm">
                                    <div className="font-medium text-white">
                                        {content.currentResource.type}: {content.currentResource.name}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Floater;