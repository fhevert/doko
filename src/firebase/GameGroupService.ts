import { ref, set, onValue, push, update, get, DataSnapshot, remove } from 'firebase/database';
import { auth, firebaseDB } from './firebase-config';
import { GameGroup } from '../model/GameGroup';

export const createGameGroup = async (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const gameGroupRef = ref(firebaseDB, `users/${user.uid}/gameGroups`);
    const newGroupRef = push(gameGroupRef);
    
    const newGroup: GameGroup = {
        ...group,
        id: newGroupRef.key!,
        games: [],
        rounds: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    await set(newGroupRef, newGroup);
    return newGroup;
};

export const updateGameGroup = async (groupId: string, updates: Partial<GameGroup>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const groupRef = ref(firebaseDB, `users/${user.uid}/gameGroups/${groupId}`);
    
    await update(groupRef, {
        ...updates,
        updatedAt: Date.now()
    });
};

export const deleteGameGroup = async (groupId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const groupRef = ref(firebaseDB, `users/${user.uid}/gameGroups/${groupId}`);
    await remove(groupRef);
};

export const getGameGroup = async (groupId: string): Promise<GameGroup | null> => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const groupRef = ref(firebaseDB, `users/${user.uid}/gameGroups/${groupId}`);
    const snapshot = await get(groupRef);
    
    if (!snapshot.exists()) {
        return null;
    }
    
    return snapshot.val();
};

export const subscribeToGameGroups = (
    onGameGroupsChanged: (groups: Record<string, GameGroup>) => void,
    onError?: (error: Error) => void
) => {
    const user = auth.currentUser;
    if (!user) {
        onError?.(new Error('User not authenticated'));
        return () => {};
    }

    const gameGroupsRef = ref(firebaseDB, `users/${user.uid}/gameGroups`);
    
    const handleValue = (snapshot: DataSnapshot) => {
        const groups = snapshot.val() || {};
        onGameGroupsChanged(groups);
    };
    
    onValue(gameGroupsRef, handleValue, (error) => {
        console.error('Error subscribing to game groups:', error);
        onError?.(error);
    });

    // Return unsubscribe function
    return () => {
        // No need to explicitly remove the listener as onValue manages it internally
    };
};
