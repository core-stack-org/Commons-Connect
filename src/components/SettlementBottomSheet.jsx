import { useEffect, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";

const SettlementBottomSheet = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (MainStore.currentStep === 0 && MainStore.isMarkerPlaced && MainStore.isFeatureClicked) {
            setIsVisible(true);
            setTimeout(() => setIsAnimating(true), 50);
        } else {
            setIsAnimating(false);
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [MainStore.currentStep, MainStore.isMarkerPlaced, MainStore.isFeatureClicked]);

    const handleSettlementInfo = () => {
     
        MainStore.setIsResource(true);
        MainStore.setResourceType("Settlement");
        MainStore.setIsOpen(true);
    };

    const handleMarkResources = () => {
        MainStore.setCurrentStep(1);
        MainStore.setIsResource(false);
        MainStore.setFeatureStat(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-20 pointer-events-none">
            <div 
                className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300 ${
                    isAnimating ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={() => {
                    setIsAnimating(false);
                    setTimeout(() => setIsVisible(false), 300);
                }}
            />
            
            {/* Bottom sheet content */}
            <div 
                className={`relative bg-white/20 backdrop-blur-md border-t border-white/30 rounded-t-3xl shadow-xl shadow-black/20 transition-all duration-300 ease-out pointer-events-auto overflow-hidden ${
                    isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`}
                style={{
                    transformOrigin: 'bottom center'
                }}
            >
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-white/40 rounded-full" />
                </div>
                
                {/* Content */}
                <div className="px-6 pb-8">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-white drop-shadow-sm">
                            {MainStore.settlementName || t("Selected Settlement")}
                        </h3>
                        <p className="text-sm text-white/80 drop-shadow-sm mt-1">
                            {t("Choose an action for this settlement")}
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        {/* Settlement Info Button - Pill style */}
                        <div className="flex items-center justify-center w-full">
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={handleSettlementInfo}
                                style={{
                                    backgroundColor: '#D6D5C9',
                                    color: '#592941',
                                    border: 'none',
                                    borderRadius: '22px',
                                    height: '44px',
                                    width: '350px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {t("Settlement Info")}
                            </button>
                        </div>
                        
                        {/* Mark Resources Button - Pill style */}
                        <div className="flex items-center justify-center w-full">
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={handleMarkResources}
                                style={{
                                    backgroundColor: '#D6D5C9',
                                    color: '#592941',
                                    border: 'none',
                                    borderRadius: '22px',
                                    height: '44px',
                                    width: '350px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {t("Mark Resources")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettlementBottomSheet;