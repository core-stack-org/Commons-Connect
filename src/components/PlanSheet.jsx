import React, { useState, useEffect, useCallback } from "react";
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

    const userData = authService.getUserData();
    const organizationName = authService.getOrganization();
    const isSuperAdmin = userData?.is_superadmin || false;
    const isOrgAdmin =
        userData?.groups?.some((group) => group.name === "Administrator") ||
        false;
    const blockId = searchParams.get("block_id");

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

    const fetchOrgAdminPlans = useCallback(
        async (projectId) => {
            setLoading(true);
            try {
                const url = `${import.meta.env.VITE_API_URL}projects/${projectId}/watershed/plans/`;
                const response =
                    await authService.makeAuthenticatedRequest(url);

                if (response.ok) {
                    const plans = await response.json();
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
        [userData],
    );

    const handleOrgAdminProjects = useCallback(() => {
        if (userData?.project_details && userData.project_details.length > 1) {
            const projects = userData.project_details.map((project) => ({
                id: project.project_id,
                name: project.project_name,
                organization_name: organizationName,
            }));
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
    }, [userData, organizationName, fetchOrgAdminPlans]);

    const fetchAllProjectPlans = useCallback(async () => {
        setLoading(true);
        try {
            const allPlans = [];

            for (const project of userData.project_details) {
                try {
                    const url = `${import.meta.env.VITE_API_URL}projects/${project.project_id}/watershed/plans/`;
                    const response =
                        await authService.makeAuthenticatedRequest(url);

                    if (response.ok) {
                        const plans = await response.json();
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
    }, [userData]);

    useEffect(() => {
        if (isOpen) {
            if (isSuperAdmin && blockId) {
                fetchGlobalPlans();
            } else if (isOrgAdmin && userData?.project_details) {
                handleOrgAdminProjects();
            } else if (userData?.project_details) {
                fetchAllProjectPlans();
            }
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
        if (MainStore.currentPlan?.id) {
            setSelectedPlanId(MainStore.currentPlan.id);
        }
    }, [MainStore.currentPlan]);
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
        console.log("PlanSheet - Selecting plan:", plan);
        console.log("PlanSheet - Is superadmin:", isSuperAdmin);

        setSelectedPlanId(plan.id);

        if (isSuperAdmin) {
            console.log(
                "PlanSheet - Superadmin flow - Current store plans:",
                MainStore.plans,
            );

            const currentPlans = MainStore.plans || [];
            const planExists = currentPlans.find((p) => p.id === plan.id);
            console.log("PlanSheet - Plan exists in store:", planExists);

            if (!planExists) {
                console.log("PlanSheet - Adding plan to store");
                useMainStore.setState((state) => ({
                    plans: [...(state.plans || []), plan],
                }));
            }
        }

        console.log("PlanSheet - Calling setCurrentPlan with ID:", plan.id);
        MainStore.setCurrentPlan(plan.id);

        setTimeout(() => {
            console.log(
                "PlanSheet - Current plan after setting:",
                MainStore.currentPlan,
            );
        }, 100);

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
                defaultSnap={({ maxHeight }) => maxHeight * 0.7}
                snapPoints={({ maxHeight }) => [maxHeight * 0.7]}
            >
                <div className="p-6 pb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isOrgAdmin
                                ? "Select Organization Project"
                                : "Select Project"}
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

                    <div className="space-y-3">
                        {availableProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleProjectSelection(project)}
                                className="border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {project.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {project.organization_name}
                                        </p>
                                    </div>
                                    {isSuperAdmin && (
                                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {project.count} plans
                                        </div>
                                    )}
                                    {isOrgAdmin && (
                                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            View Plans
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
                defaultSnap={({ maxHeight }) => maxHeight * 0.9}
                snapPoints={({ maxHeight }) => [maxHeight * 0.9]}
            >
                <div className="p-6 pb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Plan Details
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
                                        Organization
                                    </div>
                                    <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {isSuperAdmin
                                            ? showPlanDetails.organization_name
                                            : organizationName}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        Project
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
                                        Village:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {showPlanDetails.village_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">
                                        Gram Panchayat:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {showPlanDetails.gram_panchayat}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">
                                        Facilitator:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {showPlanDetails.facilitator_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">
                                        Created:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {formatDate(showPlanDetails.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4">
                            <h4 className="font-medium text-gray-900 mb-3">
                                Status
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_completed ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>Completed</span>
                                </div>
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_dpr_generated ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>DPR Generated</span>
                                </div>
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_dpr_reviewed ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>DPR Reviewed</span>
                                </div>
                                <div className="flex items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full mr-2 ${showPlanDetails.is_dpr_approved ? "bg-green-500" : "bg-gray-300"}`}
                                    ></div>
                                    <span>DPR Approved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                            Location Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                                <span className="font-medium text-gray-600">
                                    State ID:
                                </span>
                                <span className="ml-2 text-gray-900">
                                    {showPlanDetails.state}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">
                                    District ID:
                                </span>
                                <span className="ml-2 text-gray-900">
                                    {showPlanDetails.district}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">
                                    Tehsil ID:
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
            defaultSnap={({ maxHeight }) => maxHeight * 0.7}
            snapPoints={({ maxHeight }) => [maxHeight * 0.7]}
        >
            <div className="p-6 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t("Select Plan")}{" "}
                        {isSuperAdmin && blockId && `(Tehsil: ${blockId})`}
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
                                                        Current Project
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {selectedProject
                                                            ? selectedProject.name
                                                            : "Select Project"}
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
                                                    Organization
                                                </div>
                                                <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {selectedProject
                                                        ? selectedProject.organization_name
                                                        : "Global Access"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">
                                                    Project
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
                                            Super Administrator
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Plans (Tehsil: {blockId})
                                        </h3>
                                    </div>

                                    <div className="space-y-2">
                                        {getFilteredPlans().map((plan) => (
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

                                    {getFilteredPlans().length === 0 &&
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
                                Please provide a tehsil ID in the URL (e.g.,
                                ?block=311011) to view plans.
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
                                                        Current Project
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {selectedProject
                                                            ? selectedProject.name
                                                            : "Select Project"}
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
                                                            Organization
                                                        </div>
                                                        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {organizationName}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            Project
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
                                                    Organization Administrator
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Plans
                                                </h3>
                                            </div>

                                            <div className="space-y-2">
                                                {projectData.plans.map(
                                                    (plan) => (
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
                                                    ),
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
                                                            Organization
                                                        </div>
                                                        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {organizationName}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            Project
                                                        </div>
                                                        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {
                                                                projectData.projectName
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Plans
                                                </h3>
                                            </div>

                                            <div className="space-y-2">
                                                {projectData.plans.map(
                                                    (plan) => (
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
                                                    ),
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
                                        No plans found for your projects.
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
