import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import "./BottomSheet.css";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowLeftRight,
    Building2,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Circle,
    FlaskConical,
    FolderOpen,
    Info,
    Layers,
    MapPin,
    Search,
    User,
    X,
} from "lucide-react";
import authService from "../services/authService";
import useMainStore from "../store/MainStore.jsx";
import SquircleLoader from "./SquircleLoader.jsx";

const formatBlockName = (name) => {
    if (!name) return "";
    return name
        .split("_")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
};

const formatDate = (dateString) => {
    if (!dateString) return "—";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const isTestPlan = (plan) => {
    const planName = plan.plan?.toLowerCase() || "";
    return planName.includes("test") || planName.includes("demo");
};

const ContextCard = ({
    organization,
    project,
    roleLabel,
    canSwitchProject,
    onSwitchProject,
    t,
}) => (
    <div className="bg-white rounded-2xl border border-[#592941]/10 shadow-[0_1px_2px_rgba(45,32,39,0.04)] overflow-hidden">
        <div className="px-4 py-3.5 grid grid-cols-2 gap-4">
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b7480] mb-0.5">
                    <Building2 size={11} className="flex-shrink-0" />
                    <span className="truncate">{t("Organization")}</span>
                </div>
                <p className="text-sm font-semibold text-[#2d2027] truncate">
                    {organization || "—"}
                </p>
            </div>

            <div className="min-w-0 border-l border-[#592941]/10 pl-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b7480] mb-0.5">
                    <FolderOpen size={11} className="flex-shrink-0" />
                    <span className="truncate">{t("Project")}</span>
                </div>
                <p className="text-sm font-semibold text-[#2d2027] truncate">
                    {project || "—"}
                </p>
            </div>
        </div>

        {canSwitchProject ? (
            <button
                type="button"
                onClick={onSwitchProject}
                className="w-full px-4 py-2.5 bg-[#f8f7f4]/80 hover:bg-[#eeece7] border-t border-[#592941]/[0.08] flex items-center justify-between gap-2 text-xs font-semibold text-[#592941] transition-colors cursor-pointer"
            >
                <span className="inline-flex items-center gap-1.5">
                    <ArrowLeftRight size={13} strokeWidth={2.2} />
                    {t("Switch")} {t("Project")}
                </span>
                <span className="inline-flex items-center gap-2">
                    {roleLabel && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#592941] bg-[#592941]/[0.08] px-2 py-0.5 rounded-full whitespace-nowrap">
                            {roleLabel}
                        </span>
                    )}
                    <ChevronRight size={15} className="text-[#8b7480]" />
                </span>
            </button>
        ) : roleLabel ? (
            <div className="px-4 py-2 bg-[#f8f7f4]/60 border-t border-[#592941]/[0.07] flex items-center justify-end">
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#592941] bg-[#592941]/[0.08] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {roleLabel}
                </span>
            </div>
        ) : null}
    </div>
);

const FilterBar = ({
    searchQuery,
    onSearchChange,
    villages,
    facilitators,
    selectedVillage,
    selectedFacilitator,
    onSelectVillage,
    onSelectFacilitator,
    onClearVillage,
    onClearFacilitator,
    onClearAll,
    activePanel,
    setActivePanel,
    t,
}) => {
    const [trayQuery, setTrayQuery] = useState("");
    const trayRef = useRef(null);

    useEffect(() => {
        setTrayQuery("");
    }, [activePanel]);

    useEffect(() => {
        if (!activePanel) return;
        const handleClickOutside = (event) => {
            if (
                trayRef.current &&
                !trayRef.current.contains(event.target) &&
                !event.target.closest("[data-filter-pill]")
            ) {
                setActivePanel(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [activePanel, setActivePanel]);

    const hasAnyFilter = Boolean(
        selectedVillage || selectedFacilitator || searchQuery,
    );

    const activeOptions =
        activePanel === "village"
            ? villages
            : activePanel === "facilitator"
              ? facilitators
              : [];

    const filteredOptions = trayQuery
        ? activeOptions.filter((opt) =>
              opt.toLowerCase().includes(trayQuery.toLowerCase()),
          )
        : activeOptions;

    const currentValue =
        activePanel === "village" ? selectedVillage : selectedFacilitator;

    return (
        <div className="space-y-2.5">
            {/* Search input */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b7480] pointer-events-none"
                />
                <input
                    type="text"
                    placeholder={t("Search plans, village, or facilitator...")}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoComplete="off"
                    className="w-full h-11 bg-white pl-10 pr-9 rounded-2xl border border-[#592941]/12 text-sm text-[#2d2027] placeholder:text-[#9c8b94] shadow-[0_1px_2px_rgba(45,32,39,0.03)] focus:outline-none focus:border-[#592941]/45 focus:ring-4 focus:ring-[#592941]/[0.08] transition-all"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        aria-label={t("Clear")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#eeece7] hover:bg-[#e4e0da] text-[#592941] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={13} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* Filter pills row */}
            {(villages.length > 0 || facilitators.length > 0 || hasAnyFilter) && (
                <div className="flex items-center flex-wrap gap-2">
                    {villages.length > 0 &&
                        (selectedVillage ? (
                            <div className="inline-flex items-center h-8 rounded-full bg-[#592941] text-white overflow-hidden max-w-[15rem] shadow-[0_2px_8px_rgba(89,41,65,0.2)]">
                                <button
                                    type="button"
                                    data-filter-pill
                                    onClick={() =>
                                        setActivePanel(
                                            activePanel === "village"
                                                ? null
                                                : "village",
                                        )
                                    }
                                    className="h-full pl-3 pr-2 text-xs font-semibold inline-flex items-center gap-1.5 min-w-0 hover:bg-[#6b3852] transition-colors cursor-pointer"
                                >
                                    <MapPin size={12} className="flex-shrink-0" />
                                    <span className="truncate">
                                        {selectedVillage}
                                    </span>
                                </button>
                                <span className="w-px h-3.5 bg-white/25 flex-shrink-0" />
                                <button
                                    type="button"
                                    onClick={onClearVillage}
                                    aria-label={t("Clear")}
                                    className="h-full pl-1.5 pr-2.5 hover:bg-[#6b3852] inline-flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                data-filter-pill
                                onClick={() =>
                                    setActivePanel(
                                        activePanel === "village"
                                            ? null
                                            : "village",
                                    )
                                }
                                className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                                    activePanel === "village"
                                        ? "bg-[#eeece7] border-[#592941]/35 text-[#592941]"
                                        : "bg-white border-[#592941]/14 text-[#54444d] hover:border-[#592941]/30"
                                }`}
                            >
                                <MapPin size={12} className="flex-shrink-0" />
                                <span>{t("Village")}</span>
                                <ChevronDown
                                    size={12}
                                    className={`flex-shrink-0 transition-transform ${
                                        activePanel === "village"
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                />
                            </button>
                        ))}

                    {facilitators.length > 0 &&
                        (selectedFacilitator ? (
                            <div className="inline-flex items-center h-8 rounded-full bg-[#592941] text-white overflow-hidden max-w-[15rem] shadow-[0_2px_8px_rgba(89,41,65,0.2)]">
                                <button
                                    type="button"
                                    data-filter-pill
                                    onClick={() =>
                                        setActivePanel(
                                            activePanel === "facilitator"
                                                ? null
                                                : "facilitator",
                                        )
                                    }
                                    className="h-full pl-3 pr-2 text-xs font-semibold inline-flex items-center gap-1.5 min-w-0 hover:bg-[#6b3852] transition-colors cursor-pointer"
                                >
                                    <User size={12} className="flex-shrink-0" />
                                    <span className="truncate">
                                        {selectedFacilitator}
                                    </span>
                                </button>
                                <span className="w-px h-3.5 bg-white/25 flex-shrink-0" />
                                <button
                                    type="button"
                                    onClick={onClearFacilitator}
                                    aria-label={t("Clear")}
                                    className="h-full pl-1.5 pr-2.5 hover:bg-[#6b3852] inline-flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                data-filter-pill
                                onClick={() =>
                                    setActivePanel(
                                        activePanel === "facilitator"
                                            ? null
                                            : "facilitator",
                                    )
                                }
                                className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                                    activePanel === "facilitator"
                                        ? "bg-[#eeece7] border-[#592941]/35 text-[#592941]"
                                        : "bg-white border-[#592941]/14 text-[#54444d] hover:border-[#592941]/30"
                                }`}
                            >
                                <User size={12} className="flex-shrink-0" />
                                <span>{t("Facilitator")}</span>
                                <ChevronDown
                                    size={12}
                                    className={`flex-shrink-0 transition-transform ${
                                        activePanel === "facilitator"
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                />
                            </button>
                        ))}

                    {hasAnyFilter && (
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="h-8 px-2 text-xs font-semibold text-[#8b7480] hover:text-[#592941] transition-colors cursor-pointer"
                        >
                            {t("Clear")}
                        </button>
                    )}
                </div>
            )}

            {/* Inline expandable picker tray */}
            {activePanel && (
                <div
                    ref={trayRef}
                    className="bg-white rounded-2xl border border-[#592941]/15 shadow-[0_8px_24px_rgba(45,32,39,0.08)] overflow-hidden"
                >
                    <div className="px-3.5 py-2.5 bg-[#f8f7f4] border-b border-[#592941]/[0.08] flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#592941]">
                            {activePanel === "village"
                                ? t("Select Village")
                                : t("Select Facilitator")}
                        </span>
                        <span className="text-[11px] font-medium tabular-nums text-[#8b7480]">
                            {activeOptions.length}
                        </span>
                    </div>

                    {activeOptions.length > 8 && (
                        <div className="p-2 border-b border-[#592941]/[0.07]">
                            <input
                                type="text"
                                value={trayQuery}
                                onChange={(e) => setTrayQuery(e.target.value)}
                                placeholder={
                                    activePanel === "village"
                                        ? `${t("Village")}...`
                                        : `${t("Facilitator")}...`
                                }
                                autoComplete="off"
                                className="w-full h-9 px-3 rounded-xl bg-[#f8f7f4] border border-[#592941]/10 text-xs text-[#2d2027] placeholder:text-[#9c8b94] focus:outline-none focus:border-[#592941]/40"
                            />
                        </div>
                    )}

                    <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
                        {!trayQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activePanel === "village") {
                                        onClearVillage();
                                    } else {
                                        onClearFacilitator();
                                    }
                                    setActivePanel(null);
                                }}
                                className={`w-full px-3 py-2 rounded-xl text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                                    !currentValue
                                        ? "bg-[#592941]/[0.08] text-[#592941] font-semibold"
                                        : "text-[#54444d] hover:bg-[#f8f7f4]"
                                }`}
                            >
                                <span>
                                    {activePanel === "village"
                                        ? t("All Villages")
                                        : t("All Facilitators")}
                                </span>
                                {!currentValue && (
                                    <Check size={15} strokeWidth={2.5} />
                                )}
                            </button>
                        )}

                        {filteredOptions.map((option) => {
                            const isActive = currentValue === option;
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        if (activePanel === "village") {
                                            onSelectVillage(option);
                                        } else {
                                            onSelectFacilitator(option);
                                        }
                                        setActivePanel(null);
                                    }}
                                    className={`w-full px-3 py-2 rounded-xl text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                        isActive
                                            ? "bg-[#592941]/[0.08] text-[#592941] font-semibold"
                                            : "text-[#2d2027] hover:bg-[#f8f7f4]"
                                    }`}
                                >
                                    <span className="truncate">{option}</span>
                                    {isActive && (
                                        <Check
                                            size={15}
                                            strokeWidth={2.5}
                                            className="flex-shrink-0"
                                        />
                                    )}
                                </button>
                            );
                        })}

                        {filteredOptions.length === 0 && (
                            <p className="text-xs text-[#8b7480] text-center py-4">
                                {t("No matching plans")}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const PlanRow = ({
    plan,
    isSelected,
    isLoadingDetails,
    onSelect,
    onInfo,
    isTest = false,
    showProjectName = false,
    t,
}) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
            }
        }}
        className={`group flex items-center gap-3.5 px-3.5 py-3 cursor-pointer transition-colors select-none ${
            isSelected
                ? "bg-[#592941]/[0.06]"
                : isTest
                  ? "hover:bg-amber-900/[0.04] active:bg-amber-900/[0.07]"
                  : "hover:bg-[#f8f7f4] active:bg-[#eeece7]/70"
        }`}
    >
        {/* Selection indicator */}
        <div
            className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                isSelected
                    ? "bg-[#592941] text-white shadow-[0_2px_6px_rgba(89,41,65,0.3)]"
                    : "border-[1.5px] border-[#592941]/25 bg-white group-hover:border-[#592941]/50"
            }`}
        >
            {isSelected && <Check size={12} strokeWidth={3} />}
        </div>

        {/* Plan metadata */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
                <p
                    className={`text-[14.5px] font-semibold leading-snug truncate ${
                        isSelected ? "text-[#592941]" : "text-[#2d2027]"
                    }`}
                >
                    {plan.plan}
                </p>
                {isSelected && (
                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-md bg-[#592941]/12 text-[#592941]">
                        {t("Selected")}
                    </span>
                )}
            </div>

            {(plan.village_name || plan.facilitator_name) && (
                <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#786870]">
                    {plan.village_name && (
                        <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
                            <MapPin
                                size={11}
                                className="text-[#9c8b94] flex-shrink-0"
                            />
                            <span className="truncate">{plan.village_name}</span>
                        </span>
                    )}
                    {plan.facilitator_name && (
                        <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
                            <User
                                size={11}
                                className="text-[#9c8b94] flex-shrink-0"
                            />
                            <span className="truncate">
                                {plan.facilitator_name}
                            </span>
                        </span>
                    )}
                </div>
            )}

            {showProjectName && plan.project_name && (
                <p className="text-[11px] font-medium text-[#8b7480] mt-0.5 truncate">
                    {plan.project_name}
                </p>
            )}
        </div>

        {/* Info button */}
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onInfo();
            }}
            aria-label={t("Plan Details")}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[#8b7480] hover:text-[#592941] hover:bg-[#592941]/[0.08] active:scale-95 transition-all cursor-pointer"
        >
            {isLoadingDetails ? (
                <SquircleLoader
                    size={15}
                    strokeWidth={2.5}
                    color="#592941"
                    backgroundColor="rgba(89, 41, 65, 0.16)"
                    speed={1100}
                />
            ) : (
                <Info size={16} strokeWidth={2} />
            )}
        </button>
    </div>
);

const PlanListSection = ({
    plans,
    filtered,
    selectedPlanId,
    loadingDetailsId,
    onSelectPlan,
    onInspectPlan,
    hasActiveFilters,
    onClearFilters,
    emptyMessage,
    sectionTitle,
    showProjectName = false,
    t,
}) => {
    const totalCount = plans.length;
    const matchedRegularCount = filtered.regularPlans.length;
    const matchedTestCount = filtered.testPlans.length;
    const totalMatched = matchedRegularCount + matchedTestCount;

    if (totalMatched === 0) {
        return (
            <div className="bg-white rounded-2xl border border-[#592941]/10 px-6 py-10 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#eeece7] text-[#8b7480] flex items-center justify-center mx-auto mb-3">
                    <Search size={20} />
                </div>
                <p className="text-sm font-semibold text-[#2d2027]">
                    {hasActiveFilters ? t("No matching plans") : emptyMessage}
                </p>
                {hasActiveFilters && (
                    <>
                        <p className="text-xs text-[#786870] mt-1">
                            {t("Try adjusting your search or filters.")}
                        </p>
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="mt-4 px-4 py-2 rounded-xl bg-[#eeece7] hover:bg-[#e4e0da] text-xs font-semibold text-[#592941] transition-colors cursor-pointer"
                        >
                            {t("Clear all filters")}
                        </button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {matchedRegularCount > 0 && (
                <div>
                    <div className="flex items-center justify-between px-1 mb-2">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b7480]">
                            {sectionTitle || t("Plans")}
                        </h3>
                        <span className="text-[11px] font-semibold tabular-nums text-[#6d5c65] bg-[#eeece7] px-2 py-0.5 rounded-full">
                            {hasActiveFilters && totalCount !== totalMatched
                                ? `${matchedRegularCount} / ${plans.filter((p) => !isTestPlan(p)).length}`
                                : matchedRegularCount}
                        </span>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#592941]/10 shadow-[0_1px_2px_rgba(45,32,39,0.04)] overflow-hidden divide-y divide-[#592941]/[0.07]">
                        {filtered.regularPlans.map((plan) => (
                            <PlanRow
                                key={plan.id}
                                plan={plan}
                                isSelected={selectedPlanId === plan.id}
                                isLoadingDetails={loadingDetailsId === plan.id}
                                onSelect={() => onSelectPlan(plan)}
                                onInfo={() => onInspectPlan(plan)}
                                showProjectName={showProjectName}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            )}

            {filtered.hasTestPlans && (
                <div>
                    <div className="flex items-center justify-between px-1 mb-2">
                        <div className="flex items-center gap-1.5">
                            <FlaskConical
                                size={12}
                                className="text-amber-700"
                            />
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-800/85">
                                {t("Test Plans")}
                            </h3>
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full">
                            {matchedTestCount}
                        </span>
                    </div>
                    <div className="bg-[#fffdf8] rounded-2xl border border-amber-800/15 shadow-[0_1px_2px_rgba(45,32,39,0.03)] overflow-hidden divide-y divide-amber-900/[0.08]">
                        {filtered.testPlans.map((plan) => (
                            <PlanRow
                                key={plan.id}
                                plan={plan}
                                isSelected={selectedPlanId === plan.id}
                                isLoadingDetails={loadingDetailsId === plan.id}
                                isTest
                                onSelect={() => onSelectPlan(plan)}
                                onInfo={() => onInspectPlan(plan)}
                                showProjectName={showProjectName}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProjectSelectorView = ({
    filteringByTehsil,
    availableProjects,
    projectTehsilWarnings,
    selectedProject,
    isSuperAdmin,
    unassignedCount,
    onSelectProject,
    onSelectUnassigned,
    t,
}) => {
    const visibleProjects = availableProjects.filter(
        (p) => !projectTehsilWarnings.has(p.id),
    );

    if (filteringByTehsil) {
        return (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
                <SquircleLoader
                    size={32}
                    strokeWidth={3}
                    color="#592941"
                    backgroundColor="rgba(89, 41, 65, 0.16)"
                />
                <p className="text-sm text-[#786870]">
                    {t("Filtering projects for tehsil...")}
                </p>
            </div>
        );
    }

    if (visibleProjects.length === 0 && !(isSuperAdmin && unassignedCount > 0)) {
        return (
            <div className="bg-white rounded-2xl border border-[#592941]/10 px-6 py-10 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#eeece7] text-[#8b7480] flex items-center justify-center mx-auto mb-3">
                    <FolderOpen size={20} />
                </div>
                <p className="text-sm font-semibold text-[#2d2027]">
                    {t("No projects found for this tehsil.")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {visibleProjects.map((project) => {
                const isActive = selectedProject?.id === project.id;
                return (
                    <button
                        key={project.id}
                        type="button"
                        onClick={() => onSelectProject(project)}
                        className={`w-full text-left rounded-2xl border p-3.5 flex items-center gap-3.5 transition-all active:scale-[0.99] cursor-pointer ${
                            isActive
                                ? "bg-[#592941]/[0.05] border-[#592941]/40 shadow-[0_2px_10px_rgba(89,41,65,0.08)]"
                                : "bg-white border-[#592941]/10 hover:border-[#592941]/30 shadow-[0_1px_2px_rgba(45,32,39,0.04)]"
                        }`}
                    >
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isActive
                                    ? "bg-[#592941] text-white"
                                    : "bg-[#eeece7] text-[#592941]"
                            }`}
                        >
                            {isActive ? (
                                <Check size={18} strokeWidth={2.5} />
                            ) : (
                                <FolderOpen size={18} />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-semibold text-[#2d2027] truncate">
                                {project.name}
                            </h3>
                            {project.organization_name && (
                                <p className="text-xs text-[#786870] mt-0.5 truncate">
                                    {project.organization_name}
                                </p>
                            )}
                        </div>

                        {isSuperAdmin ? (
                            <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-[#592941] bg-[#eeece7] px-2.5 py-1 rounded-full">
                                {project.count} {t("Plans")}
                            </span>
                        ) : (
                            <ChevronRight
                                size={18}
                                className="flex-shrink-0 text-[#8b7480]"
                            />
                        )}
                    </button>
                );
            })}

            {isSuperAdmin && unassignedCount > 0 && (
                <button
                    type="button"
                    onClick={onSelectUnassigned}
                    className="w-full text-left bg-white rounded-2xl border border-dashed border-[#592941]/25 hover:border-[#592941]/45 p-3.5 flex items-center gap-3.5 transition-all active:scale-[0.99] cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#f8f7f4] text-[#8b7480] flex items-center justify-center flex-shrink-0">
                        <Layers size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-[#2d2027] truncate">
                            {t("Plans without Project")}
                        </h3>
                        <p className="text-xs text-[#786870] mt-0.5 truncate">
                            {t("Unassigned plans")}
                        </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-[#6d5c65] bg-[#eeece7] px-2.5 py-1 rounded-full">
                        {unassignedCount} {t("Plans")}
                    </span>
                </button>
            )}
        </div>
    );
};

const PlanDetailsView = ({
    plan,
    organizationName,
    projectName,
    isSuperAdmin,
    isSelected,
    onToggleSelect,
    t,
}) => {
    const milestones = [
        { key: "reviewed", label: t("DPR Reviewed"), done: Boolean(plan.is_dpr_reviewed) },
        { key: "approved", label: t("DPR Approved"), done: Boolean(plan.is_dpr_approved) },
    ];
    const completedCount = milestones.filter((m) => m.done).length;

    const metadataFields = [
        { label: t("Village"), value: plan.village_name || "—" },
        { label: t("Gram Panchayat"), value: plan.gram_panchayat || "—" },
        { label: t("Facilitator"), value: plan.facilitator_name || "—" },
        { label: t("Created At"), value: formatDate(plan.created_at) },
    ];

    const locationFields = [
        { label: t("State ID"), value: plan.state_soi ?? "—" },
        { label: t("District ID"), value: plan.district_soi ?? "—" },
        { label: t("Tehsil ID"), value: plan.tehsil_soi ?? "—" },
    ];

    return (
        <div className="space-y-3.5">
            {/* Hero summary card */}
            <div className="bg-white rounded-2xl border border-[#592941]/10 shadow-[0_1px_2px_rgba(45,32,39,0.04)] p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold tabular-nums text-[#6d5c65] bg-[#eeece7] px-2.5 py-0.5 rounded-full">
                        {t("Plan ID")} #{plan.id}
                    </span>
                    {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#592941] px-2.5 py-0.5 rounded-full">
                            <Check size={11} strokeWidth={3} />
                            {t("Selected")}
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-[#2d2027] leading-snug break-words">
                    {plan.plan}
                </h3>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-3.5 border-t border-[#592941]/[0.08]">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b7480] mb-0.5">
                            {t("Organization")}
                        </p>
                        <p className="text-sm font-semibold text-[#2d2027] truncate">
                            {(isSuperAdmin
                                ? plan.organization_name
                                : organizationName) || "—"}
                        </p>
                    </div>
                    <div className="min-w-0 border-l border-[#592941]/10 pl-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b7480] mb-0.5">
                            {t("Project")}
                        </p>
                        <p className="text-sm font-semibold text-[#2d2027] truncate">
                            {projectName || t("No Project Assigned")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Plan metadata card */}
            <div className="bg-white rounded-2xl border border-[#592941]/10 shadow-[0_1px_2px_rgba(45,32,39,0.04)] p-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                    {metadataFields.map((field) => (
                        <div key={field.label} className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#8b7480] mb-0.5">
                                {field.label}
                            </p>
                            <p className="text-sm font-medium text-[#2d2027] break-words">
                                {field.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Milestones / Status card */}
            <div className="bg-white rounded-2xl border border-[#592941]/10 shadow-[0_1px_2px_rgba(45,32,39,0.04)] p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b7480]">
                        {t("Status")}
                    </h4>
                    <span className="text-[11px] font-semibold tabular-nums text-[#6d5c65] bg-[#eeece7] px-2 py-0.5 rounded-full">
                        {completedCount} / {milestones.length}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {milestones.map((item) => (
                        <div
                            key={item.key}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium ${
                                item.done
                                    ? "bg-[#2E7D32]/[0.07] border-[#2E7D32]/20 text-[#1b5e20]"
                                    : "bg-[#f8f7f4] border-[#592941]/[0.08] text-[#8b7480]"
                            }`}
                        >
                            {item.done ? (
                                <CheckCircle2
                                    size={15}
                                    className="text-[#2E7D32] flex-shrink-0"
                                />
                            ) : (
                                <Circle
                                    size={15}
                                    className="text-[#c5bbc0] flex-shrink-0"
                                />
                            )}
                            <span className="leading-tight">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Location IDs card */}
            <div className="bg-white rounded-2xl border border-[#592941]/10 shadow-[0_1px_2px_rgba(45,32,39,0.04)] p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b7480] mb-3">
                    {t("Location Details")}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                    {locationFields.map((loc) => (
                        <div
                            key={loc.label}
                            className="bg-[#f8f7f4] rounded-xl px-2.5 py-2 text-center border border-[#592941]/[0.06]"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b7480] truncate">
                                {loc.label}
                            </p>
                            <p className="text-sm font-semibold tabular-nums text-[#2d2027] mt-0.5">
                                {loc.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Primary CTA */}
            <div className="pt-1">
                <button
                    type="button"
                    onClick={onToggleSelect}
                    className={`w-full h-12 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                        isSelected
                            ? "bg-white border border-[#592941]/25 text-[#592941] hover:bg-[#eeece7]"
                            : "bg-[#592941] hover:bg-[#6b3852] text-white shadow-[0_7px_18px_rgba(89,41,65,0.22)]"
                    }`}
                >
                    {isSelected ? (
                        <>
                            <X size={16} strokeWidth={2.3} />
                            {t("Deselect Plan")}
                        </>
                    ) : (
                        <>
                            <Check size={16} strokeWidth={2.5} />
                            {t("Select Plan")}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const PlanSheet = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const MainStore = useMainStore((state) => state);
    const [projectPlans, setProjectPlans] = useState([]);
    const [globalPlans, setGlobalPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDetailsId, setLoadingDetailsId] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [showPlanDetails, setShowPlanDetails] = useState(null);
    const [currentProjectName, setCurrentProjectName] = useState("");
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectTehsilWarnings, setProjectTehsilWarnings] = useState(
        new Map(),
    );

    const [activeFilterPanel, setActiveFilterPanel] = useState(null);
    const [selectedVillageFilter, setSelectedVillageFilter] = useState(null);
    const [selectedFacilitatorFilter, setSelectedFacilitatorFilter] =
        useState(null);
    const [manuallyCleared, setManuallyCleared] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteringByTehsil, setFilteringByTehsil] = useState(false);

    const userData = authService.getUserData();
    const organizationName = authService.getOrganization();
    const isSuperAdmin = userData?.is_superadmin || false;
    const isOrgAdmin =
        userData?.groups?.some((group) => group.name === "Administrator") ||
        false;
    const isPlanReviewer =
        userData?.groups?.some(
            (group) => group.name === "Test Plan Reviewer",
        ) || false;
    const blockId = MainStore.block_id || searchParams.get("block_id");
    const blockLabel = formatBlockName(MainStore.blockName);

    // MARK: Super Admin
    const fetchGlobalPlans = useCallback(async () => {
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}watershed/plans/?tehsil=${blockId}`;
            const response = await authService.makeAuthenticatedRequest(url);

            if (response.ok) {
                const plans = await response.json();
                setGlobalPlans(plans);

                const uniqueProjects = plans.reduce((acc, plan) => {
                    if (plan.project && plan.project_name) {
                        const existingProject = acc.find(
                            (p) => p.id === plan.project,
                        );
                        if (!existingProject) {
                            acc.push({
                                id: plan.project,
                                name: plan.project_name,
                                organization_name: plan.organization_name,
                                count: 1,
                            });
                        } else {
                            existingProject.count++;
                        }
                    }
                    return acc;
                }, []);

                setAvailableProjects(uniqueProjects);

                if (blockId && uniqueProjects.length > 0) {
                    const warningsMap = new Map();
                    for (const project of uniqueProjects) {
                        const projPlans = plans.filter(
                            (plan) => plan.project === project.id,
                        );
                        const hasMatchingPlans = projPlans.some(
                            (plan) =>
                                plan.tehsil_soi === blockId ||
                                plan.tehsil_soi === parseInt(blockId),
                        );
                        if (!hasMatchingPlans) {
                            warningsMap.set(project.id, true);
                        }
                    }
                    setProjectTehsilWarnings(warningsMap);
                }

                if (uniqueProjects.length === 1) {
                    setSelectedProject(uniqueProjects[0]);
                } else if (uniqueProjects.length > 1) {
                    setShowProjectSelector(true);
                }
            } else {
                const errorText = await response.text();
                console.error(
                    `Failed to fetch global plans. Status: ${response.status}, Response: ${errorText}`,
                );
            }
        } catch (error) {
            console.error("Error fetching global plans:", error);
        } finally {
            setLoading(false);
        }
    }, [blockId]);

    // MARK: Org Admin
    const fetchOrgAdminPlans = useCallback(
        async (projectId) => {
            setLoading(true);
            try {
                let url = `${import.meta.env.VITE_API_URL}projects/${projectId}/watershed/plans/`;
                if (blockId) {
                    url += `?tehsil=${blockId}`;
                }

                const response =
                    await authService.makeAuthenticatedRequest(url);

                if (response.ok) {
                    let plans = await response.json();

                    if (blockId && plans.length > 0) {
                        const hasBlockProperty = plans.some((plan) =>
                            Object.prototype.hasOwnProperty.call(
                                plan,
                                "tehsil_soi",
                            ),
                        );
                        if (hasBlockProperty) {
                            const allPlansMatchBlock = plans.every(
                                (plan) =>
                                    plan.tehsil_soi === blockId ||
                                    plan.tehsil_soi === parseInt(blockId),
                            );

                            if (!allPlansMatchBlock) {
                                plans = plans.filter(
                                    (plan) =>
                                        plan.tehsil_soi === blockId ||
                                        plan.tehsil_soi === parseInt(blockId),
                                );
                            }
                        }
                    }

                    setProjectPlans([
                        {
                            projectId: projectId,
                            projectName:
                                userData.project_details.find(
                                    (p) => p.project_id === projectId,
                                )?.project_name || "Unknown Project",
                            plans: plans,
                        },
                    ]);
                } else {
                    await response.text();
                    console.error(
                        `Failed to fetch plans for project ${projectId}. Status: ${response.status}`,
                    );
                }
            } catch (error) {
                console.error(
                    `Error fetching plans for project ${projectId}:`,
                    error,
                );
            } finally {
                setLoading(false);
            }
        },
        [userData, blockId],
    );

    const checkProjectTehsilMatch = useCallback(
        async (projectId) => {
            if (!blockId) return true;

            try {
                const url = `${import.meta.env.VITE_API_URL}projects/${projectId}/watershed/plans/?tehsil=${blockId}`;
                const response =
                    await authService.makeAuthenticatedRequest(url);

                if (response.ok) {
                    const plans = await response.json();
                    return plans.length > 0;
                }
            } catch (error) {
                console.error(
                    `Error checking project ${projectId} tehsil match:`,
                    error,
                );
            }
            return false;
        },
        [blockId],
    );

    // MARK: Org Admin
    const handleOrgAdminProjects = useCallback(async () => {
        if (userData?.project_details && userData.project_details.length > 1) {
            const projects = userData.project_details.map((project) => ({
                id: project.project_id,
                name: project.project_name,
                organization_name: organizationName,
            }));

            setAvailableProjects(projects);
            setShowProjectSelector(true);

            if (blockId && (isSuperAdmin || isOrgAdmin || isPlanReviewer)) {
                setFilteringByTehsil(true);
                try {
                    const results = await Promise.all(
                        projects.map(async (project) => ({
                            id: project.id,
                            hasMatch: await checkProjectTehsilMatch(project.id),
                        })),
                    );
                    const warningsMap = new Map();
                    for (const { id, hasMatch } of results) {
                        if (!hasMatch) {
                            warningsMap.set(id, true);
                        }
                    }
                    setProjectTehsilWarnings(warningsMap);
                } finally {
                    setFilteringByTehsil(false);
                }
            }
        } else if (
            userData?.project_details &&
            userData.project_details.length === 1
        ) {
            const project = userData.project_details[0];
            setSelectedProject({
                id: project.project_id,
                name: project.project_name,
                organization_name: organizationName,
            });
            fetchOrgAdminPlans(project.project_id);
        }
    }, [
        userData,
        organizationName,
        fetchOrgAdminPlans,
        blockId,
        checkProjectTehsilMatch,
        isSuperAdmin,
        isOrgAdmin,
        isPlanReviewer,
    ]);

    // MARK: Regular Users
    const fetchAllProjectPlans = useCallback(async () => {
        setLoading(true);
        try {
            const allPlans = [];

            for (const project of userData.project_details) {
                try {
                    let url = `${import.meta.env.VITE_API_URL}projects/${project.project_id}/watershed/plans/`;
                    if (blockId) {
                        url += `?tehsil=${blockId}`;
                    }

                    const response =
                        await authService.makeAuthenticatedRequest(url);

                    if (response.ok) {
                        let plans = await response.json();

                        if (blockId && plans.length > 0) {
                            const hasBlockProperty = plans.some((plan) =>
                                Object.prototype.hasOwnProperty.call(
                                    plan,
                                    "tehsil_soi",
                                ),
                            );
                            if (hasBlockProperty) {
                                const allPlansMatchBlock = plans.every(
                                    (plan) =>
                                        plan.tehsil_soi === blockId ||
                                        plan.tehsil_soi === parseInt(blockId),
                                );

                                if (!allPlansMatchBlock) {
                                    plans = plans.filter(
                                        (plan) =>
                                            plan.tehsil_soi === blockId ||
                                            plan.tehsil_soi ===
                                                parseInt(blockId),
                                    );
                                }
                            }
                        }

                        allPlans.push({
                            projectId: project.project_id,
                            projectName: project.project_name,
                            plans: plans,
                        });
                    } else {
                        await response.text();
                    }
                } catch (error) {
                    console.error(
                        `Failed to fetch plans for project ${project.project_id}:`,
                        error,
                    );
                }
            }

            setProjectPlans(allPlans);
        } catch (error) {
            console.error("Error fetching project plans:", error);
        } finally {
            setLoading(false);
        }
    }, [userData, blockId]);

    useEffect(() => {
        if (isOpen) {
            setManuallyCleared(false);
            if (isSuperAdmin && blockId) {
                fetchGlobalPlans();
            } else if (
                (isOrgAdmin || isPlanReviewer) &&
                userData?.project_details
            ) {
                handleOrgAdminProjects();
            } else if (userData?.project_details) {
                fetchAllProjectPlans();
            }
        } else {
            setProjectTehsilWarnings(new Map());
            setShowPlanDetails(null);
            setActiveFilterPanel(null);
        }
    }, [
        isOpen,
        userData,
        isSuperAdmin,
        isOrgAdmin,
        isPlanReviewer,
        blockId,
        fetchGlobalPlans,
        handleOrgAdminProjects,
        fetchAllProjectPlans,
    ]);

    useEffect(() => {
        if (MainStore.currentPlan?.id) {
            setSelectedPlanId(MainStore.currentPlan.id);
        } else {
            setSelectedPlanId(null);
        }
    }, [MainStore.currentPlan]);

    useEffect(() => {
        if (
            !isSuperAdmin &&
            !isOrgAdmin &&
            !isPlanReviewer &&
            projectPlans.length > 0 &&
            userData &&
            !manuallyCleared
        ) {
            const userName = authService.getUserName();
            if (userName && userName !== "No name found") {
                const allFacilitatorNames = projectPlans.reduce(
                    (facilitators, projectData) => {
                        projectData.plans.forEach((plan) => {
                            if (
                                plan.facilitator_name &&
                                !facilitators.includes(plan.facilitator_name)
                            ) {
                                facilitators.push(plan.facilitator_name);
                            }
                        });
                        return facilitators;
                    },
                    [],
                );

                const matchedFacilitator = allFacilitatorNames.find(
                    (facilitatorName) =>
                        facilitatorName.toLowerCase() ===
                        userName.toLowerCase(),
                );

                if (matchedFacilitator && !selectedFacilitatorFilter) {
                    setSelectedFacilitatorFilter(matchedFacilitator);
                }
            }
        }
    }, [
        projectPlans,
        userData,
        isSuperAdmin,
        isOrgAdmin,
        isPlanReviewer,
        selectedFacilitatorFilter,
        manuallyCleared,
    ]);

    const fetchPlanDetails = async (projectId, planId, projectName) => {
        setLoadingDetailsId(planId);
        try {
            let url;
            if (isSuperAdmin) {
                const planDetails = globalPlans.find(
                    (plan) => plan.id === planId,
                );
                if (planDetails) {
                    setShowPlanDetails(planDetails);
                    setCurrentProjectName(
                        projectName ||
                            planDetails.project_name ||
                            "Unknown Project",
                    );
                    return;
                }
            } else {
                url = `${import.meta.env.VITE_API_URL}projects/${projectId}/watershed/plans/${planId}/`;
            }

            if (url) {
                const response =
                    await authService.makeAuthenticatedRequest(url);

                if (response.ok) {
                    const planDetails = await response.json();
                    setShowPlanDetails(planDetails);
                    setCurrentProjectName(projectName);
                } else {
                    const errorText = await response.text();
                    console.error(
                        `Failed to fetch plan details. Status: ${response.status}, Response: ${errorText.substring(0, 200)}...`,
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching plan details:", error);
        } finally {
            setLoadingDetailsId(null);
        }
    };

    const handlePlanSelect = (plan) => {
        if (selectedPlanId === plan.id) {
            setSelectedPlanId(null);
            MainStore.setCurrentPlan(null);
            return;
        }

        setSelectedPlanId(plan.id);

        const currentPlans = MainStore.plans || [];
        const planExists = currentPlans.find((p) => p.id === plan.id);

        if (!planExists) {
            useMainStore.setState((state) => ({
                plans: [...(state.plans || []), plan],
            }));
        }

        MainStore.setCurrentPlan(plan.id);
        setShowPlanDetails(null);
        onClose();
    };

    const handleProjectSelection = (project) => {
        setSelectedProject(project);
        setShowProjectSelector(false);
        setSelectedVillageFilter(null);
        setSelectedFacilitatorFilter(null);
        setSearchQuery("");
        setActiveFilterPanel(null);

        if (isOrgAdmin || isPlanReviewer) {
            fetchOrgAdminPlans(project.id);
        }
    };

    const superAdminFilteredPlans = useMemo(() => {
        if (!isSuperAdmin) return [];

        if (selectedProject) {
            return globalPlans.filter(
                (plan) => plan.project === selectedProject.id,
            );
        }

        if (availableProjects.length === 1) {
            return globalPlans.filter(
                (plan) => plan.project === availableProjects[0].id,
            );
        }

        return globalPlans.filter((plan) => !plan.project);
    }, [isSuperAdmin, selectedProject, globalPlans, availableProjects]);

    const allVisiblePlans = useMemo(
        () =>
            isSuperAdmin
                ? superAdminFilteredPlans
                : projectPlans.flatMap((project) => project.plans),
        [isSuperAdmin, superAdminFilteredPlans, projectPlans],
    );

    const uniqueVillages = useMemo(() => {
        const villages = [
            ...new Set(
                allVisiblePlans
                    .map((plan) => plan.village_name)
                    .filter(Boolean),
            ),
        ];
        return villages.sort();
    }, [allVisiblePlans]);

    const uniqueFacilitators = useMemo(() => {
        const facilitators = [
            ...new Set(
                allVisiblePlans
                    .map((plan) => plan.facilitator_name)
                    .filter(Boolean),
            ),
        ];
        return facilitators.sort();
    }, [allVisiblePlans]);

    const applyFilters = useCallback(
        (plans) => {
            const testPlans = plans.filter(isTestPlan);
            const regularPlans = plans.filter((plan) => !isTestPlan(plan));

            let filteredRegularPlans = [...regularPlans];
            let filteredTestPlans = [...testPlans];

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesQuery = (plan) =>
                    plan.plan?.toLowerCase().includes(query) ||
                    plan.village_name?.toLowerCase().includes(query) ||
                    plan.facilitator_name?.toLowerCase().includes(query);

                filteredRegularPlans = filteredRegularPlans.filter(matchesQuery);
                filteredTestPlans = filteredTestPlans.filter(matchesQuery);
            }

            if (selectedVillageFilter) {
                filteredRegularPlans = filteredRegularPlans.filter(
                    (plan) => plan.village_name === selectedVillageFilter,
                );
                filteredTestPlans = filteredTestPlans.filter(
                    (plan) => plan.village_name === selectedVillageFilter,
                );
            }

            if (selectedFacilitatorFilter) {
                filteredRegularPlans = filteredRegularPlans.filter(
                    (plan) =>
                        plan.facilitator_name === selectedFacilitatorFilter,
                );
                if (isSuperAdmin || isOrgAdmin || isPlanReviewer) {
                    filteredTestPlans = filteredTestPlans.filter(
                        (plan) =>
                            plan.facilitator_name === selectedFacilitatorFilter,
                    );
                }
            }

            return {
                regularPlans: filteredRegularPlans,
                testPlans: filteredTestPlans,
                hasTestPlans: filteredTestPlans.length > 0,
            };
        },
        [
            searchQuery,
            selectedVillageFilter,
            selectedFacilitatorFilter,
            isSuperAdmin,
            isOrgAdmin,
            isPlanReviewer,
        ],
    );

    const clearFilters = () => {
        setSelectedVillageFilter(null);
        setSelectedFacilitatorFilter(null);
        setSearchQuery("");
        setManuallyCleared(true);
        setActiveFilterPanel(null);
    };

    const isProjectSelectorView =
        showProjectSelector && availableProjects.length > 1;
    const isPlanDetailsView = Boolean(showPlanDetails);
    const hasActiveFilters = Boolean(
        searchQuery || selectedVillageFilter || selectedFacilitatorFilter,
    );
    const unassignedPlansCount = useMemo(
        () => globalPlans.filter((plan) => !plan.project).length,
        [globalPlans],
    );

    const handleHeaderBack = () => {
        if (isPlanDetailsView) {
            setShowPlanDetails(null);
        } else if (isProjectSelectorView) {
            setShowProjectSelector(false);
        }
    };

    const showBackButton =
        isPlanDetailsView || (isProjectSelectorView && Boolean(selectedProject));

    const headerTitle = isPlanDetailsView
        ? t("Plan Details")
        : isProjectSelectorView
          ? isOrgAdmin
              ? t("Select Organization Project")
              : t("Select Project")
          : t("Select Plan");

    const headerEyebrow = (() => {
        if (isPlanDetailsView) {
            return showPlanDetails?.village_name || blockLabel || null;
        }
        if (isSuperAdmin && blockId) {
            return blockLabel
                ? `${blockLabel} · ${t("Tehsil")} ${blockId}`
                : `${t("Tehsil")} ${blockId}`;
        }
        return blockLabel || null;
    })();

    const buildHeader = () => (
        <div className="flex items-center gap-3 px-4 pt-[22px] pb-3 text-left">
            {showBackButton && (
                <button
                    type="button"
                    onClick={handleHeaderBack}
                    className="commons-sheet-icon-button flex-shrink-0 cursor-pointer"
                    aria-label={t("Back")}
                >
                    <ArrowLeft size={18} strokeWidth={2.25} />
                </button>
            )}

            <div className="commons-sheet-heading flex-1">
                {headerEyebrow && <span>{headerEyebrow}</span>}
                <h2>{headerTitle}</h2>
            </div>

            <button
                type="button"
                onClick={onClose}
                className="commons-sheet-icon-button flex-shrink-0 cursor-pointer"
                aria-label={t("Close")}
            >
                <X size={18} strokeWidth={2.25} />
            </button>
        </div>
    );

    const renderFilterBar = () => (
        <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            villages={uniqueVillages}
            facilitators={uniqueFacilitators}
            selectedVillage={selectedVillageFilter}
            selectedFacilitator={selectedFacilitatorFilter}
            onSelectVillage={setSelectedVillageFilter}
            onSelectFacilitator={setSelectedFacilitatorFilter}
            onClearVillage={() => setSelectedVillageFilter(null)}
            onClearFacilitator={() => {
                setSelectedFacilitatorFilter(null);
                setManuallyCleared(true);
            }}
            onClearAll={clearFilters}
            activePanel={activeFilterPanel}
            setActivePanel={setActiveFilterPanel}
            t={t}
        />
    );

    const renderBody = () => {
        if (isProjectSelectorView) {
            return (
                <ProjectSelectorView
                    filteringByTehsil={filteringByTehsil}
                    availableProjects={availableProjects}
                    projectTehsilWarnings={projectTehsilWarnings}
                    selectedProject={selectedProject}
                    isSuperAdmin={isSuperAdmin}
                    unassignedCount={unassignedPlansCount}
                    onSelectProject={handleProjectSelection}
                    onSelectUnassigned={() => {
                        setSelectedProject(null);
                        setShowProjectSelector(false);
                        setSelectedVillageFilter(null);
                        setSelectedFacilitatorFilter(null);
                        setSearchQuery("");
                        setActiveFilterPanel(null);
                    }}
                    t={t}
                />
            );
        }

        if (isPlanDetailsView) {
            return (
                <PlanDetailsView
                    plan={showPlanDetails}
                    organizationName={organizationName}
                    projectName={currentProjectName}
                    isSuperAdmin={isSuperAdmin}
                    isSelected={selectedPlanId === showPlanDetails.id}
                    onToggleSelect={() => handlePlanSelect(showPlanDetails)}
                    t={t}
                />
            );
        }

        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <SquircleLoader
                        size={34}
                        strokeWidth={3}
                        color="#592941"
                        backgroundColor="rgba(89, 41, 65, 0.16)"
                        speed={1500}
                    />
                    <p className="text-xs font-medium text-[#8b7480]">
                        {t("Loading plans...")}
                    </p>
                </div>
            );
        }

        // Superadmin with blockId
        if (isSuperAdmin && blockId) {
            const filtered = applyFilters(superAdminFilteredPlans);
            const emptyMsg = selectedProject
                ? `No plans found for ${selectedProject.name} in tehsil ${blockId}`
                : `No plans found for tehsil ${blockId}`;

            return (
                <div className="space-y-4">
                    <ContextCard
                        organization={
                            selectedProject
                                ? selectedProject.organization_name
                                : t("Global Access")
                        }
                        project={
                            selectedProject
                                ? selectedProject.name
                                : t("All Projects")
                        }
                        roleLabel={t("Super Admin")}
                        canSwitchProject={availableProjects.length > 1}
                        onSwitchProject={() => setShowProjectSelector(true)}
                        t={t}
                    />

                    {renderFilterBar()}

                    <PlanListSection
                        plans={superAdminFilteredPlans}
                        filtered={filtered}
                        selectedPlanId={selectedPlanId}
                        loadingDetailsId={loadingDetailsId}
                        onSelectPlan={(plan) => handlePlanSelect(plan)}
                        onInspectPlan={(plan) =>
                            fetchPlanDetails(
                                plan.project,
                                plan.id,
                                plan.project_name,
                            )
                        }
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        emptyMessage={emptyMsg}
                        sectionTitle={`${t("Plans")} · ${t("Tehsil")} ${blockId}`}
                        showProjectName={!selectedProject}
                        t={t}
                    />
                </div>
            );
        }

        // Superadmin without blockId
        if (isSuperAdmin && !blockId) {
            return (
                <div className="bg-white rounded-2xl border border-[#592941]/10 px-6 py-10 text-center">
                    <p className="text-sm text-[#6d5c65]">
                        {t(
                            "No tehsil ID provided, please contact: support@core-stack.org",
                        )}
                    </p>
                </div>
            );
        }

        // Org Admin or Plan Reviewer
        if (isOrgAdmin || isPlanReviewer) {
            const hasMultipleProjects =
                (userData?.project_details?.length || 0) > 1;
            const roleLabel = isOrgAdmin
                ? t("Org Admin")
                : t("Plan Reviewer");

            if (projectPlans.length === 0) {
                return (
                    <div className="bg-white rounded-2xl border border-[#592941]/10 px-6 py-10 text-center">
                        <div className="w-11 h-11 rounded-2xl bg-[#eeece7] text-[#8b7480] flex items-center justify-center mx-auto mb-3">
                            <FolderOpen size={20} />
                        </div>
                        <p className="text-sm font-semibold text-[#2d2027]">
                            {hasMultipleProjects && !selectedProject
                                ? t("Select a project to view its plans.")
                                : t("No plans found for the selected project.")}
                        </p>
                        {hasMultipleProjects && (
                            <button
                                type="button"
                                onClick={() => setShowProjectSelector(true)}
                                className="mt-4 px-4 py-2 rounded-xl bg-[#592941] hover:bg-[#6b3852] text-xs font-semibold text-white transition-colors cursor-pointer"
                            >
                                {t("Select Project")}
                            </button>
                        )}
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    {projectPlans.map((projectData) => {
                        const filtered = applyFilters(projectData.plans);
                        return (
                            <div
                                key={projectData.projectId}
                                className="space-y-4"
                            >
                                <ContextCard
                                    organization={organizationName}
                                    project={projectData.projectName}
                                    roleLabel={roleLabel}
                                    canSwitchProject={hasMultipleProjects}
                                    onSwitchProject={() =>
                                        setShowProjectSelector(true)
                                    }
                                    t={t}
                                />

                                {renderFilterBar()}

                                <PlanListSection
                                    plans={projectData.plans}
                                    filtered={filtered}
                                    selectedPlanId={selectedPlanId}
                                    loadingDetailsId={loadingDetailsId}
                                    onSelectPlan={(plan) =>
                                        handlePlanSelect(plan)
                                    }
                                    onInspectPlan={(plan) =>
                                        fetchPlanDetails(
                                            projectData.projectId,
                                            plan.id,
                                            projectData.projectName,
                                        )
                                    }
                                    hasActiveFilters={hasActiveFilters}
                                    onClearFilters={clearFilters}
                                    emptyMessage={t(
                                        "No plans found for the selected project.",
                                    )}
                                    t={t}
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Regular user view
        if (projectPlans.length === 0) {
            return (
                <div className="bg-white rounded-2xl border border-[#592941]/10 px-6 py-10 text-center">
                    <div className="w-11 h-11 rounded-2xl bg-[#eeece7] text-[#8b7480] flex items-center justify-center mx-auto mb-3">
                        <FolderOpen size={20} />
                    </div>
                    <p className="text-sm font-semibold text-[#2d2027]">
                        {t("No plans found for your projects.")}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {projectPlans.length === 1 && (
                    <ContextCard
                        organization={organizationName}
                        project={projectPlans[0].projectName}
                        t={t}
                    />
                )}

                {renderFilterBar()}

                {projectPlans.map((projectData, idx) => {
                    const filtered = applyFilters(projectData.plans);
                    return (
                        <div
                            key={projectData.projectId}
                            className={`space-y-3 ${
                                idx > 0
                                    ? "pt-4 border-t border-[#592941]/10"
                                    : ""
                            }`}
                        >
                            {projectPlans.length > 1 && (
                                <ContextCard
                                    organization={organizationName}
                                    project={projectData.projectName}
                                    t={t}
                                />
                            )}

                            <PlanListSection
                                plans={projectData.plans}
                                filtered={filtered}
                                selectedPlanId={selectedPlanId}
                                loadingDetailsId={loadingDetailsId}
                                onSelectPlan={(plan) => handlePlanSelect(plan)}
                                onInspectPlan={(plan) =>
                                    fetchPlanDetails(
                                        projectData.projectId,
                                        plan.id,
                                        projectData.projectName,
                                    )
                                }
                                hasActiveFilters={hasActiveFilters}
                                onClearFilters={clearFilters}
                                emptyMessage={t(
                                    "No plans found for your projects.",
                                )}
                                t={t}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <BottomSheet
            className="commons-bottom-sheet"
            open={isOpen}
            onDismiss={onClose}
            defaultSnap={({ maxHeight }) => maxHeight * 0.92}
            snapPoints={({ maxHeight }) => [maxHeight * 0.92]}
            header={buildHeader()}
        >
            <div className="commons-sheet-body px-4 pt-4 pb-8">
                {renderBody()}
            </div>
        </BottomSheet>
    );
};

export default PlanSheet;
