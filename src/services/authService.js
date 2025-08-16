class AuthService {
    constructor() {
        this.authData = null;
        this.isInitialized = false;
        this.initializationPromise = null;

        this.initialize();
    }

    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // check flutter injection
        this.initializationPromise = new Promise((resolve) => {
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
                    console.warn(
                        "Auth data not received from Flutter within timeout",
                    );
                    resolve(null);
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
        return user ? `${user.first_name} ${user.last_name}` : "Unknown User";
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

export default authService;
