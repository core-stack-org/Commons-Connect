import React, { useState, useEffect, useCallback, useRef } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import useMainStore from "../store/MainStore.jsx";
import SquircleLoader from "./SquircleLoader.jsx";

const PlanSheet = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const MainStore = useMainStore((state) => state);
    const [projectPlans, setProjectPlans] = useState([]);
    const [globalPlans, setGlobalPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [showPlanDetails, setShowPlanDetails] = useState(null);
    const [currentProjectName, setCurrentProjectName] = useState("");
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectTehsilWarnings, setProjectTehsilWarnings] = useState(
        new Map(),
    );

    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showVillageFilter, setShowVillageFilter] = useState(false);
    const [showFacilitatorFilter, setShowFacilitatorFilter] = useState(false);
    const [selectedVillageFilter, setSelectedVillageFilter] = useState(null);
    const [selectedFacilitatorFilter, setSelectedFacilitatorFilter] =
        useState(null);
    const [manuallyCleared, setManuallyCleared] = useState(false);

    const filterMenuRef = useRef(null);

    const userData = authService.getUserData();
    const organizationName = authService.getOrganization();
    const isSuperAdmin = userData?.is_superadmin || false;
    const isOrgAdmin =
        userData?.groups?.some((group) => group.name === "Administrator") ||
        false;
    const blockId = searchParams.get("block_id");

    // MARK: Super Admin
    const fetchGlobalPlans = useCallback(async () => {
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}watershed/plans/?block=${blockId}`;
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
                        const projectPlans = plans.filter(
                            (plan) => plan.project === project.id,
                        );
                        const hasMatchingPlans = projectPlans.some(
                            (plan) =>
                                plan.block === blockId ||
                                plan.block === parseInt(blockId),
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
                    url += `?block=${blockId}`;
                }

                const response =
                    await authService.makeAuthenticatedRequest(url);

                if (response.ok) {
                    let plans = await response.json();

                    if (blockId && plans.length > 0) {
                        const hasBlockProperty = plans.some((plan) =>
                            Object.prototype.hasOwnProperty.call(plan, "block"),
                        );
                        if (hasBlockProperty) {
                            const allPlansMatchBlock = plans.every(
                                (plan) =>
                                    plan.block === blockId ||
                                    plan.block === parseInt(blockId),
                            );

                            if (!allPlansMatchBlock) {
                                plans = plans.filter(
                                    (plan) =>
                                        plan.block === blockId ||
                                        plan.block === parseInt(blockId),
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
                let url = `${import.meta.env.VITE_API_URL}projects/${projectId}/watershed/plans/`;
                const response =
                    await authService.makeAuthenticatedRequest(url);

                if (response.ok) {
                    const plans = await response.json();
                    const hasMatchingPlans = plans.some(
                        (plan) =>
                            plan.block === blockId ||
                            plan.block === parseInt(blockId),
                    );
                    return hasMatchingPlans;
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

            if (blockId && (isSuperAdmin || isOrgAdmin)) {
                const warningsMap = new Map();
                for (const project of projects) {
                    const hasMatch = await checkProjectTehsilMatch(project.id);
                    if (!hasMatch) {
                        warningsMap.set(project.id, true);
                    }
                }
                setProjectTehsilWarnings(warningsMap);
            }

            setAvailableProjects(projects);
            setShowProjectSelector(true);
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
                        url += `?block=${blockId}`;
                    }

                    const response =
                        await authService.makeAuthenticatedRequest(url);

                    if (response.ok) {
                        let plans = await response.json();

                        if (blockId && plans.length > 0) {
                            const hasBlockProperty = plans.some((plan) =>
                                Object.prototype.hasOwnProperty.call(
                                    plan,
                                    "block",
                                ),
                            );
                            if (hasBlockProperty) {
                                const allPlansMatchBlock = plans.every(
                                    (plan) =>
                                        plan.block === blockId ||
                                        plan.block === parseInt(blockId),
                                );

                                if (!allPlansMatchBlock) {
                                    plans = plans.filter(
                                        (plan) =>
                                            plan.block === blockId ||
                                            plan.block === parseInt(blockId),
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
            } else if (isOrgAdmin && userData?.project_details) {
                handleOrgAdminProjects();
            } else if (userData?.project_details) {
                fetchAllProjectPlans();
            }
        } else {
            setProjectTehsilWarnings(new Map());
        }
    }, [
        isOpen,
        userData,
        isSuperAdmin,
        isOrgAdmin,
        blockId,
        fetchGlobalPlans,
        handleOrgAdminProjects,
        fetchAllProjectPlans,
    ]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                filterMenuRef.current &&
                !filterMenuRef.current.contains(event.target) &&
                !event.target.closest("button[data-filter-button]")
            ) {
                setShowFilterMenu(false);
                setShowVillageFilter(false);
                setShowFacilitatorFilter(false);
            }
        };

        if (showFilterMenu || showVillageFilter || showFacilitatorFilter) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [showFilterMenu, showVillageFilter, showFacilitatorFilter]);

    useEffect(() => {
        if (MainStore.currentPlan?.id) {
            setSelectedPlanId(MainStore.currentPlan.id);
        }
    }, [MainStore.currentPlan]);

    useEffect(() => {
        if (
            !isSuperAdmin &&
            !isOrgAdmin &&
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
        selectedFacilitatorFilter,
        manuallyCleared,
    ]);

    const fetchPlanDetails = async (projectId, planId, projectName) => {
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
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlanId(plan.id);

        if (isSuperAdmin || isOrgAdmin) {
            const currentPlans = MainStore.plans || [];
            const planExists = currentPlans.find((p) => p.id === plan.id);

            if (!planExists) {
                useMainStore.setState((state) => ({
                    plans: [...(state.plans || []), plan],
                }));
            }
        }

        MainStore.setCurrentPlan(plan.id);

        onClose();
    };

    const handleProjectSelection = (project) => {
        setSelectedProject(project);
        setShowProjectSelector(false);

        if (isOrgAdmin) {
            fetchOrgAdminPlans(project.id);
        }
    };

    const getFilteredPlans = () => {
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
    };

    const getUniqueVillages = () => {
        const allPlans = isSuperAdmin
            ? getFilteredPlans()
            : projectPlans.flatMap((project) => project.plans);
        const villages = [
            ...new Set(
                allPlans.map((plan) => plan.village_name).filter(Boolean),
            ),
        ];
        return villages.sort();
    };

    const getUniqueFacilitators = () => {
        const allPlans = isSuperAdmin
            ? getFilteredPlans()
            : projectPlans.flatMap((project) => project.plans);
        const facilitators = [
            ...new Set(
                allPlans.map((plan) => plan.facilitator_name).filter(Boolean),
            ),
        ];
        return facilitators.sort();
    };

    // MARK: check test plans
    const isTestPlan = (plan) => {
        const planName = plan.plan?.toLowerCase() || "";
        return planName.includes("test plan") || planName.includes("test");
    };

    const applyFilters = (plans) => {
        const testPlans = plans.filter(isTestPlan);
        const regularPlans = plans.filter((plan) => !isTestPlan(plan));

        let filteredRegularPlans = [...regularPlans];

        if (selectedVillageFilter) {
            filteredRegularPlans = filteredRegularPlans.filter(
                (plan) => plan.village_name === selectedVillageFilter,
            );
        }

        if (selectedFacilitatorFilter) {
            filteredRegularPlans = filteredRegularPlans.filter(
                (plan) => plan.facilitator_name === selectedFacilitatorFilter,
            );
        }

        return {
            regularPlans: filteredRegularPlans,
            testPlans: testPlans,
            hasTestPlans: testPlans.length > 0,
        };
    };

    const clearFilters = () => {
        setSelectedVillageFilter(null);
        setSelectedFacilitatorFilter(null);
        setManuallyCleared(true);
        setShowFilterMenu(false);
        setShowVillageFilter(false);
        setShowFacilitatorFilter(false);
    };

    const toggleFilterMenu = () => {
        if (showFilterMenu || showVillageFilter || showFacilitatorFilter) {
            setShowFilterMenu(false);
            setShowVillageFilter(false);
            setShowFacilitatorFilter(false);
        } else {
            setShowFilterMenu(true);
        }
    };

    const FilterMenu = () => {
        if (!showFilterMenu) return null;

        const isRegularUser = !isSuperAdmin && !isOrgAdmin;
        const hasActiveFilters =
            selectedVillageFilter || selectedFacilitatorFilter;

        return (
            <div
                ref={filterMenuRef}
                className="absolute top-10 right-0 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 min-w-56 max-h-96 overflow-y-auto"
            >
                {/* For regular users, show clear filters prominently at the top */}
                {isRegularUser &&
                    hasActiveFilters &&
                    !showVillageFilter &&
                    !showFacilitatorFilter && (
                        <div className="py-2 border-b border-gray-100">
                            <button
                                onClick={clearFilters}
                                className="w-full px-5 py-3 text-left hover:bg-red-50 text-red-600 font-medium rounded-xl mx-2"
                            >
                                {t("Clear all filters")}
                            </button>
                        </div>
                    )}

                {/* Main filter options */}
                {!showVillageFilter && !showFacilitatorFilter && (
                    <div className="py-3">
                        <button
                            onClick={() => setShowVillageFilter(true)}
                            className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center justify-between rounded-xl mx-2"
                        >
                            <span>{t("Filter by village")}</span>
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
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={() => setShowFacilitatorFilter(true)}
                            className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center justify-between rounded-xl mx-2"
                        >
                            <span>{t("Filter by facilitator")}</span>
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
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                        {/* For superadmin and orgadmin, show clear filters at the bottom */}
                        {!isRegularUser && hasActiveFilters && (
                            <>
                                <hr className="my-3" />
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-5 py-3 text-left hover:bg-gray-50 text-red-600 rounded-xl mx-2"
                                >
                                    {t("Clear all filters")}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Village filter submenu */}
                {showVillageFilter && (
                    <div className="py-3">
                        <div className="px-5 py-3 bg-gray-50 flex items-center justify-between rounded-t-2xl">
                            <span className="font-medium text-base">
                                {t("Select Village")}
                            </span>
                            <button
                                onClick={() => setShowVillageFilter(false)}
                                className="text-gray-400 hover:text-gray-600"
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
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                            {getUniqueVillages().map((village) => (
                                <button
                                    key={village}
                                    onClick={() => {
                                        setSelectedVillageFilter(village);
                                        setShowFilterMenu(false);
                                        setShowVillageFilter(false);
                                    }}
                                    className={`w-full px-5 py-3 text-left hover:bg-gray-50 text-base rounded-xl mx-2 my-1 ${
                                        selectedVillageFilter === village
                                            ? "bg-blue-50 text-blue-600"
                                            : ""
                                    }`}
                                >
                                    {village}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Facilitator filter submenu */}
                {showFacilitatorFilter && (
                    <div className="py-3">
                        <div className="px-5 py-3 bg-gray-50 flex items-center justify-between rounded-t-2xl">
                            <span className="font-medium text-base">
                                {t("Select Facilitator")}
                            </span>
                            <button
                                onClick={() => setShowFacilitatorFilter(false)}
                                className="text-gray-400 hover:text-gray-600"
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
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                            {getUniqueFacilitators().map((facilitator) => (
                                <button
                                    key={facilitator}
                                    onClick={() => {
                                        setSelectedFacilitatorFilter(
                                            facilitator,
                                        );
                                        setShowFilterMenu(false);
                                        setShowFacilitatorFilter(false);
                                    }}
                                    className={`w-full px-5 py-3 text-left hover:bg-gray-50 text-base rounded-xl mx-2 my-1 ${
                                        selectedFacilitatorFilter ===
                                        facilitator
                                            ? "bg-blue-50 text-blue-600"
                                            : ""
                                    }`}
                                >
                                    {facilitator}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (showProjectSelector && availableProjects.length > 1) {
        return (
            <BottomSheet
                open={isOpen}
                onDismiss={() => setShowProjectSelector(false)}
                defaultSnap={({ maxHeight }) => maxHeight * 0.8}
                snapPoints={({ maxHeight }) => [maxHeight * 0.8]}
            >
                <div className="p-6 pb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isOrgAdmin
                                ? t("Select Organization Project")
                                : t("Select Project")}
                        </h2>
                        <button
                            onClick={() => setShowProjectSelector(false)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {blockId &&
                        (isSuperAdmin || isOrgAdmin) &&
                        projectTehsilWarnings.size > 0 && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start space-x-2">
                                    <svg
                                        className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">
                                            {t(
                                                "Some projects are not for Tehsil ID",
                                            )}{" "}
                                            {blockId}
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            {t(
                                                "Please select the right Tehsil to view plans from the respective projects.",
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    <div className="space-y-3">
                        {availableProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleProjectSelection(project)}
                                className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                                    projectTehsilWarnings.has(project.id)
                                        ? "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100"
                                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-medium text-gray-900">
                                                {project.name}
                                            </h3>
                                            {projectTehsilWarnings.has(
                                                project.id,
                                            ) && (
                                                <svg
                                                    className="w-4 h-4 text-amber-500"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {project.organization_name}
                                        </p>
                                        {projectTehsilWarnings.has(
                                            project.id,
                                        ) &&
                                            blockId && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    {t(
                                                        "No plans found for Tehsil ID:",
                                                    )}{" "}
                                                    {blockId}
                                                </p>
                                            )}
                                    </div>
                                    {isSuperAdmin && (
                                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {project.count} plans
                                        </div>
                                    )}
                                    {isOrgAdmin && (
                                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {t("View Plans")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Option to view plans without projects - only for super admins */}
                        {isSuperAdmin &&
                            globalPlans.filter((plan) => !plan.project).length >
                                0 && (
                                <div
                                    onClick={() => {
                                        setSelectedProject(null);
                                        setShowProjectSelector(false);
                                    }}
                                    className="border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                Plans without Project
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Unassigned plans
                                            </p>
                                        </div>
                                        <div className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {
                                                globalPlans.filter(
                                                    (plan) => !plan.project,
                                                ).length
                                            }{" "}
                                            plans
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </BottomSheet>
        );
    }

    if (showPlanDetails) {
        return (
            <BottomSheet
                open={isOpen}
                onDismiss={() => setShowPlanDetails(null)}
                defaultSnap={({ maxHeight }) => maxHeight * 1.0}
                snapPoints={({ maxHeight }) => [maxHeight * 1.0]}
            >
                <div className="p-6 pb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {t("Plan Details")}
                        </h2>
                        <button
                            onClick={() => setShowPlanDetails(null)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 rounded-2xl p-6 mb-4">
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        {t("Organization")}
                                    </div>
                                    <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {isSuperAdmin
                                            ? showPlanDetails.organization_name
                                            : organizationName}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        {t("Project")}
                                    </div>
                                    <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {currentProjectName ||
                                            "No Project Assigned"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {showPlanDetails.plan}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="font-medium text-gray-600">
                                        {t("Plan ID")}:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {showPlanDetails.id}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">
                                        {t("Village")}:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {showPlanDetails.village_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">
                                        {t("Gram Panchayat")}:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {showPlanDetails.gram_panchayat}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">
                                        {t("Facilitator")}:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {showPlanDetails.facilitator_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">
                                        {t("Created At")}:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {formatDate(showPlanDetails.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4">
                            <h4 className="font-medium text-gray-900 mb-3">
                                {t("Status")}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_completed ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>{t("Plan Completed")}</span>
                                </div>
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_dpr_generated ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>{t("DPR Generated")}</span>
                                </div>
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_dpr_reviewed ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>{t("DPR Reviewed")}</span>
                                </div>
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_dpr_approved ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>{t("DPR Approved")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                            {t("Location Details")}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                                <span className="font-medium text-gray-600">
                                    {t("State ID")}:
                                </span>
                                <span className="ml-2 text-gray-900">
                                    {showPlanDetails.state}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">
                                    {t("District ID")}:
                                </span>
                                <span className="ml-2 text-gray-900">
                                    {showPlanDetails.district}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">
                                    {t("Tehsil ID")}:
                                </span>
                                <span className="ml-2 text-gray-900">
                                    {showPlanDetails.block}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </BottomSheet>
        );
    }

    return (
        <BottomSheet
            open={isOpen}
            onDismiss={onClose}
            defaultSnap={({ maxHeight }) => maxHeight * 0.8}
            snapPoints={({ maxHeight }) => [maxHeight * 0.8]}
        >
            <div className="p-6 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t("Select Plan")}{" "}
                        {isSuperAdmin &&
                            blockId &&
                            `(${t("Tehsil ID")}: ${blockId})`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <SquircleLoader
                            size={32}
                            strokeWidth={3}
                            color="#2563eb"
                            backgroundColor="rgba(37, 99, 235, 0.2)"
                            speed={1500}
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Superadmin view */}
                        {isSuperAdmin && blockId ? (
                            <>
                                {/* Project selector button if multiple projects */}
                                {availableProjects.length > 1 && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() =>
                                                setShowProjectSelector(true)
                                            }
                                            className="w-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-2xl p-4 text-left hover:from-purple-200 hover:to-blue-200 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-gray-600 mb-1">
                                                        {t("Current Project")}
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {selectedProject
                                                            ? selectedProject.name
                                                            : t(
                                                                  "Select Project",
                                                              )}
                                                    </div>
                                                </div>
                                                <svg
                                                    className="w-5 h-5 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Global plans display */}
                                <div className="bg-white">
                                    <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 rounded-2xl p-6 mb-2">
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">
                                                    {t("Organization")}
                                                </div>
                                                <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {selectedProject
                                                        ? selectedProject.organization_name
                                                        : "Global Access"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">
                                                    {t("Project")}
                                                </div>
                                                <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {selectedProject
                                                        ? selectedProject.name
                                                        : "All Projects"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center mb-4">
                                        <div className="text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full inline-block">
                                            {t("Super Administrator")}
                                        </div>
                                    </div>

                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {t("Plans")} ({t("Tehsil ID")}:{" "}
                                            {blockId})
                                        </h3>
                                        <div className="relative">
                                            <button
                                                data-filter-button
                                                onClick={toggleFilterMenu}
                                                className={`p-2 rounded-lg border transition-colors ${
                                                    selectedVillageFilter ||
                                                    selectedFacilitatorFilter
                                                        ? "bg-blue-50 border-blue-200 text-blue-600"
                                                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                }`}
                                            >
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
                                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                                                    />
                                                </svg>
                                            </button>
                                            <FilterMenu />
                                        </div>
                                    </div>

                                    {/* Active filters indicator */}
                                    {(selectedVillageFilter ||
                                        selectedFacilitatorFilter) && (
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            {selectedVillageFilter && (
                                                <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                    <span>
                                                        Village:{" "}
                                                        {selectedVillageFilter}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            setSelectedVillageFilter(
                                                                null,
                                                            )
                                                        }
                                                        className="ml-2 hover:text-blue-900"
                                                    >
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            {selectedFacilitatorFilter && (
                                                <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                                    <span>
                                                        Facilitator:{" "}
                                                        {
                                                            selectedFacilitatorFilter
                                                        }
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            setSelectedFacilitatorFilter(
                                                                null,
                                                            )
                                                        }
                                                        className="ml-2 hover:text-green-900"
                                                    >
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {/* Regular Plans */}
                                        {applyFilters(
                                            getFilteredPlans(),
                                        ).regularPlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className={`border rounded-2xl p-4 transition-all ${
                                                    selectedPlanId === plan.id
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="flex-1 cursor-pointer"
                                                        onClick={() =>
                                                            handlePlanSelect(
                                                                plan,
                                                                plan.project,
                                                                plan.project_name,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="flex-1">
                                                                <div className="flex items-center">
                                                                    <h3 className="font-medium text-gray-900 mr-2">
                                                                        {
                                                                            plan.plan
                                                                        }
                                                                    </h3>
                                                                    {selectedPlanId ===
                                                                        plan.id && (
                                                                        <svg
                                                                            className="w-5 h-5 text-blue-600"
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
                                                                </div>
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    {
                                                                        plan.village_name
                                                                    }{" "}
                                                                    •{" "}
                                                                    {
                                                                        plan.facilitator_name
                                                                    }
                                                                </div>
                                                                {plan.project_name && (
                                                                    <div className="text-xs text-blue-600 mt-1">
                                                                        Project:{" "}
                                                                        {
                                                                            plan.project_name
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            fetchPlanDetails(
                                                                plan.project,
                                                                plan.id,
                                                                plan.project_name,
                                                                plan.organization_name,
                                                            );
                                                        }}
                                                        className="ml-3 p-1 hover:bg-gray-100 rounded-full"
                                                        title="View Details"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 text-gray-500"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Test Plans Section */}
                                    {applyFilters(getFilteredPlans())
                                        .hasTestPlans && (
                                        <>
                                            {/* Horizontal line separator */}
                                            <hr className="my-4 border-gray-300" />

                                            {/* Test Plans Header */}
                                            <div className="mb-3">
                                                <h4 className="text-md font-semibold text-gray-900 mb-1">
                                                    {t(
                                                        "Test Plans: For training and practice purposes",
                                                    )}
                                                </h4>
                                            </div>

                                            {/* Test Plans */}
                                            {applyFilters(
                                                getFilteredPlans(),
                                            ).testPlans.map((plan) => (
                                                <div
                                                    key={plan.id}
                                                    className={`border border-red-500 rounded-2xl p-4 mb-2 transition-all ${
                                                        selectedPlanId ===
                                                        plan.id
                                                            ? "border-red-600 bg-red-50"
                                                            : "border-red-500 hover:border-red-600"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div
                                                            className="flex-1 cursor-pointer"
                                                            onClick={() =>
                                                                handlePlanSelect(
                                                                    plan,
                                                                    plan.project,
                                                                    plan.project_name,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center">
                                                                        <h3 className="font-medium text-gray-900 mr-2">
                                                                            {
                                                                                plan.plan
                                                                            }
                                                                        </h3>
                                                                        {selectedPlanId ===
                                                                            plan.id && (
                                                                            <svg
                                                                                className="w-5 h-5 text-blue-600"
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
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        {
                                                                            plan.village_name
                                                                        }{" "}
                                                                        •{" "}
                                                                        {
                                                                            plan.facilitator_name
                                                                        }
                                                                    </div>
                                                                    {plan.project_name && (
                                                                        <div className="text-xs text-blue-600 mt-1">
                                                                            Project:{" "}
                                                                            {
                                                                                plan.project_name
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                fetchPlanDetails(
                                                                    plan.project,
                                                                    plan.id,
                                                                    plan.project_name,
                                                                    plan.organization_name,
                                                                );
                                                            }}
                                                            className="ml-3 p-1 hover:bg-gray-100 rounded-full"
                                                            title="View Details"
                                                        >
                                                            <svg
                                                                className="w-4 h-4 text-gray-500"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {applyFilters(getFilteredPlans())
                                        .regularPlans.length === 0 &&
                                        !applyFilters(getFilteredPlans())
                                            .hasTestPlans &&
                                        !loading && (
                                            <div className="text-center py-8 text-gray-500">
                                                {!blockId
                                                    ? "No tehsil ID provided in URL"
                                                    : selectedProject
                                                      ? `No plans found for ${selectedProject.name} in tehsil ${blockId}`
                                                      : `No plans found for tehsil ${blockId}`}
                                            </div>
                                        )}
                                </div>
                            </>
                        ) : isSuperAdmin && !blockId ? (
                            <div className="text-center py-8 text-gray-500">
                                {t(
                                    "No tehsil ID provided, please contact: support@core-stack.org",
                                )}
                            </div>
                        ) : isOrgAdmin ? (
                            /* Organization Admin view */
                            <>
                                {/* Project selector button for org admins with multiple projects */}
                                {userData?.project_details?.length > 1 && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() =>
                                                setShowProjectSelector(true)
                                            }
                                            className="w-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-2xl p-4 text-left hover:from-purple-200 hover:to-blue-200 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-gray-600 mb-1">
                                                        {t("Current Project")}
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {selectedProject
                                                            ? selectedProject.name
                                                            : t(
                                                                  "Select Project",
                                                              )}
                                                    </div>
                                                </div>
                                                <svg
                                                    className="w-5 h-5 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {projectPlans.map(
                                    (projectData, projectIndex) => (
                                        <div
                                            key={projectData.projectId}
                                            className="bg-white"
                                        >
                                            <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 rounded-2xl p-6 mb-2">
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            {t("Organization")}
                                                        </div>
                                                        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {organizationName}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            {t("Project")}
                                                        </div>
                                                        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {
                                                                projectData.projectName
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-center mb-4">
                                                <div className="text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-block">
                                                    {t(
                                                        "Organization Administrator",
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {t("Plans")}
                                                </h3>
                                                <div className="relative">
                                                    <button
                                                        data-filter-button
                                                        onClick={
                                                            toggleFilterMenu
                                                        }
                                                        className={`p-2 rounded-lg border transition-colors ${
                                                            selectedVillageFilter ||
                                                            selectedFacilitatorFilter
                                                                ? "bg-blue-50 border-blue-200 text-blue-600"
                                                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                        }`}
                                                    >
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
                                                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <FilterMenu />
                                                </div>
                                            </div>

                                            {/* Active filters indicator */}
                                            {(selectedVillageFilter ||
                                                selectedFacilitatorFilter) && (
                                                <div className="mb-3 flex flex-wrap gap-2">
                                                    {selectedVillageFilter && (
                                                        <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                            <span>
                                                                {t("Village")}:{" "}
                                                                {
                                                                    selectedVillageFilter
                                                                }
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedVillageFilter(
                                                                        null,
                                                                    )
                                                                }
                                                                className="ml-2 hover:text-blue-900"
                                                            >
                                                                <svg
                                                                    className="w-3 h-3"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {selectedFacilitatorFilter && (
                                                        <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                                            <span>
                                                                Facilitator:{" "}
                                                                {
                                                                    selectedFacilitatorFilter
                                                                }
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedFacilitatorFilter(
                                                                        null,
                                                                    )
                                                                }
                                                                className="ml-2 hover:text-green-900"
                                                            >
                                                                <svg
                                                                    className="w-3 h-3"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                {/* Regular Plans */}
                                                {applyFilters(
                                                    projectData.plans,
                                                ).regularPlans.map((plan) => (
                                                    <div
                                                        key={plan.id}
                                                        className={`border rounded-2xl p-4 transition-all ${
                                                            selectedPlanId ===
                                                            plan.id
                                                                ? "border-blue-500 bg-blue-50"
                                                                : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div
                                                                className="flex-1 cursor-pointer"
                                                                onClick={() =>
                                                                    handlePlanSelect(
                                                                        plan,
                                                                        projectData.projectId,
                                                                        projectData.projectName,
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center">
                                                                            <h3 className="font-medium text-gray-900 mr-2">
                                                                                {
                                                                                    plan.plan
                                                                                }
                                                                            </h3>
                                                                            {selectedPlanId ===
                                                                                plan.id && (
                                                                                <svg
                                                                                    className="w-5 h-5 text-blue-600"
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
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 mt-1">
                                                                            {
                                                                                plan.village_name
                                                                            }{" "}
                                                                            •{" "}
                                                                            {
                                                                                plan.facilitator_name
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    fetchPlanDetails(
                                                                        projectData.projectId,
                                                                        plan.id,
                                                                        projectData.projectName,
                                                                    );
                                                                }}
                                                                className="ml-3 p-1 hover:bg-gray-100 rounded-full"
                                                                title="View Details"
                                                            >
                                                                <svg
                                                                    className="w-4 h-4 text-gray-500"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Test Plans Section */}
                                                {applyFilters(projectData.plans)
                                                    .hasTestPlans && (
                                                    <>
                                                        {/* Horizontal line separator */}
                                                        <hr className="my-4 border-gray-300" />

                                                        {/* Test Plans Header */}
                                                        <div className="mb-3">
                                                            <h4 className="text-md font-semibold text-gray-900 mb-1">
                                                                {t(
                                                                    "Test Plans: For training and practice purposes",
                                                                )}
                                                            </h4>
                                                        </div>

                                                        {/* Test Plans */}
                                                        {applyFilters(
                                                            projectData.plans,
                                                        ).testPlans.map(
                                                            (plan) => (
                                                                <div
                                                                    key={
                                                                        plan.id
                                                                    }
                                                                    className={`border border-red-500 rounded-2xl p-4 mb-2 transition-all ${
                                                                        selectedPlanId ===
                                                                        plan.id
                                                                            ? "border-red-600 bg-red-50"
                                                                            : "border-red-500 hover:border-red-600"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div
                                                                            className="flex-1 cursor-pointer"
                                                                            onClick={() =>
                                                                                handlePlanSelect(
                                                                                    plan,
                                                                                    projectData.projectId,
                                                                                    projectData.projectName,
                                                                                )
                                                                            }
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center">
                                                                                        <h3 className="font-medium text-gray-900 mr-2">
                                                                                            {
                                                                                                plan.plan
                                                                                            }
                                                                                        </h3>
                                                                                        {selectedPlanId ===
                                                                                            plan.id && (
                                                                                            <svg
                                                                                                className="w-5 h-5 text-blue-600"
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
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                                        {
                                                                                            plan.village_name
                                                                                        }{" "}
                                                                                        •{" "}
                                                                                        {
                                                                                            plan.facilitator_name
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                fetchPlanDetails(
                                                                                    projectData.projectId,
                                                                                    plan.id,
                                                                                    projectData.projectName,
                                                                                );
                                                                            }}
                                                                            className="ml-3 p-1 hover:bg-gray-100 rounded-full"
                                                                            title="View Details"
                                                                        >
                                                                            <svg
                                                                                className="w-4 h-4 text-gray-500"
                                                                                fill="currentColor"
                                                                                viewBox="0 0 20 20"
                                                                            >
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {projectIndex <
                                                projectPlans.length - 1 && (
                                                <hr className="my-6 border-gray-200" />
                                            )}
                                        </div>
                                    ),
                                )}

                                {projectPlans.length === 0 && !loading && (
                                    <div className="text-center py-8 text-gray-500">
                                        {userData?.project_details?.length >
                                            1 && !selectedProject
                                            ? "Select a project to view its plans."
                                            : "No plans found for the selected project."}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Regular user view - keep existing functionality intact */
                            <>
                                {projectPlans.map(
                                    (projectData, projectIndex) => (
                                        <div
                                            key={projectData.projectId}
                                            className="bg-white"
                                        >
                                            <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 rounded-2xl p-6 mb-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            {t("Organization")}
                                                        </div>
                                                        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {organizationName}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            {t("Project")}
                                                        </div>
                                                        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {
                                                                projectData.projectName
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {t("Plans")}
                                                </h3>
                                                <div className="relative">
                                                    <button
                                                        data-filter-button
                                                        onClick={
                                                            toggleFilterMenu
                                                        }
                                                        className={`p-2 rounded-lg border transition-colors ${
                                                            selectedVillageFilter ||
                                                            selectedFacilitatorFilter
                                                                ? "bg-blue-50 border-blue-200 text-blue-600"
                                                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                        }`}
                                                    >
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
                                                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <FilterMenu />
                                                </div>
                                            </div>

                                            {/* Active filters indicator */}
                                            {(selectedVillageFilter ||
                                                selectedFacilitatorFilter) && (
                                                <div className="mb-3 flex flex-wrap gap-2">
                                                    {selectedVillageFilter && (
                                                        <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                            <span>
                                                                {t("Village")}:{" "}
                                                                {
                                                                    selectedVillageFilter
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedFacilitatorFilter && (
                                                        <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                                            <span>
                                                                {t(
                                                                    "Facilitator",
                                                                )}
                                                                :{" "}
                                                                {
                                                                    selectedFacilitatorFilter
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                {/* Regular Plans */}
                                                {applyFilters(
                                                    projectData.plans,
                                                ).regularPlans.map((plan) => (
                                                    <div
                                                        key={plan.id}
                                                        className={`border rounded-2xl p-4 transition-all ${
                                                            selectedPlanId ===
                                                            plan.id
                                                                ? "border-blue-500 bg-blue-50"
                                                                : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div
                                                                className="flex-1 cursor-pointer"
                                                                onClick={() =>
                                                                    handlePlanSelect(
                                                                        plan,
                                                                        projectData.projectId,
                                                                        projectData.projectName,
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center">
                                                                            <h3 className="font-medium text-gray-900 mr-2">
                                                                                {
                                                                                    plan.plan
                                                                                }
                                                                            </h3>
                                                                            {selectedPlanId ===
                                                                                plan.id && (
                                                                                <svg
                                                                                    className="w-5 h-5 text-blue-600"
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
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 mt-1">
                                                                            {
                                                                                plan.village_name
                                                                            }{" "}
                                                                            •{" "}
                                                                            {
                                                                                plan.facilitator_name
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    fetchPlanDetails(
                                                                        projectData.projectId,
                                                                        plan.id,
                                                                        projectData.projectName,
                                                                    );
                                                                }}
                                                                className="ml-3 p-1 hover:bg-gray-100 rounded-full"
                                                                title="View Details"
                                                            >
                                                                <svg
                                                                    className="w-4 h-4 text-gray-500"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Test Plans Section */}
                                                {applyFilters(projectData.plans)
                                                    .hasTestPlans && (
                                                    <>
                                                        {/* Horizontal line separator */}
                                                        <hr className="my-4 border-gray-300" />

                                                        {/* Test Plans Header */}
                                                        <div className="mb-3">
                                                            <h4 className="text-md font-semibold text-gray-900 mb-1">
                                                                {t(
                                                                    "Test Plans: For training and practice purposes",
                                                                )}
                                                            </h4>
                                                        </div>

                                                        {/* Test Plans */}
                                                        {applyFilters(
                                                            projectData.plans,
                                                        ).testPlans.map(
                                                            (plan) => (
                                                                <div
                                                                    key={
                                                                        plan.id
                                                                    }
                                                                    className={`border border-red-500 rounded-2xl p-4 mb-2 transition-all ${
                                                                        selectedPlanId ===
                                                                        plan.id
                                                                            ? "border-red-600 bg-red-50"
                                                                            : "border-red-500 hover:border-red-600"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div
                                                                            className="flex-1 cursor-pointer"
                                                                            onClick={() =>
                                                                                handlePlanSelect(
                                                                                    plan,
                                                                                    projectData.projectId,
                                                                                    projectData.projectName,
                                                                                )
                                                                            }
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center">
                                                                                        <h3 className="font-medium text-gray-900 mr-2">
                                                                                            {
                                                                                                plan.plan
                                                                                            }
                                                                                        </h3>
                                                                                        {selectedPlanId ===
                                                                                            plan.id && (
                                                                                            <svg
                                                                                                className="w-5 h-5 text-blue-600"
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
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                                        {
                                                                                            plan.village_name
                                                                                        }{" "}
                                                                                        •{" "}
                                                                                        {
                                                                                            plan.facilitator_name
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                fetchPlanDetails(
                                                                                    projectData.projectId,
                                                                                    plan.id,
                                                                                    projectData.projectName,
                                                                                );
                                                                            }}
                                                                            className="ml-3 p-1 hover:bg-gray-100 rounded-full"
                                                                            title="View Details"
                                                                        >
                                                                            <svg
                                                                                className="w-4 h-4 text-gray-500"
                                                                                fill="currentColor"
                                                                                viewBox="0 0 20 20"
                                                                            >
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {projectIndex <
                                                projectPlans.length - 1 && (
                                                <hr className="my-6 border-gray-200" />
                                            )}
                                        </div>
                                    ),
                                )}

                                {projectPlans.length === 0 && !loading && (
                                    <div className="text-center py-8 text-gray-500">
                                        {t("No plans found for your projects.")}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </BottomSheet>
    );
};

export default PlanSheet;
