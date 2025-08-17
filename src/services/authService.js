// class AuthService {
//     constructor() {
//         this.authData = null;
//         this.isInitialized = false;
//         this.initializationPromise = null;

//         this.initialize();
//     }

//     async initialize() {
//         if (this.initializationPromise) {
//             return this.initializationPromise;
//         }

//         // check flutter injection
//         this.initializationPromise = new Promise((resolve) => {
//             if (window.flutterAuth) {
//                 this.authData = window.flutterAuth;
//                 this.isInitialized = true;
//                 console.log("Auth data loaded from Flutter:", this.authData);
//                 resolve(this.authData);
//                 return;
//             }

//             const checkForAuth = setInterval(() => {
//                 if (window.flutterAuth || window.getAuthToken) {
//                     clearInterval(checkForAuth);
//                     this.authData = window.flutterAuth;
//                     this.isInitialized = true;
//                     console.log(
//                         "Auth data received from Flutter:",
//                         this.authData,
//                     );
//                     console.log(JSON.stringify(this.authData, null, 2));
//                     resolve(this.authData);
//                 }
//             }, 100);

//             setTimeout(() => {
//                 clearInterval(checkForAuth);
//                 if (!this.isInitialized) {
//                     console.warn(
//                         "Auth data not received from Flutter within timeout",
//                     );
//                     resolve(null);
//                 }
//             }, 10000);
//         });

//         return this.initializationPromise;
//     }

//     async waitForAuth() {
//         if (this.isInitialized) {
//             return this.authData;
//         }
//         return await this.initialize();
//     }

//     getAccessToken() {
//         if (window.getAuthToken) {
//             return window.getAuthToken();
//         }
//         return this.authData?.access_token;
//     }

//     getUserData() {
//         if (window.getUserData) {
//             return window.getUserData();
//         }
//         return this.authData?.user;
//     }

//     async refreshToken() {
//         if (window.refreshAuthToken) {
//             try {
//                 const newAuthData = await window.refreshAuthToken();
//                 this.authData = newAuthData;
//                 return newAuthData;
//             } catch (error) {
//                 console.error("Token refresh failed:", error);
//                 throw error;
//             }
//         }
//         throw new Error("Token refresh not available");
//     }

//     async makeAuthenticatedRequest(url, options = {}) {
//         if (window.makeAuthenticatedRequest) {
//             return window.makeAuthenticatedRequest(url, options);
//         }

//         const token = this.getAccessToken();
//         if (!token) {
//             throw new Error("No access token available");
//         }

//         const headers = {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             ...options.headers,
//         };

//         return fetch(url, {
//             ...options,
//             headers,
//         });
//     }

//     isAuthenticated() {
//         return !!this.getAccessToken();
//     }

//     getCurrentUser() {
//         return this.getUserData();
//     }

//     getUserName() {
//         const user = this.getUserData();
//         return user ? `${user.first_name} ${user.last_name}` : "No name found";
//     }

//     getUserEmail() {
//         const user = this.getUserData();
//         return user?.email;
//     }

//     getOrganization() {
//         const user = this.getUserData();
//         return user?.organization_name;
//     }

//     isUserSuperAdmin() {
//         const user = this.getUserData();
//         return user?.is_superadmin === true;
//     }

//     getUserId() {
//         const user = this.getUserData();
//         return user?.id;
//     }
// }

// const authService = new AuthService();

// export default authService;

class AuthService {
    constructor() {
        this.authData = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.isDevelopment = import.meta.env.VITE_NODE_ENV === "development";
        this.useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === "true";

        this.initialize();
    }

    // MAKR: Development mock auth data
    getMockAuthData() {
        return {
            access_token: "mock_access_token_for_development",
            refresh_token: "mock_refresh_token",
            user: {
                id: 1,
                first_name: "Dev",
                last_name: "User",
                email: "dev@example.com",
                organization_name: "Development Org",
                is_superadmin: true,
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
            if (this.isDevelopment) {
                if (this.useMockAuth) {
                    this.authData = this.getMockAuthData();
                    this.isInitialized = true;
                    console.log(
                        "Development: Using mock auth data:",
                        this.authData,
                    );
                    resolve(this.authData);
                    return;
                } else {
                    const storedAuth = this.loadDevAuthFromStorage();
                    if (storedAuth) {
                        this.authData = storedAuth;
                        this.isInitialized = true;
                        console.log(
                            "Development: Using stored auth data:",
                            this.authData,
                        );
                        resolve(this.authData);
                        return;
                    }
                }
            }
            // MARK: flutter injection here
            if (window.flutterAuth) {
                this.authData = window.flutterAuth;
                this.isInitialized = true;
                console.log("Auth data loaded from Flutter:", this.authData);
                resolve(this.authData);
                return;
            }

            const checkForAuth = setInterval(() => {
                if (window.flutterAuth || window.getAuthToken) {
                    clearInterval(checkForAuth);
                    this.authData = window.flutterAuth;
                    this.isInitialized = true;
                    console.log(
                        "Auth data received from Flutter:",
                        this.authData,
                    );
                    console.log(JSON.stringify(this.authData, null, 2));
                    resolve(this.authData);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkForAuth);
                if (!this.isInitialized) {
                    if (this.isDevelopment) {
                        this.authData = this.getMockAuthData();
                        this.isInitialized = true;
                        console.log("🔧 Development: Fallback to mock auth");
                        resolve(this.authData);
                    } else {
                        console.warn(
                            "Auth data not received from Flutter within timeout",
                        );
                        resolve(null);
                    }
                }
            }, 10000);
        });

        return this.initializationPromise;
    }

    async waitForAuth() {
        if (this.isInitialized) {
            return this.authData;
        }
        return await this.initialize();
    }

    getAccessToken() {
        if (window.getAuthToken) {
            return window.getAuthToken();
        }
        return this.authData?.access_token;
    }

    getUserData() {
        if (window.getUserData) {
            return window.getUserData();
        }
        return this.authData?.user;
    }

    async refreshToken() {
        if (window.refreshAuthToken) {
            try {
                const newAuthData = await window.refreshAuthToken();
                this.authData = newAuthData;
                return newAuthData;
            } catch (error) {
                console.error("Token refresh failed:", error);
                throw error;
            }
        }

        if (this.isDevelopment) {
            console.log("Development: Mock token refresh");
            return this.authData;
        }

        throw new Error("Token refresh not available");
    }

    async makeAuthenticatedRequest(url, options = {}) {
        if (window.makeAuthenticatedRequest) {
            return window.makeAuthenticatedRequest(url, options);
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

if (import.meta.env.VITE_NODE_ENV === "development") {
    window.devAuth = {
        setAuth: (authData) => authService.setDevAuthData(authData),
        clearAuth: () => authService.clearDevAuthData(),
        getAuth: () => authService.authData,
    };
}

export default authService;
