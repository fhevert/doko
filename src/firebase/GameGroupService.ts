import {DataSnapshot, get, onValue, push, ref, remove, set, update} from 'firebase/database';
import {auth, firebaseDB} from './firebase-config';
import {GameGroup} from '../model/GameGroup';
import {updateUserProfile, getUserProfile, deleteTemporaryUser} from './UserService';
import { Game } from '../model/Game';
import { saveGameToFirebase } from './DbFunctions';
import PlayerDataService from '../services/PlayerDataService';

export const createGameGroup = async (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Speichere temporäre Spieler zuerst in der Datenbank
    await PlayerDataService.saveTemporaryPlayersToDatabase();

    const gameGroupRef = ref(firebaseDB, `gameGroups`);
    const newGroupRef = push(gameGroupRef);
    
    const newGroup: GameGroup = {
        ...group,
        id: newGroupRef.key!,
        players: group.players || [],
        games: [], 
        rounds: [], 
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    // Speichere die Gruppen-ID bei allen Mitgliedern
    const playerIds = (group.players || []).map(player => player.id);
    for (const playerId of playerIds) {
        const profile = await getUserProfile(playerId);
        const currentGroupIds = profile?.groupIds || [];
        if (!currentGroupIds.includes(newGroup.id)) {
            await updateUserProfile(playerId, {
                groupIds: [...currentGroupIds, newGroup.id]
            });
        }
    }
    
    // Dann erst die Gruppe erstellen
    await set(newGroupRef, newGroup);
    
    return newGroup;
};

export const updateGameGroup = async (groupId: string, updates: Partial<GameGroup>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const groupRef = ref(firebaseDB, `gameGroups/${groupId}`);
    
    // Hole die aktuelle Gruppe, um die Mitglieder zu vergleichen
    const currentGroup = await getGameGroup(groupId);
    if (!currentGroup) throw new Error('Group not found');
    
    // Bestimme die finale Spielerliste nach dem Update
    const finalPlayers = updates.players || currentGroup.players;
    
    // Speichere temporäre Spieler zuerst in der Datenbank
    await PlayerDataService.saveTemporaryPlayersToDatabase();
    
    await update(groupRef, {
        ...updates,
        updatedAt: Date.now()
    });
    
    // Aktualisiere die groupIds für alle aktuellen Spieler
    const playerIds = finalPlayers.map(player => player.id);
    for (const playerId of playerIds) {
        const profile = await getUserProfile(playerId);
        const currentGroupIds = profile?.groupIds || [];
        if (!currentGroupIds.includes(groupId)) {
            await updateUserProfile(playerId, {
                groupIds: [...currentGroupIds, groupId]
            });
        }
    }
    
    // Wenn sich die Spieler geändert haben, entferne alte Mitglieder
    if (updates.players) {
        const oldPlayerIds = currentGroup.players.map(player => player.id);
        const newPlayerIds = updates.players.map(player => player.id);
        
        // Entferne Gruppen-ID von alten Mitgliedern, die nicht mehr in der Gruppe sind
        for (const playerId of oldPlayerIds) {
            if (!newPlayerIds.includes(playerId)) {
                const profile = await getUserProfile(playerId);
                if (profile?.groupIds) {
                    const updatedGroupIds = profile.groupIds.filter(id => id !== groupId);
                    await updateUserProfile(playerId, { groupIds: updatedGroupIds });
                    
                    // Wenn es ein temporärer Spieler ist, lösche ihn vollständig aus der Datenbank
                    if (profile.isTemporary) {
                        try {
                            await deleteTemporaryUser(playerId);
                        } catch (error) {
                            console.error(`Failed to delete temporary user ${playerId}:`, error);
                        }
                    }
                }
            }
        }
    }
};

export const deleteGameGroup = async (groupId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Hole die Gruppe zuerst, um die Mitglieder zu erfahren
    const group = await getGameGroup(groupId);
    if (!group) {
        throw new Error('Group not found');
    }

    // Entferne die Gruppen-ID von allen Mitgliedern und lösche temporäre Spieler
    const playerIds = group.players.map(player => player.id);
    for (const playerId of playerIds) {
        const profile = await getUserProfile(playerId);
        if (profile?.groupIds) {
            const updatedGroupIds = profile.groupIds.filter(id => id !== groupId);
            await updateUserProfile(playerId, { groupIds: updatedGroupIds });
            
            // Wenn es ein temporärer Spieler ist, lösche ihn vollständig
            if (profile.isTemporary) {
                try {
                    await deleteTemporaryUser(playerId);
                } catch (error) {
                    console.error(`Failed to delete temporary user ${playerId}:`, error);
                }
            }
        }
    }

    // Lösche die Gruppe aus der Datenbank
    const groupRef = ref(firebaseDB, `gameGroups/${groupId}`);
    await remove(groupRef);
};

export const getGameGroup = async (groupId: string): Promise<GameGroup | null> => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const groupRef = ref(firebaseDB, `gameGroups/${groupId}`);
    const snapshot = await get(groupRef);
    
    if (!snapshot.exists()) {
        return null;
    }
    
    return snapshot.val();
};

export const updateGamesInGroup = async (groupId: string, games: Game[]): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Aktualisiere jedes Spiel einzeln mit saveGameToFirebase für korrekte Map-Behandlung
    for (const game of games) {
        await saveGameToFirebase(game);
    }
};

export const getUserGroups = async (): Promise<GameGroup[]> => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Hole die Gruppen-IDs des aktuellen Users
    const userProfile = await getUserProfile(user.uid);
    if (!userProfile?.groupIds || userProfile.groupIds.length === 0) {
        return [];
    }

    const groups: GameGroup[] = [];
    
    // Lade alle Gruppen des Users
    for (const groupId of userProfile.groupIds) {
        const group = await getGameGroup(groupId);
        if (group) {
            groups.push(group);
        }
    }
    
    return groups;
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

    let unsubscribeFunctions: (() => void)[] = [];
    let currentGroupIds: string[] = [];
    const groups: Record<string, GameGroup> = {};

    // Hole die Gruppen-IDs des aktuellen Users und abonniere auch Änderungen am Profil
    const userProfileRef = ref(firebaseDB, `users/${user.uid}`);
    
    const profileUnsubscribe = onValue(userProfileRef, (profileSnapshot) => {
        const userProfile = profileSnapshot.val();
        const newGroupIds = userProfile?.groupIds || [];
        
        if (newGroupIds.length === 0) {
            onGameGroupsChanged({});
            // Alte Abonnements beenden
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
            unsubscribeFunctions = [];
            currentGroupIds = [];
            // Leere das groups Objekt
            Object.keys(groups).forEach(key => delete groups[key]);
            return;
        }

        // Beende Abonnements für Gruppen, die nicht mehr in der Liste sind
        const groupsToRemove = currentGroupIds.filter((id: string) => !newGroupIds.includes(id));
        groupsToRemove.forEach(groupId => {
            const index = currentGroupIds.indexOf(groupId);
            if (index !== -1) {
                unsubscribeFunctions[index]?.();
                unsubscribeFunctions.splice(index, 1);
                currentGroupIds.splice(index, 1);
                delete groups[groupId];
            }
        });

        // Erstelle neue Abonnements für neue Gruppen
        const groupsToAdd = newGroupIds.filter((id: string) => !currentGroupIds.includes(id));
        groupsToAdd.forEach((groupId: string) => {
            const groupRef = ref(firebaseDB, `gameGroups/${groupId}`);
            
            const unsubscribe = onValue(groupRef, (snapshot) => {
                if (snapshot.exists()) {
                    groups[groupId] = snapshot.val();
                } else {
                    // Gruppe existiert nicht mehr, entferne sie aus den Ergebnissen
                    delete groups[groupId];
                }
                
                // Rufe die Callback-Funktion bei jeder Änderung auf
                onGameGroupsChanged({...groups});
            }, (error) => {
                console.error(`Error subscribing to group ${groupId}:`, error);
                onError?.(error);
            });

            unsubscribeFunctions.push(unsubscribe);
            currentGroupIds.push(groupId);
        });

        // Aktualisiere die currentGroupIds
        currentGroupIds = newGroupIds;
        
        // Sende die aktuellen Gruppen-Daten
        onGameGroupsChanged({...groups});
    }, (error) => {
        console.error('Error subscribing to user profile:', error);
        onError?.(error);
    });

    unsubscribeFunctions.push(profileUnsubscribe);

    return () => {
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
};
