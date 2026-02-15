// src/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from "./firebase-config";
import { onAuthStateChanged, User } from 'firebase/auth';
import { createUserProfile, getUserProfile } from './UserService';

// Define the context value type
interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Define the props type for AuthProvider
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            // Nur Profil erstellen wenn der Benutzer wirklich eingeloggt ist
            // (nicht während der Registrierung)
            if (user && user.emailVerified) {
                try {
                    const userProfile = await getUserProfile(user.uid);
                    if (!userProfile) {
                        console.log('Creating user profile for verified user:', user.uid);
                        await createUserProfile(user);
                    } else {
                        console.log('User profile already exists for:', user.uid);
                    }
                } catch (error) {
                    console.error('Error handling user profile:', error);
                }
            } else if (user) {
                console.log('User not verified yet, skipping profile creation:', user.uid);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value: AuthContextType = {
        currentUser,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};