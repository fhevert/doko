import {DataSnapshot, get, onValue, push, ref, remove, set, update} from 'firebase/database';
import {auth, firebaseDB} from './firebase-config';
import {GameGroup} from '../model/GameGroup';
import {MinimalPlayer} from '../model/MinimalPlayer';
import {Player} from '../model/Player';
import {getUserProfileByEmail} from './UserService'; // You'll need to implement this

const toMinimalPlayer = (player: Player): MinimalPlayer => ({
    id: player.id,
    email: player.email
});

export const createGameGroup = async (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const gameGroupRef = ref(firebaseDB, `gameGroups`);
    const newGroupRef = push(gameGroupRef);
    
    // Convert players to MinimalPlayer before saving
    const minimalPlayers = (group.players || []).map(toMinimalPlayer);
    
    const newGroup = {
        ...group,
        id: newGroupRef.key!,
        players: minimalPlayers,
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

    const groupRef = ref(firebaseDB, `gameGroups/${groupId}`);
    
    await update(groupRef, {
        ...updates,
        updatedAt: Date.now()
    });
};

export const deleteGameGroup = async (groupId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const groupRef = ref(firebaseDB, `gameGroups/${groupId}`);
    await remove(groupRef);
};

const enrichPlayer = async (minimalPlayer: MinimalPlayer): Promise<Player> => {
    try {
        const user = await getUserProfileByEmail(minimalPlayer.email);
        return {
            ...minimalPlayer,
            firstname: user?.firstName,
            name: user?.lastName,
            // Set default values for required fields
            result: 0,
            aktiv: true
        };
    } catch (error) {
        console.error(`Error enriching player ${minimalPlayer.email}:`, error);
        // Return minimal player with required fields if user lookup fails
        return {
            ...minimalPlayer,
            result: 0,
            aktiv: true
        };
    }
};

export const getGameGroup = async (groupId: string): Promise<GameGroup | null> => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const groupRef = ref(firebaseDB, `gameGroups/${groupId}`);
    const snapshot = await get(groupRef);
    
    if (!snapshot.exists()) {
        return null;
    }
    
    const group = snapshot.val();
    
    // Enrich players with user data
    if (group.players && Array.isArray(group.players)) {
        const enrichedPlayers = await Promise.all(
            group.players.map((player: MinimalPlayer) => enrichPlayer(player))
        );
        return {
            ...group,
            players: enrichedPlayers
        };
    }
    
    return group;
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

    const gameGroupsRef = ref(firebaseDB, `gameGroups`);
    
    const handleValue = async (snapshot: DataSnapshot) => {
        const groups = snapshot.val() || {};
        
        // Process each group to enrich players
        const processedGroups = await Promise.all(
            Object.entries(groups).map(async ([id, group]: [string, any]) => {
                if (group.players && Array.isArray(group.players)) {
                    const enrichedPlayers = await Promise.all(
                        group.players.map((player: MinimalPlayer) => enrichPlayer(player))
                    );
                    return [id, { ...group, players: enrichedPlayers }];
                }
                return [id, group];
            })
        );
        
        onGameGroupsChanged(Object.fromEntries(processedGroups));
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
