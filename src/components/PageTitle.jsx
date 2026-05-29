import useMainStore from "../store/MainStore";
import { useTranslation } from "react-i18next";

const SCREEN_CONFIG = {
    Resource_mapping: {
        root: "Resource Mapping",
        steps: (step, { settlementName }) => {
            const labels = [null, "Well", "Water Structure", "Cropping Pattern"];
            if (step > 0 && labels[step]) {
                return { parent: settlementName || "Resource Mapping", child: labels[step] };
            }
            return null;
        },
    },
    Groundwater: {
        root: "Water Balance",
        steps: (step) => {
            const labels = [null, "Maintenance", "Recharge Structure"];
            return step > 0 && labels[step] ? { parent: "Water Balance", child: labels[step] } : null;
        },
    },
    Agriculture: {
        root: "Agriculture",
        steps: (step) => {
            return step > 0 ? { parent: "Agriculture", child: "Planning" } : null;
        },
    },
    SurfaceWater: { root: "Surface Waterbodies", steps: () => null },
    Livelihood:   { root: "Livelihood",           steps: () => null },
    Agrohorticulture: { root: "Agrohorticulture", steps: () => null },
    HomeScreen:   { root: null,                   steps: () => null },
};

const PageTitle = () => {
    const { t } = useTranslation();
    const currentScreen  = useMainStore((s) => s.currentScreen);
    const currentStep    = useMainStore((s) => s.currentStep);
    const settlementName = useMainStore((s) => s.settlementName);

    const config = SCREEN_CONFIG[currentScreen];
    if (!config || !config.root) return null;

    const crumb = config.steps(currentStep, { settlementName });

    return (
        <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
            <div className="relative w-full max-w-lg mx-auto flex items-center">
                <div className="flex-1 px-4 py-2.5 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-md">
                    {crumb ? (
                        <span className="flex items-center justify-center gap-1.5 text-sm">
                            <span className="text-white/55 font-medium truncate max-w-[120px]">
                                {t(crumb.parent)}
                            </span>
                            <span className="text-white/30">›</span>
                            <span className="text-white font-bold">
                                {t(crumb.child)}
                            </span>
                        </span>
                    ) : (
                        <span className="text-white font-extrabold text-md">
                            {t(config.root)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageTitle;
