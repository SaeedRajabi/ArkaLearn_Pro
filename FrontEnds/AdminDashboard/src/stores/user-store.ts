
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types';
import {UserLoginResponseType} from "@/lib/responseTypes";

interface UserState {
    isLoggedIn: boolean;
    isHydrated: boolean; // To track when the store is ready
    user: UserLoginResponseType | null;
    login: (user: UserLoginResponseType) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    setHydrated: () => void;
    setUserLoggedIn:(status : boolean) => void;
}


export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            isHydrated: false,
            user: null,
            login: (user) => set({ isLoggedIn: true, user:user }),
            logout: () => set({ isLoggedIn: false, user: null }),
            updateUser: (user) => set((state) => ({ user: state.user ? { ...state.user, ...user } : null })),
            setHydrated: () => set({ isHydrated: true }),
            setUserLoggedIn: (status) => {
                set({ isLoggedIn: status });
                // ذخیره وضعیت ورود در localStorage
                if (status) {
                    localStorage.setItem('isLoggedIn', 'true');
                } else {
                    localStorage.removeItem('isLoggedIn');
                }
            },

        }),
        {
            name: 'user-session', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHydrated();
                }
            },
        }
    )
);
