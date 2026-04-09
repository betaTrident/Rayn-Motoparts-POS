import axios from "axios";
import { ENDPOINTS } from "@/services/endpoints.service";

// Create an Axios instance with the Django backend base URL.
// Every request made with `api.get(...)` or `api.post(...)` will
// automatically prepend this base URL.
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// ──────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Runs BEFORE every request is sent to the server.
// Its job: attach the JWT access token to the Authorization header.
// ──────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Read the access token from localStorage
    const accessToken = localStorage.getItem("access_token");

    // If a token exists, add it to the request header
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    // If something goes wrong building the request, reject it
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Runs AFTER every response comes back from the server.
// Its job: if we get a 401 (token expired), try to refresh
// the access token using the refresh token, then retry.
// ──────────────────────────────────────────────

// This flag prevents multiple refresh attempts at the same time.
// Without it, if 3 requests all get 401 at once, they'd each
// try to refresh the token simultaneously — causing chaos.
let isRefreshing = false;

// Queue of requests that arrived while we were refreshing.
// Once the new token is obtained, we replay all of them.
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

// Helper: process the queue after refresh succeeds or fails
const processQueue = (error: unknown, token: string | null = null) => {
  failedRequestsQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else if (token) {
      request.resolve(token);
    }
  });
  failedRequestsQueue = [];
};

api.interceptors.response.use(
  // If the response is successful (2xx), just pass it through
  (response) => response,

  // If the response is an error...
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if:
    // 1. It's a 401 error (unauthorized / token expired)
    // 2. We haven't already retried this request (prevent infinite loop)
    // 3. It's NOT the refresh endpoint itself (prevent infinite loop)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("auth/token/refresh/") &&
      !originalRequest.url?.includes("auth/login/")
    ) {
      // If another request is already refreshing, queue this one
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      // Mark this request as retried so we don't loop
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call the refresh endpoint to get a new access token
        const { data } = await axios.post(
          `http://127.0.0.1:8000/api/${ENDPOINTS.auth.refresh}`,
          { refresh: refreshToken }
        );

        // Store the new tokens
        localStorage.setItem("access_token", data.access);
        if (data.refresh) {
          // The backend rotates refresh tokens, so save the new one
          localStorage.setItem("refresh_token", data.refresh);
        }

        // Replay all queued requests with the new token
        processQueue(null, data.access);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — token is fully expired or invalid.
        // Clear everything and redirect to login.
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
