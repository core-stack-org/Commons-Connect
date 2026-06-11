import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useMainStore from "../store/MainStore.jsx";

const RESOURCE_OPTIONS = [
    { key: "settlement", label: "Settlement",       layerName: "settlement_layer", resourceType: "settlement" },
    { key: "well",       label: "Well",             layerName: "well_layer",       resourceType: "well" },
    { key: "water",      label: "Water Structures", layerName: "waterbody_layer",  resourceType: "waterbody" },
    { key: "crop",       label: "Cropping Pattern", layerName: "cropping_layer",   resourceType: "cropping" },
];

const WORK_OPTIONS = [
    { key: "groundwater",      label: "Recharge Structure",  workType: "plan_gw" },
    { key: "agriculture",      label: "Irrigation Structure", workType: "plan_agri" },
    { key: "livelihood",       label: "Livelihood",           workType: "livelihood" },
    { key: "agrohorticulture", label: "Agrohorticulture",     workType: "agrohorticulture", layerName: "agrohorticulture" },
];

const MAINTENANCE_OPTIONS = [
    { key: "maintain_gw",     label: "Recharge Structure",          workType: "main_gw" },
    { key: "maintain_swb",    label: "Surface Water Bodies",        workType: "main_swb" },
    { key: "maintain_swb_rs", label: "Surface Water Bodies (RS)",   workType: "main_swb_rs" },
    { key: "maintain_agri",   label: "Irrigation Structure",        workType: "main_agri" },
];

const Checkbox = ({ checked }) => (
    <div
        className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
        style={{
            backgroundColor: checked ? "rgba(34, 197, 94, 0.85)" : "transparent",
            borderColor: checked ? "rgba(34, 197, 94, 0.9)" : "rgba(255,255,255,0.35)",
        }}
    >
        {checked && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )}
    </div>
);

const SelectableRow = ({ label, checked, onToggle }) => (
    <div
        className="flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all"
        style={{
            backgroundColor: checked ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.07)",
            borderColor: checked ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.12)",
        }}
        onClick={onToggle}
    >
        <Checkbox checked={checked} />
        <span className="text-sm text-white/80">{label}</span>
    </div>
);

const SectionDivider = () => (
    <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/15" />
    </div>
);

const SyncDataModal = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);

    const [selectedResources, setSelectedResources] = useState({});
    const [selectedWorks, setSelectedWorks] = useState({});
    const [selectedMaintenance, setSelectedMaintenance] = useState({});
    const [isSyncing, setIsSyncing] = useState(false);

    const toggleResource = (key) =>
        setSelectedResources((prev) => ({ ...prev, [key]: !prev[key] }));

    const toggleWork = (key) =>
        setSelectedWorks((prev) => ({ ...prev, [key]: !prev[key] }));

    const toggleMaintenance = (key) =>
        setSelectedMaintenance((prev) => ({ ...prev, [key]: !prev[key] }));

    const hasSelection =
        Object.values(selectedResources).some(Boolean) ||
        Object.values(selectedWorks).some(Boolean) ||
        Object.values(selectedMaintenance).some(Boolean);

    const syncOne = async (url, payload) => {
        try {
            console.log("[sync] POST", url, JSON.stringify(payload));
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            console.log("[sync] HTTP status:", res.status);
            const data = await res.json();
            console.log("[sync] response body:", JSON.stringify(data));
            return data.status === "success" ? (data.data ?? data) : null;
        } catch (err) {
            console.error("[sync] fetch/parse error:", err);
            return null;
        }
    };

    const handleSync = async () => {
        if (!MainStore.currentPlan) {
            toast.error(t("No plan selected. Please select a plan first."));
            return;
        }

        setIsSyncing(true);
        const basePayload = {
            plan_id: String(MainStore.currentPlan.plan_id),
            plan_name: MainStore.currentPlan.plan,
            district_name: MainStore.districtName,
            block_name: MainStore.blockName,
        };

        const resourceUrl = `${import.meta.env.VITE_API_URL}add_resources/`;
        const workUrl = `${import.meta.env.VITE_API_URL}add_works/`;

        const tasks = [
            ...RESOURCE_OPTIONS
                .filter((opt) => selectedResources[opt.key])
                .map((opt) => ({
                    label: opt.label,
                    url: resourceUrl,
                    payload: { ...basePayload, layer_name: opt.layerName, resource_type: opt.resourceType },
                })),
            ...WORK_OPTIONS
                .filter((opt) => selectedWorks[opt.key])
                .map((opt) => ({
                    label: opt.label,
                    url: workUrl,
                    payload: { ...basePayload, layer_name: opt.layerName ?? "planning_layer", work_type: opt.workType },
                })),
            ...MAINTENANCE_OPTIONS
                .filter((opt) => selectedMaintenance[opt.key])
                .map((opt) => ({
                    label: opt.label,
                    url: workUrl,
                    payload: { ...basePayload, layer_name: opt.layerName ?? "planning_layer", work_type: opt.workType },
                })),
        ];

        let successCount = 0;
        let failCount = 0;
        let totalRecords = 0;

        for (const task of tasks) {
            const data = await syncOne(task.url, task.payload);
            if (data) {
                successCount++;
                totalRecords += data.record_count ?? 0;
                const count = data.record_count !== undefined ? ` · ${data.record_count} ${t("record(s)")}` : "";
                toast.success(`${t(task.label)}${count}`);
            } else {
                failCount++;
                toast.error(`${t("Sync failed for")} ${t(task.label)}`);
            }
        }

        setIsSyncing(false);

        if (successCount > 0) {
            MainStore.setIsSubmissionSuccess(true);
            if (tasks.length > 1) {
                toast.success(
                    failCount === 0
                        ? `${successCount} ${t("synced")} · ${totalRecords} ${t("record(s)")}`
                        : `${successCount} ${t("synced")}, ${failCount} ${t("failed")}`,
                );
            }
        }

        if (successCount > 0 || failCount > 0) {
            MainStore.setIsSyncModalOpen(false);
            setSelectedResources({});
            setSelectedWorks({});
            setSelectedMaintenance({});
        }
    };

    if (!MainStore.isSyncModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => MainStore.setIsSyncModalOpen(false)}
            />
            <div
                className="relative bg-white/5 backdrop-blur-2xl border border-white/15 rounded-3xl w-full mx-4 max-w-sm z-10 flex flex-col"
                style={{
                    maxHeight: "85dvh",
                    animation: "modalExpand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                }}
            >
                <style>{`
                    @keyframes modalExpand {
                        0%   { opacity: 0; transform: scale(0.92); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                {/* Fixed header */}
                <div className="px-5 pt-5 pb-3 flex-shrink-0">
                    <p className="text-white/90 text-base font-medium leading-snug">
                        {t("Select data to sync from ODK")}
                    </p>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 px-5 pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                        {t("Resources")}
                    </p>
                    <div className="space-y-1.5 mb-3">
                        {RESOURCE_OPTIONS.map((opt) => (
                            <SelectableRow
                                key={opt.key}
                                label={t(opt.label)}
                                checked={!!selectedResources[opt.key]}
                                onToggle={() => toggleResource(opt.key)}
                            />
                        ))}
                    </div>

                    <SectionDivider />

                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2 mt-2">
                        {t("Planning")}
                    </p>
                    <div className="space-y-1.5 mb-3">
                        {WORK_OPTIONS.map((opt) => (
                            <SelectableRow
                                key={opt.key}
                                label={t(opt.label)}
                                checked={!!selectedWorks[opt.key]}
                                onToggle={() => toggleWork(opt.key)}
                            />
                        ))}
                    </div>

                    <SectionDivider />

                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2 mt-2">
                        {t("Maintenance")}
                    </p>
                    <div className="space-y-1.5 mb-2">
                        {MAINTENANCE_OPTIONS.map((opt) => (
                            <SelectableRow
                                key={opt.key}
                                label={t(opt.label)}
                                checked={!!selectedMaintenance[opt.key]}
                                onToggle={() => toggleMaintenance(opt.key)}
                            />
                        ))}
                    </div>
                </div>

                {/* Fixed footer buttons */}
                <div className="px-5 pt-3 pb-5 flex-shrink-0 flex gap-2 border-t border-white/10">
                    <button
                        className="flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-all active:opacity-80"
                        style={{
                            backgroundColor: "rgba(255,255,255,0.07)",
                            borderColor: "rgba(255,255,255,0.18)",
                            color: "rgba(255,255,255,0.85)",
                        }}
                        onClick={() => {
                            MainStore.setIsSyncModalOpen(false);
                            setSelectedResources({});
                            setSelectedWorks({});
                            setSelectedMaintenance({});
                        }}
                    >
                        {t("Cancel")}
                    </button>

                    <button
                        className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-opacity active:opacity-80 flex items-center justify-center gap-2 disabled:opacity-40"
                        style={{ backgroundColor: "#592941", color: "#ffffff" }}
                        disabled={!hasSelection || isSyncing}
                        onClick={handleSync}
                    >
                        {isSyncing ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                                </svg>
                                {t("Syncing…")}
                            </>
                        ) : (
                            t("Sync Now")
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncDataModal;
