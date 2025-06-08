// src/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {auth} from "./firebase-config";
import { onAuthStateChanged, User } from 'firebase/auth'; // Importiere User Typ

// Definieren Sie den Typ für den Kontextwert
interface AuthContextType {
    currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); // Context kann anfangs undefined sein

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Definieren Sie den Typ für die Props des AuthProvider
interface AuthProviderProps {
    children: ReactNode; // children vom Typ ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value: AuthContextType = { // Typisierung des Wertes
        currentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};