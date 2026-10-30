import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Floater from "../components/Floater.jsx";
import MapControls from "../components/MapControls.jsx";
import StepBar from "../components/ui/StepBar.jsx";

const Livelihood = () => {
    const MainStore = useMainStore((state) => state);
    const navigate = useNavigate();
    const { t } = useTranslation();

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
                    MainStore.currentPlan.plan_id,
                    MainStore.currentPlan.plan,
                    MainStore.selectedResource?.id,
                    false,
                    gpsCoords,
                ),
            );

            MainStore.setIsOpen(true);
        }
    };

    const handleAnalyze = () => {
        MainStore.setIsOpen(true);
    };

    return (
        <>
            <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
                <div className="relative w-full max-w-lg mx-auto flex items-center">
                    <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
                        {t("Livelihood")}
                    </div>
                </div>
            </div>

            {/* Top-left controls, with the pin floater under the plan chip */}
            <MapControls>
                <Floater />
            </MapControls>

            {/* Bottom Controls */}
            {MainStore.currentStep === 0 && (
                <StepBar
                    hint={!MainStore.isMarkerPlaced ? t("hint_place_pin") : null}
                    top={[
                        {
                            label: t("Asset Info"),
                            onClick: handleAnalyze,
                            disabled: !MainStore.isFeatureClicked,
                        },
                    ]}
                    back={{ label: t("Back"), onClick: () => navigate("/maps") }}
                    main={{
                        label: t("Mark Livelihood"),
                        onClick: toggleFormsUrl,
                        disabled: !MainStore.isMarkerPlaced,
                    }}
                />
            )}
        </>
    );
};

export default Livelihood;
