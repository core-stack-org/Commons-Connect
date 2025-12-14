import React, { useState } from "react";
import useMainStore from "../store/MainStore";
import toast from "react-hot-toast";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import SquircleLoader from "./SquircleLoader.jsx";

const InfoBox = () => {
    const isInfoOpen = useMainStore((state) => state.isInfoOpen);
    const setIsInfoOpen = useMainStore((state) => state.setIsInfoOpen);
    const currentScreen = useMainStore((state) => state.currentScreen);
    const currentPlan = useMainStore((state) => state.currentPlan);
    const currentStep = useMainStore((state) => state.currentStep);
    const currentMenuOption = useMainStore((state) => state.menuOption);
    const setMenuOption = useMainStore((state) => state.setMenuOption);
    const layerClicked = useMainStore((state) => state.layerClicked);
    const isAgroforestryMaskActive = useMainStore((state) => state.isAgroforestryMaskActive);

    const { t, i18n } = useTranslation();
    const isHome = currentScreen === "HomeScreen";

    const [email, setEmail] = useState("");

    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useState(i18next.language); // Default language
    const [languageChangeSuccess, setLanguageChangeSuccess] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleLanguageSelect = (langCode) => {
        setSelectedLanguage(langCode);
        setLanguageChangeSuccess(false);
    };

    const handleApplyLanguage = () => {
        if (selectedLanguage) {
            i18n.changeLanguage(selectedLanguage);

            setCurrentLanguage(selectedLanguage);

            const url = new URL(window.location);
            url.searchParams.set("language", selectedLanguage);
            window.history.pushState({}, "", url);

            setLanguageChangeSuccess(true);
            setTimeout(() => {
                setLanguageChangeSuccess(false);
                setMenuOption(null);
                setIsInfoOpen(false);
            }, 3000);
        }
    };

    const handleDownloadDPR = () => {
        if (currentPlan !== null) {
            const body = { plan_id: currentPlan.plan_id, email_id: email };

            fetch(`${import.meta.env.VITE_API_URL}generate_dpr/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            toast.success(
                "You will receive an email from contact@core-stack.org upon DPR generation.",
            );
        } else {
            toast.error("No Plan selected !");
        }

        setMenuOption(null);
        setIsInfoOpen(false);
    };

    const handleUploadKML = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadError(null);
            setUploadSuccess(false);
            setUploadProgress(0);

            if (!file.name.toLowerCase().endsWith(".kml")) {
                setUploadError("Please select a valid KML file");
                setSelectedFile(null);
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                setUploadError("File size must be less than 10MB");
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleProcessKML = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append("kml_file", selectedFile);

            const url = `${import.meta.env.VITE_API_URL}upload_kml/`;

            const response = await fetch(url, {
                method: "POST",
                body: formData,
                // Add headers if needed
                // headers: {
                //   'Authorization': `Bearer ${token}`, // If authentication is required
                // },
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Upload successful:", result);
                setUploadSuccess(true);
                setUploadProgress(100);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setUploadError(
                    errorData.message ||
                    `Upload failed with status: ${response.status}`,
                );
            }
        } catch (error) {
            setUploadError(
                "Network error. Please check your connection and try again.",
            );
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadError(null);
        setUploadSuccess(false);
        setIsUploading(false);
    };

    const screenContent = {
        Resource_mapping: (
            <>
                <h2 className="text-lg font-bold mb-2">Resource Mapping</h2>
                <p className="text-gray-700 text-sm">{t("info_social_1")}</p>
            </>
        ),
        Groundwater: (
            <>
                <p className="text-gray-700 text-sm">{t("info_gw_1")}</p>
                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Analyze")}
                </h3>
                <p>{t("info_gw_2")}</p>

                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Start Planning")}
                </h3>
                <p>{t("info_gw_3")}</p>

                {currentStep === 1 ? (
                    <>
                        {layerClicked === "CLARTLayer" ? (
                            <>
                                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                                    CLART Legend
                                </h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-gray-100 mr-3"></div>
                                        <span>Empty</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-green-400 mr-3"></div>
                                        <span>Good recharge</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-yellow-300 mr-3"></div>
                                        <span>Moderate recharge</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-pink-700 mr-3"></div>
                                        <span>Regeneration</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-blue-500 mr-3"></div>
                                        <span>High runoff zone</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-red-600 mr-3"></div>
                                        <span>Surface water harvesting</span>
                                    </div>
                                </div>
                            </>
                        ) : layerClicked === "TerrainLayer" ? (
                            <>
                                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                                    Terrain Legend
                                </h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#313695", opacity: 0.7 }}></div>
                                        <span>V-shape river valleys, Deep narrow canyons</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#4575b4", opacity: 0.7 }}></div>
                                        <span>Lateral midslope incised drainages, Local valleys in plains</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#a50026", opacity: 0.7 }}></div>
                                        <span>Upland incised drainages, Stream headwaters</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#e0f3f8", opacity: 0.7 }}></div>
                                        <span>U-shape valleys</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#fffc00", opacity: 0.7 }}></div>
                                        <span>Broad Flat Areas</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#feb24c", opacity: 0.7 }}></div>
                                        <span>Broad open slopes</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#f46d43", opacity: 0.7 }}></div>
                                        <span>Mesa tops</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#d73027", opacity: 0.7 }}></div>
                                        <span>Upper Slopes</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#91bfdb", opacity: 0.7 }}></div>
                                        <span>Local ridge/hilltops within broad valleys</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#800000", opacity: 0.7 }}></div>
                                        <span>Lateral midslope drainage divides, Local ridges in plains</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#4d0000", opacity: 0.7 }}></div>
                                        <span>Mountain tops, high ridges</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#ffffff", opacity: 0.7 }}></div>
                                        <span>Background</span>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </>
                ) : (
                    <>
                        <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                            {t("Well Depth Legend")}
                        </h3>
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded bg-red-600 mr-3"></div>
                                <span>{t("Less than -5m")}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded bg-yellow-300 mr-3"></div>
                                <span>{t(">-5m to -1m")}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded bg-green-500 mr-3"></div>
                                <span>{t(">-1m to 1m")}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded bg-blue-600 mr-3"></div>
                                <span>{t("More than 1m")}</span>
                            </div>
                        </div>
                    </>
                )}
            </>
        ),
        SurfaceWater: (
            <>
                <p className="text-gray-700 text-sm">{t("info_wb_1")}</p>
                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Analyze")}
                </h3>
                <p>{t("info_wb_2")}</p>
                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Propose Maintainence")}
                </h3>
                <p>{t("info_wb_5")}</p>
            </>
        ),
        Agriculture: (
            <>
                <p className="text-gray-700 text-sm">{t("info_gw_1")}</p>
                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Analyze")}
                </h3>
                <p>{t("info_gw_2")}</p>

                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Start Planning")}
                </h3>
                <p>{t("info_gw_3")}</p>

                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Irrigation")}
                </h3>
                <p>{t("info_agri_4")}</p>

                {currentStep === 0 ? (
                    <>
                        <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                            {t("LULC Legend")}
                        </h3>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded mr-3 bg-[#c6e46d]"></div>
                                <span>Single Kharif</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded mr-3 bg-[#eee05d]"></div>
                                <span>Single Non-Kharif</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded mr-3 bg-[#f9b249]"></div>
                                <span>Double Crop</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded mr-3 bg-[#fb5139]"></div>
                                <span>Triple Crop</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded mr-3 bg-[#a9a9a9]"></div>
                                <span>Barren Lands</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 rounded mr-3 bg-[#4c4ef5]"></div>
                                <span>Shrubs and Scrubs</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {layerClicked === "CLARTLayer" ? (
                            <>
                                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                                    {t("CLART Legend")}
                                </h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-gray-100 mr-3"></div>
                                        <span>{t("Empty")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-green-400 mr-3"></div>
                                        <span>{t("Good recharge")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-yellow-300 mr-3"></div>
                                        <span>{t("Moderate recharge")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-purple-700 mr-3"></div>
                                        <span>{t("Regeneration")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-blue-500 mr-3"></div>
                                        <span>{t("High runoff zone")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-red-600 mr-3"></div>
                                        <span>{t("Surface water harvesting")}</span>
                                    </div>
                                </div>
                            </>
                        ) : layerClicked === "TerrainLayer" ? (
                            <>
                                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                                    Terrain Legend
                                </h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#313695", opacity: 0.7 }}></div>
                                        <span>V-shape river valleys, Deep narrow canyons</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#4575b4", opacity: 0.7 }}></div>
                                        <span>Lateral midslope incised drainages, Local valleys in plains</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#a50026", opacity: 0.7 }}></div>
                                        <span>Upland incised drainages, Stream headwaters</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#e0f3f8", opacity: 0.7 }}></div>
                                        <span>U-shape valleys</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#fffc00", opacity: 0.7 }}></div>
                                        <span>Broad Flat Areas</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#feb24c", opacity: 0.7 }}></div>
                                        <span>Broad open slopes</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#f46d43", opacity: 0.7 }}></div>
                                        <span>Mesa tops</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#d73027", opacity: 0.7 }}></div>
                                        <span>Upper Slopes</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#91bfdb", opacity: 0.7 }}></div>
                                        <span>Local ridge/hilltops within broad valleys</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#800000", opacity: 0.7 }}></div>
                                        <span>Lateral midslope drainage divides, Local ridges in plains</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#4d0000", opacity: 0.7 }}></div>
                                        <span>Mountain tops, high ridges</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#ffffff", opacity: 0.7 }}></div>
                                        <span>Background</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                                    {t("CLART Legend")}
                                </h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-gray-100 mr-3"></div>
                                        <span>{t("Empty")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-green-400 mr-3"></div>
                                        <span>{t("Good recharge")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-yellow-300 mr-3"></div>
                                        <span>{t("Moderate recharge")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-purple-700 mr-3"></div>
                                        <span>{t("Regeneration")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-blue-500 mr-3"></div>
                                        <span>{t("High runoff zone")}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded bg-red-600 mr-3"></div>
                                        <span>{t("Surface water harvesting")}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </>
        ),
        Livelihood: (
            <>
                <h2 className="text-lg font-semibold mb-2">Livelihood Info</h2>
                <p className="text-gray-700 text-sm">
                    Livelihood programs, employment schemes, and community
                    activities.
                </p>
            </>
        ),
        Agroforestry: (
            <>
                <p className="text-gray-700 text-sm mb-4">
                    {t("info_agroforestry_1")}
                </p>
                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">
                    {t("Site Suitability Legend")}
                </h3>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#2E7D32" }}></div>
                        <span>{t("Very Good")}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#66BB6A" }}></div>
                        <span>{t("Good")}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#FDD835" }}></div>
                        <span>{t("Moderate")}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#FF8F00" }}></div>
                        <span>{t("Marginally Suitable")}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded mr-3" style={{ backgroundColor: "#D32F2F" }}></div>
                        <span>{t("Unsuitable")}</span>
                    </div>
                </div>
            </>
        ),
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // MARK: Language Selection
    const getCurrentLanguageFromURL = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("language") || "en";
    };

    if (!isInfoOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Animation Styles */}
            <style>
                {`
                    @keyframes overlayFadeIn {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                    @keyframes modalExpand {
                        0% {
                            opacity: 0;
                            transform: scale(0.7);
                        }
                        50% {
                            transform: scale(1.02);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}
            </style>

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-white/10 backdrop-blur-md"
                style={{
                    animation: "overlayFadeIn 0.3s ease-out forwards"
                }}
                onClick={() => setIsInfoOpen(false)}
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 z-10 pointer-events-auto max-h-[80vh] overflow-y-auto"
                style={{
                    animation: "modalExpand 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                }}
            >
                {/* Header */}
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    {currentMenuOption
                        ? currentMenuOption === "language"
                            ? t("Select Language")
                            : currentMenuOption === "download dpr"
                                ? t("Generate pre-DPR")
                                : currentMenuOption === "upload kml"
                                    ? t("Upload KML")
                                    : currentMenuOption === "information"
                                        ? t("Information")
                                        : t("Information")
                        : t("Information")}
                </h2>

            {/* Close */}
            <button
                className="absolute text-xl top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={() => {
                    setIsInfoOpen(false);
                    setMenuOption(null);
                }}
            >
                ✕
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 pb-6">
            {/* Menu Option Content */}
            {currentMenuOption ? (
                <div className="text-center space-y-4">
                    {currentMenuOption === "language" && (
                        <div className="space-y-4">
                            {/* Header Section */}
                            <div className="text-center space-y-2">
                                <p className="text-sm text-gray-600">
                                    {t("change_info_1")}
                                </p>
                            </div>

                                {/* Language Options - Scrollable */}
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                                    {[
                                        {
                                            code: "en",
                                            name: "English",
                                            native: "English",
                                            flag: "🇺🇸",
                                        },
                                        {
                                            code: "hi",
                                            name: "Hindi",
                                            native: "हिन्दी",
                                            flag: "🇮🇳",
                                        },
                                    ].map((language) => (
                                        <button
                                            key={language.code}
                                            onClick={() =>
                                                handleLanguageSelect(
                                                    language.code,
                                                )
                                            }
                                            className={`w-full p-4 border-2 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedLanguage ===
                                                language.code
                                                ? "border-blue-500 bg-blue-50 shadow-md"
                                                : "border-gray-200 hover:border-blue-300 hover:bg-white bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                {/* Flag */}
                                                <div className="text-2xl flex-shrink-0">
                                                    {language.flag}
                                                </div>

                                            {/* Language Info */}
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {language.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {
                                                                language.native
                                                            }
                                                        </p>
                                                    </div>

                                                        {/* Selection Indicator */}
                                                        <div
                                                            className={`flex-shrink-0 transition-all duration-200 ${selectedLanguage ===
                                                                language.code
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                                }`}
                                                        >
                                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                                <svg
                                                                    className="w-3 h-3 text-white"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Apply Button */}
                            <div className="pt-2">
                                <button
                                    onClick={handleApplyLanguage}
                                    disabled={!selectedLanguage}
                                    className="w-full py-3 px-4 text-white rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                                    style={{
                                        backgroundColor: "#592941",
                                    }}
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span>{t("Change Language")}</span>
                                    </div>
                                </button>
                            </div>

                            {currentLanguage && (
                                <div
                                    className="rounded-2xl p-4"
                                    style={{ backgroundColor: "#C9BACE" }}
                                >
                                    <div className="flex items-start space-x-3 text-black">
                                        <svg
                                            className="w-6 h-6 mt-0.5 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM12 20h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1z" />
                                        </svg>
                                        <div className="text-sm">
                                            <p className="font-medium mb-2 text-left">
                                                {t("Current Language")}:
                                            </p>
                                            <p className="text-left">
                                                {currentLanguage === "en"
                                                    ? "English"
                                                    : currentLanguage ===
                                                        "hi"
                                                        ? "Hindi (हिन्दी)"
                                                        : currentLanguage ===
                                                            "mr"
                                                            ? "Marathi (मराठी)"
                                                            : currentLanguage ===
                                                                "bn"
                                                                ? "Bengali (বাংলা)"
                                                                : currentLanguage ===
                                                                    "te"
                                                                    ? "Telugu (తెలుగు)"
                                                                    : currentLanguage ===
                                                                        "ta"
                                                                        ? "Tamil (தமிழ்)"
                                                                        : currentLanguage ===
                                                                            "gu"
                                                                            ? "Gujarati (ગુજરાતી)"
                                                                            : currentLanguage ===
                                                                                "kn"
                                                                                ? "Kannada (ಕನ್ನಡ)"
                                                                                : currentLanguage ===
                                                                                    "ml"
                                                                                    ? "Malayalam (മലയാളം)"
                                                                                    : currentLanguage ===
                                                                                        "pa"
                                                                                        ? "Punjabi (ਪੰਜਾਬੀ)"
                                                                                        : currentLanguage ===
                                                                                            "or"
                                                                                            ? "Odia (ଓଡ଼ିଆ)"
                                                                                            : currentLanguage ===
                                                                                                "as"
                                                                                                ? "Assamese (অসমীয়া)"
                                                                                                : currentLanguage ===
                                                                                                    "ur"
                                                                                                    ? "Urdu (اردو)"
                                                                                                    : currentLanguage ===
                                                                                                        "ne"
                                                                                                        ? "Nepali (नेपाली)"
                                                                                                        : currentLanguage ===
                                                                                                            "si"
                                                                                                            ? "Sinhala (සිංහල)"
                                                                                                            : currentLanguage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {languageChangeSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-2">
                                        <svg
                                            className="w-5 h-5 text-green-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <p className="text-sm text-green-800 font-medium">
                                            {t("change_info_2")}!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentMenuOption === "download dpr" && (
                        <div className="space-y-4">
                            {currentPlan ? (
                                <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 rounded-2xl p-4 mb-4">
                                    <h4 className="font-medium text-gray-900 mb-3">
                                        {t("DPR Status")}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center">
                                            <div
                                                className={`w-3 h-3 rounded-full mr-2 ${currentPlan.is_dpr_generated ? "bg-green-500" : "bg-gray-300"}`}
                                            ></div>
                                            <span>
                                                {t("DPR Generated")}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <div
                                                className={`w-3 h-3 rounded-full mr-2 ${currentPlan.is_dpr_reviewed ? "bg-green-500" : "bg-gray-300"}`}
                                            ></div>
                                            <span>{t("DPR Reviewed")}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 rounded-2xl p-4 mb-4">
                                    <div className="text-center">
                                        <h4 className="font-medium text-red-600 mb-2">
                                            {t("Plan Selection Required")}
                                        </h4>
                                        <p className="text-red-600 text-sm">
                                            {t(
                                                "Please, select a plan first!",
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div
                                className="rounded-2xl p-4 mb-4"
                                style={{ backgroundColor: "#C9BACE" }}
                            >
                                <div className="flex items-start space-x-3 text-black">
                                    <svg
                                        className="w-6 h-6 mt-0.5 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM12 20h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1z" />
                                    </svg>
                                    <p className="text-sm leading-relaxed text-left">
                                        {t(
                                            "Enter your email to receive the DPR document.",
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Input Section */}
                            <div
                                className="rounded-2xl p-4 space-y-4"
                                style={{ border: "1px solid #592941" }}
                            >
                                <div className="relative">
                                    <label
                                        htmlFor="email-input"
                                        className="block text-sm font-bold text-gray-700 mb-2"
                                    >
                                        {t("Enter your email address")}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg
                                                className="h-5 w-5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                                />
                                            </svg>
                                        </div>
                                        <input
                                            id="email-input"
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            disabled={!currentPlan}
                                            className={`w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 ${!currentPlan
                                                    ? "bg-gray-100 cursor-not-allowed opacity-60"
                                                    : ""
                                                }`}
                                        />
                                    </div>
                                    {email &&
                                        !isValidEmail(email) &&
                                        currentPlan && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {t(
                                                    "Please enter a valid email address",
                                                )}
                                            </p>
                                        )}
                                </div>

                                {/* Download Button */}
                                <button
                                    onClick={handleDownloadDPR}
                                    disabled={
                                        !email ||
                                        !isValidEmail(email) ||
                                        !currentPlan
                                    }
                                    className="w-full py-3 px-4 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:transform-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor:
                                            email &&
                                                isValidEmail(email) &&
                                                currentPlan
                                                ? "#592941"
                                                : "#D6D5C9",
                                        color:
                                            email &&
                                                isValidEmail(email) &&
                                                currentPlan
                                                ? "#FFFFFF"
                                                : "#8B7355",
                                        boxShadow:
                                            email &&
                                                isValidEmail(email) &&
                                                currentPlan
                                                ? "0 4px 12px rgba(89, 41, 65, 0.3)"
                                                : "none",
                                    }}
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span>{t("Get pre-DPR")}</span>
                                    </div>
                                </button>
                            </div>

                            {currentPlan && (
                                <div
                                    className="rounded-2xl p-4"
                                    style={{ backgroundColor: "#C9BACE" }}
                                >
                                    <div className="flex items-start space-x-3 text-black">
                                        <svg
                                            className="w-6 h-6 mt-0.5 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM12 20h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1z" />
                                        </svg>
                                        <p className="text-sm leading-relaxed text-left">
                                            {t(
                                                "Enter your email to receive the DPR document.",
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Input Section */}
                                <div
                                    className="rounded-2xl p-4 space-y-4"
                                    style={{ border: "1px solid #592941" }}
                                >
                                    <div className="relative">
                                        <label
                                            htmlFor="email-input"
                                            className="block text-sm font-bold text-gray-700 mb-2"
                                        >
                                            {t("Enter your email address")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg
                                                    className="h-5 w-5 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                                    />
                                                </svg>
                                            </div>
                                            <input
                                                id="email-input"
                                                type="email"
                                                placeholder="your.email@example.com"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                disabled={!currentPlan}
                                                className={`w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 ${!currentPlan
                                                    ? "bg-gray-100 cursor-not-allowed opacity-60"
                                                    : ""
                                                    }`}
                                            />
                                        </div>
                                        {email &&
                                            !isValidEmail(email) &&
                                            currentPlan && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {t(
                                                        "Document will be sent to your email",
                                                    )}
                                                </li>
                                                <li>
                                                    •{" "}
                                                    {t(
                                                        "Processing may take 5 to 10 minutes",
                                                    )}
                                                </li>
                                                <li>
                                                    •{" "}
                                                    {t(
                                                        "Check spam folder if not received",
                                                    )}
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentMenuOption === "upload kml" && (
                        <div className="space-y-4">
                            {/* Header Section */}
                            <div className="text-center space-y-2">
                                <p className="text-sm text-gray-600">
                                    Select a KML file to upload and process
                                </p>
                            </div>

                            {/* Upload Section */}
                            <div className="space-y-4">
                                {/* File Upload Area */}
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".kml"
                                        onChange={handleUploadKML}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        id="kml-upload"
                                    />
                                    <label
                                        htmlFor="kml-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-green-400 transition-all duration-200"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg
                                                className="w-8 h-8 mb-2 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            <p className="mb-1 text-sm text-gray-600 font-medium">
                                                <span className="text-green-600">
                                                    Click to upload
                                                </span>{" "}
                                                or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                KML files only
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {/* File Status */}
                                {selectedFile && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="w-5 h-5 text-green-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-green-800 truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {(
                                                        selectedFile.size /
                                                        1024
                                                    ).toFixed(1)}{" "}
                                                    KB • Ready to process
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setSelectedFile(null)
                                                }
                                                className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Upload Progress */}
                                {uploadProgress > 0 &&
                                    uploadProgress < 100 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Uploading...</span>
                                                <span>
                                                    {uploadProgress}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${uploadProgress}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                {/* Process Button */}
                                {selectedFile &&
                                    !uploadProgress &&
                                    !uploadSuccess && (
                                        <button
                                            onClick={handleProcessKML}
                                            disabled={isUploading}
                                            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            <div className="flex items-center justify-center space-x-2">
                                                {isUploading ? (
                                                    <>
                                                        <SquircleLoader
                                                            size={20}
                                                            strokeWidth={2}
                                                            color="#ffffff"
                                                            backgroundColor="rgba(255, 255, 255, 0.3)"
                                                            speed={1500}
                                                        />
                                                        <span>
                                                            Uploading...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={
                                                                    2
                                                                }
                                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                            />
                                                        </svg>
                                                        <span>
                                                            Upload KML File
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    )}

                                {/* Success State */}
                                {uploadSuccess && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="w-6 h-6 text-green-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-green-800">
                                                    Upload Successful!
                                                </h4>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Your KML file has been
                                                    processed successfully.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleReset}
                                            className="mt-3 w-full py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                                        >
                                            Upload Another File
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                className="rounded-2xl p-4"
                                style={{ backgroundColor: "#C9BACE" }}
                            >
                                <div className="flex items-start space-x-3 text-black">
                                    <svg
                                        className="w-6 h-6 mt-0.5 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM12 20h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1z" />
                                    </svg>
                                    <div className="text-sm">
                                        <p className="font-medium mb-2 text-left">
                                            File Requirements:
                                        </p>
                                        <ul className="space-y-1 text-left">
                                            <li>
                                                • Only .kml files are
                                                supported
                                            </li>
                                            <li>
                                                • Maximum file size: 10MB
                                            </li>
                                            <li>
                                                • File will be processed
                                                automatically
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Error State */}
                            {uploadError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-2">
                                        <svg
                                            className="w-5 h-5 text-red-600 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <p className="text-sm text-red-800">
                                            {uploadError}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : isHome ? (
                <div className="text-gray-800 text-sm space-y-6">
                    {/* Steps Section */}
                    <div>
                        <h3 className="font-semibold mb-2">
                            {t("Steps")}
                        </h3>
                        <ol className="space-y-3">
                            {[
                                t("info_main_1"),
                                t("info_main_2"),
                                t("info_main_3"),
                            ].map((item, index) => (
                                <li
                                    key={index}
                                    className="flex items-start"
                                >
                                    <div className="bg-blue-500 text-white rounded-full min-w-6 w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                                        <span className="text-sm font-medium">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <span className="pt-0.5">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    {/* Screens Information Section */}
                    <div>
                        <h3 className="font-bold underline mb-2">
                            {t("Groundwater")}
                        </h3>
                        <p>{t("info_main_4")}</p>
                    </div>
                    <div>
                        <h3 className="font-bold underline mb-2">
                            {t("Surface Waterbodies")}
                        </h3>
                        <p>{t("info_main_5")}</p>
                    </div>
                    <div>
                        <h3 className="font-bold underline mb-2">
                            {t("Agriculture")}
                        </h3>
                        <p>{t("info_main_6")}</p>
                    </div>
                    <div>
                        <h3 className="font-bold underline mb-2">
                            {t("Livelihood")}
                        </h3>
                        <p>{t("info_main_7")}</p>
                    </div>
                </div>
            ) : (
                <div className="text-gray-800 text-sm">
                    {screenContent[currentScreen] || (
                        <p>
                            No additional information available for this
                            screen.
                        </p>
                    )}
                </div>
            )}
        </div>
    </div>
</div>
    );
};

export default InfoBox;
