import React, { useEffect } from 'react';
import { X, Globe, FileText, UploadCloud, ChevronRight, Handshake } from 'lucide-react';
import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";

const HamburgerMenu = ({ open, onClose }) => {
    
    const { t } = useTranslation();
    const setMenuOption = useMainStore((state) => state.setMenuOption);
    const setIsInfoOpen = useMainStore((state) => state.setIsInfoOpen);
    const resetMapToEditableMode = useMainStore((state) => state.resetMapToEditableMode);
    const safeResetMapToEditableMode = useMainStore((state) => state.safeResetMapToEditableMode);
    const isMapEditable = useMainStore((state) => state.isMapEditable);
    const acceptedWorkDemandItem = useMainStore((state) => state.acceptedWorkDemandItem);

    // Auto-reset map to editable mode when hamburger menu is opened in non-editable mode
    useEffect(() => {
        if (open && !isMapEditable && acceptedWorkDemandItem) {
            console.log('🍔 HamburgerMenu - Auto-resetting map to editable mode');
            resetMapToEditableMode();
        }
    }, [open, isMapEditable, acceptedWorkDemandItem]);

    return(
    <>
        {/* Backdrop */}
        <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        />

        {/* Sidebar panel */}
        <aside
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-55 transform transition-transform duration-300 ${
            open ? 'translate-x-0' : '-translate-x-full'
        }`}
        >
        {/* Header */}
        <div className="bg-[#CAC8BB] px-4 py-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Commons Connect</h2>
            <button onClick={onClose} aria-label="Close menu">
            <X size={22} />
            </button>
        </div>

        {/* Map Mode Reset Notification */}
        {!isMapEditable && acceptedWorkDemandItem && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 px-4 py-3 mx-4 rounded">
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">
                        Map editing has been re-enabled. You can now interact with the map freely.
                    </span>
                </div>
            </div>
        )}

        {/* Menu items */}
        <div className="p-4 space-y-3">
            <button
            onClick={() => {
                // Reset map to editable mode when selecting a menu option
                safeResetMapToEditableMode();
                setMenuOption("language")
                onClose()
                setIsInfoOpen(true)
            }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
            >
            <div className="flex items-center gap-3">
                <Globe size={18} style={{color: '#592941'}} />
                <span>{t("Choose Language")}</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button
            onClick={() => {
                // Reset map to editable mode when selecting a menu option
                safeResetMapToEditableMode();
                setMenuOption("download dpr")
                onClose()
                setIsInfoOpen(true)
            }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
            >
            <div className="flex items-center gap-3">
                <FileText size={18} style={{color: '#592941'}} />
                <span>{t("Generate pre-DPR")}</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button
            onClick={() => {
                // Reset map to editable mode when selecting a menu option
                safeResetMapToEditableMode();
                setMenuOption("upload kml")
                onClose()
                setIsInfoOpen(true)
            }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
            >
            <div className="flex items-center gap-3">
                <UploadCloud size={18} style={{color: '#592941'}} />
                <span>{t("Upload KML")}</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button
            onClick={() => {
                // Reset map to editable mode when selecting a menu option
                safeResetMapToEditableMode();
                setMenuOption("communities")
                onClose()
                setIsInfoOpen(true)
            }}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
            >
            <div className="flex items-center gap-3">
                <Handshake size={18} style={{color: '#592941'}} />
                <span>{t("Communities")}</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
            </button>
        </div>
        </aside>
    </>
    )
};


export default HamburgerMenu;
