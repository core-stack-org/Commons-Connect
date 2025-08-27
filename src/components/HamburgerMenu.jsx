import {
    X,
    Globe,
    FileText,
    UploadCloud,
    ChevronRight,
    User,
    Building2,
    FolderOpen,
    Shield,
} from "lucide-react";
import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";
import authService from "../services/authService.js";

const HamburgerMenu = ({ open, onClose }) => {
    const { t } = useTranslation();
    const setMenuOption = useMainStore((state) => state.setMenuOption);
    const setIsInfoOpen = useMainStore((state) => state.setIsInfoOpen);
    const { user } = useMainStore();

    // MARK: auth data in the hamburger menu
    const userData = authService.getUserData();
    const userName = authService.getUserName();
    const organization = authService.getOrganization();

    const project =
        userData?.project_details?.length > 0
            ? userData.project_details[0].project_name ||
              userData.project_details[0].title
            : "No Project";
    const role = (() => {
        if (userData?.groups?.length > 0) {
            return userData.groups
                .map((group) => group.name || group)
                .join(", ");
        } else if (userData?.is_superadmin) {
            return "Superadmin";
        } else {
            return "No Role";
        }
    })();

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
                    open
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <aside
                className={`fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 rounded-br-2xl ${
                    open ? "translate-x-0" : "-translate-x-full"
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
                    {/* User Info Box */}
                    <div className="w-full p-4 bg-white rounded-lg shadow-sm border-l-4 border-[#592941]">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User size={18} style={{ color: "#592941" }} />
                                <div className="font-semibold text-gray-900 text-base">
                                    {userName}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Building2
                                    size={18}
                                    style={{ color: "#592941" }}
                                />
                                <div className="text-gray-600 text-sm">
                                    {organization}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FolderOpen
                                    size={18}
                                    style={{ color: "#592941" }}
                                />
                                <div className="text-gray-600 text-sm">
                                    {project}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield
                                    size={18}
                                    style={{ color: "#592941" }}
                                />
                                <div className="text-gray-600 text-sm">
                                    {role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setMenuOption("language");
                            onClose();
                            setIsInfoOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <Globe size={18} style={{ color: "#592941" }} />
                            <span>{t("Choose Language")}</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>

                    <button
                        onClick={() => {
                            setMenuOption("download dpr");
                            onClose();
                            setIsInfoOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <FileText size={18} style={{ color: "#592941" }} />
                            <span>{t("Generate pre-DPR")}</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>

                    <button
                        onClick={() => {
                            setMenuOption("upload kml");
                            onClose();
                            setIsInfoOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <UploadCloud
                                size={18}
                                style={{ color: "#592941" }}
                            />
                            <span>{t("Upload KML")}</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default HamburgerMenu;
