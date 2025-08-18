import React, { useState, useEffect } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { useTranslation } from "react-i18next";
import authService from "../services/authService";
import useMainStore from "../store/MainStore.jsx";
import SquircleLoader from "./SquircleLoader.jsx";

const PlanSheet = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const [projectPlans, setProjectPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [showPlanDetails, setShowPlanDetails] = useState(null);
    const [currentProjectName, setCurrentProjectName] = useState("");

    const userData = authService.getUserData();
    const organizationName = authService.getOrganization();

    useEffect(() => {
        if (isOpen && userData?.project_details) {
            fetchAllProjectPlans();
        }
    }, [isOpen, userData]);

    useEffect(() => {
        if (MainStore.currentPlan?.id) {
            setSelectedPlanId(MainStore.currentPlan.id);
        }
    }, [MainStore.currentPlan]);

    const fetchAllProjectPlans = async () => {
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
                        const errorText = await response.text();
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
    };

    const fetchPlanDetails = async (projectId, planId, projectName) => {
        try {
            const url = `${import.meta.env.VITE_API_URL}projects/${projectId}/watershed/plans/${planId}/`;
            const response = await authService.makeAuthenticatedRequest(url);

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
        } catch (error) {
            console.error("Error fetching plan details:", error);
        }
    };

    const handlePlanSelect = (plan, projectId, projectName) => {
        setSelectedPlanId(plan.id);
        MainStore.setCurrentPlan(plan.id);
        onClose();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (showPlanDetails) {
        return (
            <BottomSheet
                open={isOpen}
                onDismiss={() => setShowPlanDetails(null)}
                defaultSnap={({ maxHeight }) => maxHeight * 0.8}
                snapPoints={({ maxHeight }) => [maxHeight * 0.8]}
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
                                        {organizationName}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        Project
                                    </div>
                                    <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {currentProjectName}
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
                        {t("Select Plan")}
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
                        {projectPlans.map((projectData, projectIndex) => (
                            <div
                                key={projectData.projectId}
                                className="bg-white"
                            >
                                {/* Combined Organization and Project Header */}
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
                                                {projectData.projectName}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Plans Header */}
                                <div className="mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Plans
                                    </h3>
                                </div>

                                {/* Plans List */}
                                <div className="space-y-2">
                                    {projectData.plans.map((plan) => (
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
                                                            projectData.projectId,
                                                            projectData.projectName,
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-center">
                                                        <div className="flex-1">
                                                            <div className="flex items-center">
                                                                <h3 className="font-medium text-gray-900 mr-2">
                                                                    {plan.plan}
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

                                                {/* Info Button */}
                                                <button
                                                    onClick={(e) => {
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
                                </div>

                                {/* Divider between projects */}
                                {projectIndex < projectPlans.length - 1 && (
                                    <hr className="my-6 border-gray-200" />
                                )}
                            </div>
                        ))}

                        {projectPlans.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                No plans found for your projects.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </BottomSheet>
    );
};

export default PlanSheet;
