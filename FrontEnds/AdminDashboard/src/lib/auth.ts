'use client';

// Authentication utility functions

// Check if user is authenticated
import {User} from "@/lib/types";

export function isAuthenticated(): boolean {
    debugger;
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('authToken');
    return !!token;
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

// Save authentication data
export function saveAuthData(token: string, user: User): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Clear authentication data
export function clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authPhoneNumber');
}

// Get auth token
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
}