import { useEffect, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useTranslation } from "react-i18next";
import Floater from "../components/Floater.jsx";
import SquircleLoader from "../components/SquircleLoader.jsx";
import PageTitle from "../components/PageTitle.jsx";
import toast from "react-hot-toast";
import MapControls from "../components/MapControls.jsx";
import StepBar from "../components/ui/StepBar.jsx";

// Steps 1–3 of resource mapping; step 0 is placing the settlement.
const RESOURCE_STEPS = {
    1: { key: "well", resourceType: "Well", info: "Well Info", action: "Add Well" },
    2: { key: "water", resourceType: "Waterbody", info: "Water Structure Info", action: "Add Water Structure" },
    3: { key: "crop", resourceType: "Cropping", info: "Cropping Pattern Info", action: "Provide Crop Info" },
};

const ResourceMapping = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const navigate = useNavigate();
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [checkedItems, setCheckedItems] = useState({});
    // Resources submitted for the current settlement — pre-ticks the Finish checklist.
    const [submittedItems, setSubmittedItems] = useState({});

    const STATE_MACHINE = {
        1: {
            Screen: "add_settlement",
        },
        2: {
            Screen: "add_well",
        },
        3: {
            Screen: "add_waterbodies",
        },
        4: {
            Screen: "add_crop",
        },
    };

    useEffect(() => {
        toast(t("add_settlement_toast"));
    }, []);

    useEffect(() => {
        const key = RESOURCE_STEPS[MainStore.currentStep]?.key;
        if (MainStore.isSubmissionSuccess && key) {
            setSubmittedItems((prev) => ({ ...prev, [key]: true }));
        }
    }, [MainStore.isSubmissionSuccess]);

    useEffect(() => {
        const handleBackButton = () => {
            let BACK = MainStore.currentStep - 1;

            if (MainStore.currentStep) {
                MainStore.setCurrentStep(BACK);
            }
        };

        if (MainStore.currentStep > 0) {
            const screen = STATE_MACHINE[MainStore.currentStep].Screen;
            if (window.location.hash !== `#${screen}`) {
                window.history.pushState(null, "", `#${screen}`);
            }
        }

        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [MainStore.currentStep]);

    const toggleFormsUrl = () => {
        let gpsCoords = MainStore.gpsLocation;

        if (gpsCoords === null) {
            try {
                navigator.geolocation.getCurrentPosition(
                    ({ coords }) => {
                        gpsCoords = [coords.longitude, coords.latitude];
                    },
                    (err) => {
                        console.log("In first err : ", err);
                    },
                );
                if (gpsCoords === null) {
                    throw new Error("User object missing");
                }
            } catch (e) {
                console.log("In the catch ");
            }
            MainStore.setGpsLocation(gpsCoords);
        }

        if (MainStore.markerCoords) {
            MainStore.setIsForm(true);

            MainStore.setFormUrl(
                getOdkUrlForScreen(
                    MainStore.currentScreen,
                    MainStore.currentStep,
                    MainStore.markerCoords,
                    MainStore.settlementName,
                    "",
                    MainStore.blockName,
                    MainStore.currentPlan?.plan_id || MainStore.currentPlan?.id,
                    MainStore.currentPlan?.plan || "Unknown Plan",
                    MainStore.selectedResource?.id,
                    false,
                    gpsCoords,
                ),
            );

            MainStore.setIsOpen(true);
        }
    };

    const handleAnalyze = () => {
        MainStore.setIsResourceOpen(true);
        MainStore.setIsOpen(true);
    };

    const goToStep = (step) => {
        MainStore.setCurrentStep(step);
        MainStore.setFeatureStat(false);
    };

    const openFinishConfirm = () => {
        setCheckedItems(submittedItems);
        setShowFinishConfirm(true);
    };

    const step = MainStore.currentStep;
    const stepConfig = RESOURCE_STEPS[step];
    const canAdd = MainStore.isMarkerPlaced && !MainStore.isFeatureClicked;

    const getHint = () => {
        if (step === 0) {
            return !MainStore.isMarkerPlaced ? t("hint_place_settlement") : null;
        }
        if (MainStore.isFeatureClicked) return t("hint_existing_selected");
        if (!MainStore.isMarkerPlaced) return t("hint_place_pin");
        return null;
    };

    return (
        <>
            {/* Loader overlay */}
            {MainStore.isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <SquircleLoader
                        size={48}
                        strokeWidth={4}
                        color="#ffffff"
                        backgroundColor="rgba(255, 255, 255, 0.3)"
                        speed={1500}
                    />
                </div>
            )}

            {/* Title Bubble */}
            <PageTitle />

            {/* Top-left controls, with the pin floater under the plan chip */}
            <MapControls showNrega={false}>
                <Floater />
            </MapControls>

            {/* MARK: Bottom Controls */}
            {step === 0 && !MainStore.isFeatureClicked && (
                <StepBar
                    hint={getHint()}
                    back={{ label: t("Back"), onClick: () => navigate("/maps") }}
                    main={{
                        label: t("Add Settlement"),
                        onClick: toggleFormsUrl,
                        disabled: !MainStore.isMarkerPlaced,
                    }}
                />
            )}

            {step === 0 && MainStore.isMarkerPlaced && MainStore.isFeatureClicked && (
                <StepBar
                    top={[
                        { label: t("Settlement Info"), onClick: handleAnalyze },
                    ]}
                    back={{ label: t("Back"), onClick: () => navigate("/maps") }}
                    main={{
                        label: t("Mark Resources"),
                        onClick: () => {
                            MainStore.setCurrentStep(1);
                            MainStore.setIsResource(false);
                        },
                    }}
                />
            )}

            {stepConfig && (
                <StepBar
                    hint={getHint()}
                    top={[
                        {
                            label: t(stepConfig.info),
                            onClick: handleAnalyze,
                            hidden: !(
                                MainStore.isFeatureClicked &&
                                MainStore.resourceType === stepConfig.resourceType
                            ),
                        },
                    ]}
                    back={{ label: t("Back"), onClick: () => goToStep(step - 1) }}
                    main={{
                        label: t(stepConfig.action),
                        onClick: toggleFormsUrl,
                        disabled: !canAdd,
                    }}
                    next={
                        RESOURCE_STEPS[step + 1]
                            ? { label: t("Next"), onClick: () => goToStep(step + 1) }
                            : { label: t("Finish"), onClick: openFinishConfirm }
                    }
                />
            )}

            {showFinishConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowFinishConfirm(false)}
                    />
                    <div
                        className="relative bg-white/5 backdrop-blur-2xl border border-white/15 rounded-3xl w-full mx-4 max-w-sm p-6 z-10"
                        style={{
                            animation: "modalExpand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                        }}
                    >
                        <style>{`
                            @keyframes modalExpand {
                                0% { opacity: 0; transform: scale(0.92); }
                                100% { opacity: 1; transform: scale(1); }
                            }
                        `}</style>

                        <p className="text-white/90 text-base font-medium mb-5 leading-snug">
                            {t("Have you added the resources for the")}{" "}
                            <span className="text-amber-300 font-semibold">
                                {MainStore.settlementName || t("Settlement")}
                            </span>
                            {"?"}
                        </p>

                        <div className="space-y-2 mb-6">
                            {[
                                { key: "well", label: t("Well") },
                                { key: "water", label: t("Water Structure") },
                                { key: "crop", label: t("Cropping Pattern") },
                            ].map(({ key, label }) => (
                                <div
                                    key={key}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border cursor-pointer transition-all"
                                    style={{
                                        backgroundColor: checkedItems[key]
                                            ? "rgba(34, 197, 94, 0.15)"
                                            : "rgba(255,255,255,0.07)",
                                        borderColor: checkedItems[key]
                                            ? "rgba(34, 197, 94, 0.4)"
                                            : "rgba(255,255,255,0.12)",
                                    }}
                                    onClick={() =>
                                        setCheckedItems((prev) => ({
                                            ...prev,
                                            [key]: !prev[key],
                                        }))
                                    }
                                >
                                    <div
                                        className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
                                        style={{
                                            backgroundColor: checkedItems[key]
                                                ? "rgba(34, 197, 94, 0.85)"
                                                : "transparent",
                                            borderColor: checkedItems[key]
                                                ? "rgba(34, 197, 94, 0.9)"
                                                : "rgba(255,255,255,0.35)",
                                        }}
                                    >
                                        {checkedItems[key] && (
                                            <svg
                                                className="w-3 h-3 text-white"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            >
                                                <path
                                                    d="M20 6L9 17l-5-5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm text-white/80">{label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-px bg-white/15" />
                        </div>

                        <button
                            className="w-full py-3 rounded-2xl text-sm font-medium border transition-all active:opacity-80 mb-3"
                            style={{
                                backgroundColor: "rgba(255,255,255,0.07)",
                                borderColor: "rgba(255,255,255,0.18)",
                                color: "rgba(255,255,255,0.85)",
                            }}
                            onClick={() => {
                                setShowFinishConfirm(false);
                                setCheckedItems({});
                                MainStore.setCurrentStep(1);
                                MainStore.setMarkerPlaced(false);
                                MainStore.setMarkerCoords(null);
                                MainStore.setFeatureStat(false);
                            }}
                        >
                            {t("Keep Adding for")}{" "}
                            {MainStore.settlementName || t("Settlement")}
                        </button>

                        <button
                            className="w-full py-3 rounded-2xl text-sm font-medium border transition-all active:opacity-80 mb-3"
                            style={{
                                backgroundColor: "rgba(255,255,255,0.07)",
                                borderColor: "rgba(255,255,255,0.18)",
                                color: "rgba(255,255,255,0.85)",
                            }}
                            onClick={() => {
                                setShowFinishConfirm(false);
                                setCheckedItems({});
                                setSubmittedItems({});
                                MainStore.setCurrentStep(0);
                                MainStore.setSettlementName("");
                                MainStore.setMarkerPlaced(false);
                                MainStore.setMarkerCoords(null);
                                MainStore.setFeatureStat(false);
                            }}
                        >
                            {t("Add Another Settlement")}
                        </button>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-px bg-white/15" />
                        </div>

                        <button
                            className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity active:opacity-80"
                            style={{ backgroundColor: "#592941", color: "#ffffff" }}
                            onClick={() => {
                                setShowFinishConfirm(false);
                                navigate("/maps");
                            }}
                        >
                            {t("Finish Resource Mapping")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ResourceMapping;
