import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import useMainStore from "../store/MainStore.jsx";
import useLayersStore from "../store/LayerStore.jsx";

import nregaDetails from "../assets/nregaMapping.json";
import resourceDetails from "../assets/resource_mapping.json";
import SurfaceWaterBodies from "./analyze/SurfaceWaterbodyAnalyze.jsx";
import GroundwaterAnalyze from "./analyze/GroundwaterAnalyze.jsx";
import AgricultureAnalyze from "./analyze/AgricultureAnalyze.jsx";
import SiteAnalysis from "./analyze/SiteAnalysis.jsx";
import SiteSuitabilityAnalysis from "./analyze/SiteSuitabilityAnalysis.jsx";
import { useTranslation } from "react-i18next";

import { looksBroken, fixMojibake } from "../action/getEncoding.js";
import SquircleLoader from "./SquircleLoader.jsx";

const Bottomsheet = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const LayerStore = useLayersStore((state) => state);
    const [isSyncing, setIsSyncing] = useState(false);
    const LayerNameMapping = {
        0: "settlement_layer",
        1: "well_layer",
        2: "waterbody_layer",
        3: "cropping_layer",
    };

    const ResourceMapping = {
        0: "settlement",
        1: "well",
        2: "waterbody",
        3: "cropping",
    };

    const PlanningResource = {
        Agriculture: "plan_agri",
        Groundwater: "plan_gw",
        Livelihood: "livelihood",
    };

    const LayerStoreKeysGW = [
        "AdminBoundary",
        "NregaLayer",
        "WellDepth",
        "DrainageLayer",
        "SettlementLayer",
        "WellLayer",
        "WaterStructure",
        "WorkGroundwater",
        "CLARTLayer",
    ];

    const LayerStoreKeysAgri = [
        "AdminBoundary",
        "NregaLayer",
        "DrainageLayer",
        "SettlementLayer",
        "WellLayer",
        "WaterStructure",
        "WorkAgri",
        "CLARTLayer",
        "LULCLayer",
    ];

    const ResourceMetaKeys = {
        Bail: "Livestock Census : Ox (बैल)",
        Cattle: "Livestock Census : Cattle",
        Goats: "Livestock Census : Goats",
        Piggery: "Livestock Census : Piggery",
        Poultry: "Livestock Census : Poultry",
        Sheep: "Livestock Census : Sheep",
        big_farmers: "Farmer Census : Big Farmers",
        landless_farmers: "Farmer Census : Landless Farmers",
        marginal_farmers: "Farmer Census : Marginal Farmers",
        medium_farmers: "Farmer Census : Medium Farmers",
        small_farmers: "Farmer Census : Small Farmers",
        NREGA_applied: "Households that have applied for NREGA Job cards",
        NREGA_have_job_card: "Households that have NREGA job cards",

        select_one_Functional_Non_functional: "Functional or not ?",
        select_one_well_used: "Used for Irrigation or Drinking ?",
        select_one_well_used_other: "Other usage",
        select_one_change_water_quality: "Water Quality",
        select_one_water_structure_near_you:
            "Any rainwater harvesting or groundwater recharge structures near your wells ?",
        select_one_maintenance: "Requires Maintainence",
        select_one_repairs_well: "Type of Repair (if Maintainence required)",
        select_one_repairs_well_other: "Other type of Repair",
    };

    const layerStoreNameMapping = {
        AdminBoundary: "Admin Boundary",
        NregaLayer: "NREGA Layer",
        WellDepth: "Well Depth",
        DrainageLayer: "Drainage Layer",
        SettlementLayer: "Settlement Layer",
        WellLayer: "Well Layer",
        WaterStructure: "Water Structures",
        WorkAgri: "Irrigation Structures",
        WorkGroundwater: "Recharge Structures",
        Livelihood: "Livelihood",
        CLARTLayer: "CLART Layer",
        LULCLayer: "LULC Layer",
    };

    const layerStoreFuncMapping = {
        AdminBoundary: "setAdminBoundary",
        NregaLayer: "setNregaLayer",
        WellDepth: "setWellDepth",
        DrainageLayer: "setDrainageLayer",
        SettlementLayer: "setSettlementLayer",
        WellLayer: "setWellLayer",
        WaterStructure: "setWaterStructure",
        WorkAgri: "setWorkAgri",
        WorkGroundwater: "setWorkGroundwater",
        Livelihood: "setLivelihood",
        CLARTLayer: "setCLARTLayer",
        LULCLayer: "setLULCLayer",
    };

    const pollTimerRef = useRef(null);
    const syncDoneRef = useRef(false);

    const POLL_DELAYS_MS = [45000, 15000, 15000, 15000, 15000, 15000];

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    const syncFormSubmission = async (silent = false) => {
        if (syncDoneRef.current) return true;
        try {
            if (!silent) MainStore.setIsLoading(true);

            const isResource = MainStore.currentScreen === "Resource_mapping";
            const url = isResource
                ? `${import.meta.env.VITE_API_URL}add_resources/`
                : `${import.meta.env.VITE_API_URL}add_works/`;

            const payload = isResource
                ? {
                    layer_name: LayerNameMapping[MainStore.currentStep],
                    resource_type: ResourceMapping[MainStore.currentStep],
                    plan_id: MainStore.currentPlan.plan_id,
                    plan_name: MainStore.currentPlan.plan,
                    district_name: MainStore.districtName,
                    block_name: MainStore.blockName,
                }
                : {
                    layer_name: "planning_layer",
                    work_type: PlanningResource[MainStore.currentScreen],
                    plan_id: MainStore.currentPlan.plan_id,
                    plan_name: MainStore.currentPlan.plan,
                    district_name: MainStore.districtName,
                    block_name: MainStore.blockName,
                };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const res = await response.json();
            if (!silent) MainStore.setIsLoading(false);

            if (res.message === "Success") {
                syncDoneRef.current = true;
                MainStore.setIsSubmissionSuccess(true);
                stopPolling();
                return true;
            }
            return false;
        } catch (err) {
            console.log(err);
            if (!silent) MainStore.setIsLoading(false);
            return false;
        }
    };

    useEffect(() => {
        if (MainStore.isForm && MainStore.formUrl) {
            syncDoneRef.current = false;
            let attempt = 0;

            const poll = async () => {
                if (syncDoneRef.current || attempt >= POLL_DELAYS_MS.length) return;
                const success = await syncFormSubmission(true);
                if (success) return;
                attempt++;
                if (attempt < POLL_DELAYS_MS.length) {
                    pollTimerRef.current = setTimeout(poll, POLL_DELAYS_MS[attempt]);
                }
            };

            pollTimerRef.current = setTimeout(poll, POLL_DELAYS_MS[0]);
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [MainStore.isForm, MainStore.formUrl]);

    const getCategoryFillColor = (works) => {
        if (works.length === 0) return "#00000000";
        const expr = ["match", ["get", "itemColor"]];
        works.forEach((id) => {
            expr.push(id);
            expr.push(nregaDetails.NumToColorMapping[id]);
        });
        expr.push("#00000000");
        return expr;
    };

    const buildNregaStyle = (works, years) => {
        let fillColor = getCategoryFillColor(works);

        if (years.length > 0) {
            const yearMatch = ["match", ["get", "workYear"]];
            years.forEach((y) => {
                yearMatch.push(y, true);
            });
            yearMatch.push(false);
            fillColor = ["case", yearMatch, fillColor, "#00000000"];
        }

        return {
            "shape-points": 12,
            "shape-radius": 8,
            "shape-fill-color": fillColor,
        };
    };

    const handleYearAdd = (tempYear) => {
        let active_years;

        if (tempYear === "all") {
            active_years = MainStore.selectNregaYears.length === MainStore.allNregaYears.length
                ? []
                : [...MainStore.allNregaYears];
        } else if (MainStore.selectNregaYears.includes(tempYear)) {
            active_years = MainStore.selectNregaYears.filter((year) => year !== tempYear);
        } else {
            active_years = [...MainStore.selectNregaYears, tempYear];
        }

        MainStore.setNregaYears(active_years);
        MainStore.setNregaStyle(buildNregaStyle(MainStore.nregaWorks, active_years));
    };

    const handleWorkdAdd = (work) => {
        const workNum = nregaDetails.workToNumMapping[work];
        const isSelected = MainStore.nregaWorks.includes(workNum);
        const tempWorks = isSelected
            ? MainStore.nregaWorks.filter((w) => w !== workNum)
            : [...MainStore.nregaWorks, workNum];

        MainStore.setNregaWorks(tempWorks);
        MainStore.setNregaStyle(buildNregaStyle(tempWorks, MainStore.selectNregaYears));
    };

    const nregaBody = (
        <>
            <div className="flex justify-center pt-6 pb-4">
                <span className="px-5 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold tracking-wide border border-green-100">
                    {t("NREGA Assets")}
                </span>
            </div>

            <div className="px-6 pb-8">
                {/* Enhanced Work Categories Section */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                        <h2 className="text-lg font-medium text-gray-700">
                            {t("NREGA Work Categories")}
                        </h2>
                    </div>

                    {/* Improved button grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {nregaDetails.works.map((item, idx) => {
                            const color = [
                                nregaDetails.buttonColorMapping[item],
                                nregaDetails.buttonColorMapping.Default,
                            ];
                            const isSelected = MainStore.nregaWorks.includes(
                                nregaDetails.workToNumMapping[item],
                            );
                            return (
                                <button
                                    key={idx}
                                    style={{
                                        backgroundColor: isSelected
                                            ? `rgba(${color[0].join(",")})`
                                            : "",
                                    }}
                                    className={`
                                        flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                                        ${isSelected
                                            ? "border-gray-400 shadow-md transform scale-[1.02]"
                                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                        }
                                        bg-white text-gray-700 font-medium text-sm text-left
                                        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                                    `}
                                    onClick={() => handleWorkdAdd(item)}
                                >
                                    <div className="flex items-center">
                                        {/* Color indicator dot */}
                                        <div
                                            className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                                            style={{
                                                backgroundColor: `rgba(${color[0].join(",")})`,
                                            }}
                                        ></div>
                                        <span className="leading-tight">
                                            {t(
                                                nregaDetails.properWorkNames[
                                                idx
                                                ],
                                            )}
                                        </span>
                                    </div>

                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <svg
                                            className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* NREGA Work Years Section */}
                {MainStore.allNregaYears.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-5 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                <div className="w-1 h-5 bg-green-500 rounded-full mr-3"></div>
                                <h2 className="text-base font-semibold text-gray-700">
                                    {t("NREGA Work Years")}
                                </h2>
                            </div>
                            <button
                                onClick={() => handleYearAdd("all")}
                                className={`
                                    text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200
                                    ${MainStore.selectNregaYears.length === MainStore.allNregaYears.length
                                        ? "bg-green-100 border-green-400 text-green-700"
                                        : "bg-white border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600"
                                    }
                                `}
                            >
                                {MainStore.selectNregaYears.length === MainStore.allNregaYears.length
                                    ? t("nrega_deselect_all")
                                    : t("nrega_select_all")}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                            {MainStore.selectNregaYears.length === 0
                                ? t("nrega_all_years_shown")
                                : t("nrega_year_filter_hint")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {MainStore.allNregaYears.map((year, idx) => {
                                const isChecked = MainStore.selectNregaYears.includes(year);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleYearAdd(year)}
                                        className={`
                                            px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200
                                            ${isChecked
                                                ? "bg-green-500 border-green-500 text-white shadow-sm"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
                                            }
                                        `}
                                    >
                                        {year}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    // Helper function to get value with underscore fallback
    const getMetadataValue = (obj, key) => {
        // Try the exact key first
        if (key in obj) {
            return obj[key];
        }
        
        // Try with underscores replaced by spaces
        const spaceVersion = key.replace(/_/g, " ");
        if (spaceVersion !== key && spaceVersion in obj) {
            return obj[spaceVersion];
        }
        
        // Try with spaces replaced by underscores
        const underscoreVersion = key.replace(/ /g, "_");
        if (underscoreVersion !== key && underscoreVersion in obj) {
            return obj[underscoreVersion];
        }
        
        return undefined;
    };

    const resourceHeroConfig = {
        Settlement: { id: "Settlement", name: "Settleme_1" },
        Well:       { id: "well_id",   name: "beneficiar" },
        Waterbody:  { id: "wb_id",     name: "beneficiar" },
        Livelihood: { id: "plan_id",   name: "plan_name"  },
        Recharge:   { id: "work_id",   name: "ben_settle" },
        Irrigation: { id: "plan_id",   name: "beneficiar" },
        Cropping:   { id: "sett_name", name: null         },
    };

    const metaDataBody = (() => {
        if (!MainStore.isMetadata || MainStore.metadata === null) return null;

        const mapping = nregaDetails.NameDisplayMapping;
        const metaHeroKeys = new Set(["Asset ID", "Asset Name", "Work Name", "lat", "lon"]);

        const idValue   = getMetadataValue(MainStore.metadata, "Asset ID");
        const assetName = getMetadataValue(MainStore.metadata, "Asset Name");
        const workName  = getMetadataValue(MainStore.metadata, "Work Name");
        const lat       = getMetadataValue(MainStore.metadata, "lat");
        const lon       = getMetadataValue(MainStore.metadata, "lon");

        const gridItems = Object.keys(mapping).flatMap((key) => {
            if (metaHeroKeys.has(key)) return [];
            const rawValue = getMetadataValue(MainStore.metadata, key);
            if (rawValue === null || rawValue === undefined || rawValue === "") return [];
            let value = rawValue;
            if (typeof value === "string" && looksBroken(value)) value = fixMojibake(value);
            if (key === "Material" || key === "Total_Expe") value = `₹${value}`;
            return [{ key, label: mapping[key], value: String(value) }];
        });

        return (
            <div className="min-h-full bg-gray-50 pb-8">
                <div className="flex justify-center pt-6 pb-4">
                    <span className="px-5 py-1.5 rounded-full bg-white text-slate-500 text-sm font-semibold tracking-wide border border-gray-200 shadow-sm">
                        {t("Asset Info")}
                    </span>
                </div>

                <div className="mx-4 mb-3 rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                        NREGA Asset
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="text-xl font-bold text-gray-900 flex-1">{idValue || "—"}</div>
                        {idValue && (
                            <button
                                onClick={() => navigator.clipboard?.writeText(String(idValue)).then(() => toast.success("Copied ✔︎"), () => toast.error("Failed ✖︎"))}
                                className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center transition-colors"
                                title="Copy ID"
                            >
                                <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Asset ID</div>
                    {(assetName || workName) && (
                        <div className="text-sm text-amber-700 mt-2 font-medium">{assetName || workName}</div>
                    )}
                    {(lat || lon) && (
                        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-500">
                                <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                {parseFloat(lat).toFixed(4)}, {parseFloat(lon).toFixed(4)}
                            </span>
                        </div>
                    )}
                </div>

                {gridItems.length > 0 && (
                    <div className="flex flex-col gap-2 px-4">
                        {gridItems.map(({ key, label, value }) => (
                            <div key={key} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 leading-tight">{label}</div>
                                <div className="text-sm text-gray-800 font-medium leading-snug break-words">{value}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    })();

    const resourceBody = (() => {
        if ((!MainStore.isResource && !MainStore.isResourceOpen) || MainStore.selectedResource === null) return null;

        const resourceType = MainStore.resourceType;
        const resource = MainStore.selectedResource;
        const mapping = resourceDetails[resourceType] || {};
        const heroConfig = resourceHeroConfig[resourceType] || {};

        const idKey   = heroConfig.id;
        const nameKey = heroConfig.name;
        const heroKeys = new Set([idKey, nameKey, "latitude", "longitude"].filter(Boolean));

        const idValue   = idKey   ? resource[idKey]   : null;
        const idLabel   = idKey   ? mapping[idKey]    : null;
        const nameValue = nameKey ? resource[nameKey] : null;

        const rawLat = resource.latitude ?? resource.lat;
        const rawLon = resource.longitude ?? resource.lon;
        const lat = rawLat ? parseFloat(rawLat).toFixed(4) : null;
        const lon = rawLon ? parseFloat(rawLon).toFixed(4) : null;

        const gridItems = Object.keys(mapping).flatMap((key) => {
            if (heroKeys.has(key)) return [];

            const label = mapping[key];
            const rawValue = resource[key];
            if (rawValue === null || rawValue === undefined || rawValue === "") return [];

            if (key === "Livestock_" || key === "farmer_fam" || key === "Well_condi") {
                try {
                    const data = new Function(`return (${rawValue.replace(/'/g, '"').replace(/\bNone\b/g, "null")})`)();
                    return Object.keys(data)
                        .filter(k => data[k] !== null && data[k] !== undefined && data[k] !== "")
                        .map(k => ({ key: k, label: ResourceMetaKeys[k] || k, value: String(data[k]) }));
                } catch { return []; }
            }

            if (key === "MNREGA_INF" || key === "Well_usage") {
                const searchKeys = [
                    "NREGA_applied", "NREGA_have_job_card",
                    "select_one_Functional_Non_functional", "select_one_well_used",
                    "select_one_change_water_quality", "select_one_water_structure_near_you",
                ];
                return searchKeys.flatMap((sk) => {
                    const match = rawValue.match(new RegExp(String.raw`['"]${sk}['"]\s*:\s*([^,}\n\r]+)`, "i"));
                    if (!match) return [];
                    let val = match[1].trim();
                    if (val === "None") return [];
                    if (/^['"]/.test(val)) val = val.replace(/^['"]|['"]$/g, "");
                    else if (/^\d+(\.\d+)?$/.test(val)) val = Number(val);
                    if (val === null || val === undefined || val === "") return [];
                    return [{ key: sk, label: ResourceMetaKeys[sk] || sk, value: String(val) }];
                });
            }

            return [{ key, label, value: String(rawValue) }];
        });

        return (
            <div className="min-h-full bg-gray-50 pb-8">
                <div className="flex justify-center pt-6 pb-4">
                    <span className="px-5 py-1.5 rounded-full bg-white text-slate-500 text-sm font-semibold tracking-wide border border-gray-200 shadow-sm">
                        {t("Resource Info")}
                    </span>
                </div>

                <div className="mx-4 mb-3 rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                        {resourceType}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="text-xl font-bold text-gray-900 flex-1">{idValue || "—"}</div>
                        {idValue && (
                            <button
                                onClick={() => navigator.clipboard?.writeText(String(idValue)).then(() => toast.success("Copied ✔︎"), () => toast.error("Failed ✖︎"))}
                                className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center transition-colors"
                                title="Copy ID"
                            >
                                <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                </svg>
                            </button>
                        )}
                    </div>
                    {idLabel && <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{idLabel}</div>}
                    {nameValue && (
                        <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                            </svg>
                            {nameValue}
                        </span>
                    )}
                    {(lat || lon) && (
                        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-500">
                                <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                {lat}, {lon}
                            </span>
                        </div>
                    )}
                </div>

                {gridItems.length > 0 && (
                    <div className="flex flex-col gap-2 px-4">
                        {gridItems.map(({ key, label, value }) => (
                            <div key={key} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 leading-tight">{label}</div>
                                <div className="text-sm text-gray-800 font-medium leading-snug break-words">{value}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    })();

    const LayerStoreBody = (
        <>
            <div className="sticky top-12 z-10 bg-white text-center text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-3 mb-5">
                <div className="text-xl font-bold text-gray-800">
                    Layers Store
                </div>
                <div className="text-sm text-gray-600 font-normal mt-1">
                    {MainStore.currentScreen === "Groundwater"
                        ? "Groundwater Layers"
                        : "Agriculture Layers"}
                </div>
            </div>

            {MainStore.currentScreen === "Groundwater" && (
                <div className="grid grid-cols-2 gap-4 p-1">
                    {LayerStoreKeysGW.map((key) => (
                        <button
                            key={key}
                            onClick={() => {
                                LayerStore[layerStoreFuncMapping[key]](
                                    !LayerStore[key],
                                );
                                MainStore.setLayerClicked(key);
                            }}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md
                ${LayerStore[key]
                                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                }
                `}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                {LayerStore[key] && (
                                    <span className="w-2 h-2 bg-white rounded-full flex-shrink-0"></span>
                                )}
                                <span className="text-center leading-tight">
                                    {layerStoreNameMapping[key]}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {MainStore.currentScreen === "Agriculture" && (
                <div className="grid grid-cols-2 gap-4 p-1">
                    {LayerStoreKeysAgri.map((key) => (
                        <button
                            key={key}
                            onClick={() => {
                                LayerStore[layerStoreFuncMapping[key]](
                                    !LayerStore[key],
                                );
                                MainStore.setLayerClicked(key);
                                console.log("IN BOTTOM SHEET");
                            }}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md
                ${LayerStore[key]
                                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                }
                `}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                {LayerStore[key] && (
                                    <span className="w-2 h-2 bg-white rounded-full flex-shrink-0"></span>
                                )}
                                <span className="text-center leading-tight">
                                    {layerStoreNameMapping[key]}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </>
    );

    const dismissAll = () => {
        MainStore.setIsForm(false);
        MainStore.setNregaSheet(false);
        MainStore.setIsMetadata(false);
        MainStore.setIsResource(false);
        MainStore.setIsWaterBody(false);
        MainStore.setIsGroundWater(false);
        MainStore.setIsAgriculture(false);
        MainStore.setIsLayerStore(false);
        MainStore.setIsResourceOpen(false);
        MainStore.setIsOpen(false);
        MainStore.setIsSiteAnalysis(false);
        MainStore.setIsSiteSuitabilityPopupOpen(false);
    };

    const handleDone = async () => {
        if (MainStore.isForm) {
            setIsSyncing(true);
            await new Promise((r) => setTimeout(r, 2000));

            if (!syncDoneRef.current) {
                stopPolling();
                let success = false;
                for (let attempt = 0; attempt < 4; attempt++) {
                    success = await syncFormSubmission();
                    if (success) break;
                    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
                }
                setIsSyncing(false);
                if (!success) return;
            } else {
                setIsSyncing(false);
            }
        }
        dismissAll();
    };

    const onDismiss = () => {
        if (MainStore.isForm && !syncDoneRef.current) {
            stopPolling();
            const retrySync = async () => {
                for (let attempt = 0; attempt < 4; attempt++) {
                    const ok = await syncFormSubmission(true);
                    if (ok) break;
                    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
                }
            };
            retrySync();
        }
        dismissAll();
    };

    const renderBody = () => {
        switch (true) {
            case MainStore.isNregaSheet:
                return nregaBody;

            case MainStore.isMetadata && MainStore.metadata !== null:
                return metaDataBody;

            case (MainStore.isResource || MainStore.isResourceOpen) && MainStore.selectedResource !== null:
                return resourceBody;

            case MainStore.isWaterbody:
                return <SurfaceWaterBodies />;

            case MainStore.isGroundWater:
                return <GroundwaterAnalyze />;

            case MainStore.isAgriculture && MainStore.currentStep === 0:
                return <AgricultureAnalyze />;

            case MainStore.isLayerStore:
                return LayerStoreBody;

            case MainStore.isSiteAnalysis:
                return <SiteAnalysis />;

            case MainStore.isSiteSuitabilityPopupOpen:
                return <SiteSuitabilityAnalysis />;

            default:
                return null;
        }
    };

    const doneButton = (
        <button
            onClick={handleDone}
            disabled={isSyncing}
            className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center gap-2"
            aria-label="Done"
        >
            {isSyncing && (
                <SquircleLoader
                    size={14}
                    strokeWidth={2}
                    color="#ffffff"
                    backgroundColor="rgba(255,255,255,0.3)"
                    speed={1000}
                />
            )}
            {isSyncing ? t("Saving…") : t("Done")}
        </button>
    );

    return (
        <BottomSheet
            open={
                MainStore.isOpen ||
                MainStore.isSiteSuitabilityPopupOpen ||
                (MainStore.isResourceOpen &&
                    MainStore.currentScreen === "HomeScreen")
            }
            onDismiss={onDismiss}
            blocking={false}
            snapPoints={({ maxHeight }) =>
                MainStore.isLayerStore ? [maxHeight / 2] : [maxHeight]
            }
        >
            {MainStore.isForm && MainStore.formUrl ? (
                <div className="flex flex-col" style={{ height: "calc(100dvh - 40px)" }}>
                    <div className="flex-shrink-0 bg-white/80 backdrop-blur-md flex items-center justify-end px-4 py-3 border-b border-gray-100/60">
                        {doneButton}
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <iframe
                            id="odk-frame"
                            src={MainStore.formUrl}
                            style={{ width: "100%", height: "100%" }}
                            allow="camera; microphone; geolocation"
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 py-3 border-b border-gray-100/60">
                        {MainStore.isNregaSheet ? (
                            <>
                                <button
                                    onClick={dismissAll}
                                    className="px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors border border-gray-200"
                                    aria-label="Cancel"
                                >
                                    {t("Cancel")}
                                </button>
                                <button
                                    onClick={dismissAll}
                                    className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                                    aria-label="Done"
                                >
                                    {t("Done")}
                                </button>
                            </>
                        ) : (
                            doneButton
                        )}
                    </div>
                    <div>{renderBody()}</div>
                </>
            )}
        </BottomSheet>
    );
};

export default Bottomsheet;
