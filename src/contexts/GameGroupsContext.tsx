import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameGroup } from '../model/GameGroup';

interface GameGroups {
    [key: string]: GameGroup;
}

interface GameGroupsContextType {
    gameGroups: GameGroups;
    setGameGroups: React.Dispatch<React.SetStateAction<GameGroups>>;
}

const GameGroupsContext = createContext<GameGroupsContextType | undefined>(undefined);

export const useGameGroups = () => {
    const context = useContext(GameGroupsContext);
    if (context === undefined) {
        throw new Error('useGameGroups must be used within a GameGroupsProvider');
    }
    return context;
};

interface GameGroupsProviderProps {
    children: ReactNode;
}

export const GameGroupsProvider: React.FC<GameGroupsProviderProps> = ({ children }) => {
    const [gameGroups, setGameGroups] = useState<GameGroups>({});

    return (
        <GameGroupsContext.Provider value={{ gameGroups, setGameGroups }}>
            {children}
        </GameGroupsContext.Provider>
    );
};
