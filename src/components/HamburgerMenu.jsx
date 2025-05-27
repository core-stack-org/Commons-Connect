import { X, Globe, FileText, UploadCloud, ChevronRight } from 'lucide-react';
import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";

const HamburgerMenu = ({ open, onClose }) => {
    
    const { t } = useTranslation();
    const setMenuOption = useMainStore((state) => state.setMenuOption);
    const setIsInfoOpen = useMainStore((state) => state.setIsInfoOpen);

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
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
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

        {/* Menu items */}
        <div className="p-4 space-y-3">
            <button
            onClick={() => {
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
        </div>
        </aside>
    </>
    )
};


export default HamburgerMenu;
