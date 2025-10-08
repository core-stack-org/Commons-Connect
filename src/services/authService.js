class AuthService {
    constructor() {
        this.authData = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.isDevelopment = import.meta.env.VITE_NODE_ENV === "development";
        this.useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === "true";
    }

    getMockAuthData() {
        return {
            access: "mock_access_token_for_development",
            refresh: "mock_refresh_token",
            user: {
                id: 1,
                first_name: "Dev",
                last_name: "User",
                email: "dev@example.com",
                organization_name: "Development Org",
                is_superadmin: true,
                project_details: [
                    {
                        project_id: 9,
                        project_name: "Development Project",
                    },
                ],
            },
        };
    }

    loadDevAuthFromStorage() {
        try {
            const storedAuth = localStorage.getItem("dev_auth_data");
            if (storedAuth) {
                return JSON.parse(storedAuth);
            }
        } catch (error) {
            console.warn("Failed to load auth from localStorage:", error);
        }
        return null;
    }

    saveDevAuthToStorage(authData) {
        try {
            localStorage.setItem("dev_auth_data", JSON.stringify(authData));
        } catch (error) {
            console.warn("Failed to save auth to localStorage:", error);
        }
    }

    setDevAuthData(authData) {
        if (this.isDevelopment) {
            this.authData = authData;
            this.isInitialized = true;
            this.saveDevAuthToStorage(authData);
            console.log("Development: Auth data set manually:", authData);
        }
    }

    clearDevAuthData() {
        if (this.isDevelopment) {
            this.authData = null;
            this.isInitialized = false;
            localStorage.removeItem("dev_auth_data");
            console.log("Development: Auth data cleared");
        }
    }

    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = new Promise((resolve) => {
            console.log("[AuthService] Starting initialization...");

            if (this.isDevelopment) {
                if (this.useMockAuth) {
                    this.authData = this.getMockAuthData();
                    this.isInitialized = true;
                    console.log(
                        "[AuthService] Development: Using mock auth data",
                    );
                    resolve(this.authData);
                    return;
                } else {
                    const storedAuth = this.loadDevAuthFromStorage();
                    if (storedAuth) {
                        this.authData = storedAuth;
                        this.isInitialized = true;
                        console.log(
                            "[AuthService] Development: Using stored auth data",
                        );
                        resolve(this.authData);
                        return;
                    }
                }
            }

            let resolved = false;

            const resolveOnce = (authData, source) => {
                if (!resolved) {
                    resolved = true;
                    this.authData = authData;
                    this.isInitialized = true;
                    console.log(
                        `[AuthService] ✓ Auth loaded from: ${source}`,
                        authData,
                    );
                    resolve(authData);
                }
            };

            // 1: Check if already available (immediate)
            if (window.flutterAuth) {
                console.log("[AuthService] Found immediate window.flutterAuth");
                resolveOnce(window.flutterAuth, "immediate-window");
                return;
            }

            if (
                window.getAuthToken &&
                typeof window.getAuthToken === "function"
            ) {
                const token = window.getAuthToken();
                const userData = window.getUserData
                    ? window.getUserData()
                    : null;
                if (token) {
                    console.log("[AuthService] Found immediate getAuthToken");
                    resolveOnce(
                        {
                            access_token: token,
                            user: userData,
                            timestamp: Date.now(),
                        },
                        "immediate-function",
                    );
                    return;
                }
            }

            // 2: Aggressive polling with exponential backoff
            let pollAttempt = 0;
            const maxPollAttempts = 200;

            const pollForAuth = () => {
                pollAttempt++;

                // Flutter Auth
                if (window.flutterAuth) {
                    console.log(
                        `[AuthService] Poll success (attempt ${pollAttempt}): window.flutterAuth`,
                    );
                    clearInterval(pollInterval);
                    resolveOnce(window.flutterAuth, `poll-${pollAttempt}`);
                    return;
                }

                if (
                    window.getAuthToken &&
                    typeof window.getAuthToken === "function"
                ) {
                    const token = window.getAuthToken();
                    if (token) {
                        console.log(
                            `[AuthService] Poll success (attempt ${pollAttempt}): getAuthToken`,
                        );
                        clearInterval(pollInterval);
                        const userData = window.getUserData
                            ? window.getUserData()
                            : null;
                        resolveOnce(
                            {
                                access_token: token,
                                user: userData,
                                timestamp: Date.now(),
                            },
                            `poll-function-${pollAttempt}`,
                        );
                        return;
                    }
                }

                // Log progress every 20 attempts (2 seconds)
                if (pollAttempt % 20 === 0) {
                    console.log(
                        `[AuthService] Still waiting for Flutter auth... (${pollAttempt} attempts, ${pollAttempt * 100}ms)`,
                    );
                }

                if (pollAttempt >= maxPollAttempts) {
                    console.warn(
                        `[AuthService] Polling timeout after ${pollAttempt} attempts`,
                    );
                    clearInterval(pollInterval);
                    this.handleAuthTimeout(resolve);
                }
            };

            const pollInterval = setInterval(pollForAuth, 100);

            // 3: Listen for page lifecycle events
            const checkOnVisibility = () => {
                if (!resolved && document.visibilityState === "visible") {
                    if (window.flutterAuth) {
                        console.log(
                            "[AuthService] Found auth on visibility change",
                        );
                        clearInterval(pollInterval);
                        resolveOnce(window.flutterAuth, "visibility-change");
                    }
                }
            };
            document.addEventListener("visibilitychange", checkOnVisibility);

            // 4: Check on DOMContentLoaded (if not already fired)
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => {
                    setTimeout(() => {
                        if (!resolved && window.flutterAuth) {
                            console.log(
                                "[AuthService] Found auth after DOMContentLoaded",
                            );
                            clearInterval(pollInterval);
                            resolveOnce(window.flutterAuth, "dom-loaded");
                        }
                    }, 500);
                });
            }

            // 5: Check on window load
            if (document.readyState !== "complete") {
                window.addEventListener("load", () => {
                    setTimeout(() => {
                        if (!resolved && window.flutterAuth) {
                            console.log(
                                "[AuthService] Found auth after window load",
                            );
                            clearInterval(pollInterval);
                            resolveOnce(window.flutterAuth, "window-load");
                        }
                    }, 1000);
                });
            }

            // Approach 6: Use MutationObserver to watch for window property changes
            if (typeof MutationObserver !== "undefined") {
                let checkCount = 0;
                const observer = new MutationObserver(() => {
                    checkCount++;
                    if (!resolved && window.flutterAuth) {
                        console.log(
                            `[AuthService] Found auth via MutationObserver (check ${checkCount})`,
                        );
                        observer.disconnect();
                        clearInterval(pollInterval);
                        resolveOnce(window.flutterAuth, "mutation-observer");
                    }
                });

                if (document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                    });
                }
            }
        });

        return this.initializationPromise;
    }

    handleAuthTimeout(resolve) {
        if (this.isDevelopment) {
            console.log(
                "[AuthService] Development: Falling back to mock auth after timeout",
            );
            this.authData = this.getMockAuthData();
            this.isInitialized = true;
            resolve(this.authData);
        } else {
            console.error(
                "[AuthService] ✗ Auth data not received from Flutter - no fallback available",
            );
            console.error("[AuthService] Debug info:", {
                hasFlutterAuth: !!window.flutterAuth,
                hasGetAuthToken: typeof window.getAuthToken === "function",
                hasFlutterInappWebview: !!window.flutter_inappwebview,
                windowKeys: Object.keys(window).filter(
                    (k) => k.includes("flutter") || k.includes("auth"),
                ),
            });
            resolve(null);
        }
    }

    async waitForAuth() {
        if (this.isInitialized) {
            return this.authData;
        }
        return await this.initialize();
    }

    getAccessToken() {
        if (window.getAuthToken && typeof window.getAuthToken === "function") {
            try {
                const token = window.getAuthToken();
                if (token) return token;
            } catch (e) {
                console.warn(
                    "[AuthService] Error calling window.getAuthToken:",
                    e,
                );
            }
        }

        if (window.flutterAuth?.access_token) {
            return window.flutterAuth.access_token;
        }

        return this.authData?.access_token || this.authData?.access;
    }

    getUserData() {
        if (window.getUserData && typeof window.getUserData === "function") {
            try {
                const userData = window.getUserData();
                if (userData) return userData;
            } catch (e) {
                console.warn(
                    "[AuthService] Error calling window.getUserData:",
                    e,
                );
            }
        }

        if (window.flutterAuth?.user) {
            return window.flutterAuth.user;
        }

        return this.authData?.user;
    }

    async refreshToken() {
        if (
            window.refreshAuthToken &&
            typeof window.refreshAuthToken === "function"
        ) {
            try {
                console.log(
                    "[AuthService] Requesting token refresh from Flutter...",
                );
                const newAuthData = await window.refreshAuthToken();
                this.authData = newAuthData;
                console.log("[AuthService] Token refreshed successfully");
                return newAuthData;
            } catch (error) {
                console.error("[AuthService] Token refresh failed:", error);
                throw error;
            }
        }

        if (this.isDevelopment) {
            console.log(
                "[AuthService] Development: Returning existing auth data (no refresh)",
            );
            return this.authData;
        }

        throw new Error("Token refresh not available");
    }

    async makeAuthenticatedRequest(url, options = {}) {
        if (
            window.makeAuthenticatedRequest &&
            typeof window.makeAuthenticatedRequest === "function"
        ) {
            try {
                return await window.makeAuthenticatedRequest(url, options);
            } catch (e) {
                console.warn(
                    "[AuthService] Flutter makeAuthenticatedRequest failed, using fallback:",
                    e,
                );
            }
        }

        const token = this.getAccessToken();
        if (!token) {
            throw new Error("No access token available");
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...options.headers,
        };

        return fetch(url, {
            ...options,
            headers,
        });
    }

    isAuthenticated() {
        return !!this.getAccessToken();
    }

    getCurrentUser() {
        return this.getUserData();
    }

    getUserName() {
        const user = this.getUserData();
        return user ? `${user.first_name} ${user.last_name}` : "No name found";
    }

    getUserEmail() {
        const user = this.getUserData();
        return user?.email;
    }

    getOrganization() {
        const user = this.getUserData();
        return user?.organization_name;
    }

    isUserSuperAdmin() {
        const user = this.getUserData();
        return user?.is_superadmin === true;
    }

    getUserId() {
        const user = this.getUserData();
        return user?.id;
    }
}

const authService = new AuthService();

setTimeout(() => {
    if (!authService.isInitialized) {
        console.log("[AuthService] Auto-initializing after delay...");
        authService.initialize().catch((err) => {
            console.error("[AuthService] Auto-initialization failed:", err);
        });
    }
}, 100);

if (import.meta.env.VITE_NODE_ENV === "development") {
    window.devAuth = {
        setAuth: (authData) => authService.setDevAuthData(authData),
        clearAuth: () => authService.clearDevAuthData(),
        getAuth: () => authService.authData,
        isInitialized: () => authService.isInitialized,
        forceInit: () => authService.initialize(),
    };
}

export default authService;
