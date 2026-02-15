import {Player} from '../model/Player';
import {UserProfile, createTemporaryPlayer, getAllUsers, deleteTemporaryUser} from '../firebase/UserService';
import {GroupPlayer} from '../model/GameGroup';

// Zentrale Speicherung für Spielerdaten
export class PlayerDataService {
    private static instance: PlayerDataService;
    private temporaryPlayers: Map<string, Player> = new Map();
    private registeredUsers: Map<string, UserProfile> = new Map();

    private constructor() {}

    static getInstance(): PlayerDataService {
        if (!PlayerDataService.instance) {
            PlayerDataService.instance = new PlayerDataService();
        }
        return PlayerDataService.instance;
    }

    // Temporäre Spieler verwalten
    addTemporaryPlayer(player: Player): void {
        this.temporaryPlayers.set(player.id, player);
    }

    getTemporaryPlayer(id: string): Player | undefined {
        return this.temporaryPlayers.get(id);
    }

    getAllTemporaryPlayers(): Player[] {
        return Array.from(this.temporaryPlayers.values());
    }

    updateTemporaryPlayer(id: string, updates: Partial<Player>): void {
        const player = this.temporaryPlayers.get(id);
        if (player) {
            this.temporaryPlayers.set(id, { ...player, ...updates });
        }
    }

    removeTemporaryPlayer(id: string): void {
        this.temporaryPlayers.delete(id);
    }

    // Temporäre Spieler in die Datenbank speichern
    async saveTemporaryPlayersToDatabase(): Promise<void> {
        const savePromises = Array.from(this.temporaryPlayers.values()).map(async (player) => {
            try {
                await createTemporaryPlayer({
                    id: player.id,
                    email: player.email,
                    firstName: player.firstname,
                    lastName: player.name
                });
            } catch (error) {
                console.error(`Failed to save temporary player ${player.id} to database:`, error);
            }
        });
        await Promise.all(savePromises);
    }

    // Alle temporären Spieler aus der Datenbank löschen
    async deleteTemporaryPlayersFromDatabase(): Promise<void> {
        const deletePromises = Array.from(this.temporaryPlayers.keys()).map(async (playerId) => {
            try {
                await deleteTemporaryUser(playerId);
            } catch (error) {
                console.error(`Failed to delete temporary player ${playerId} from database:`, error);
            }
        });
        await Promise.all(deletePromises);
    }

    // Registrierte Benutzer verwalten
    setRegisteredUsers(users: UserProfile[]): void {
        this.registeredUsers.clear();
        users.forEach(user => {
            this.registeredUsers.set(user.uid, user);
        });
    }

    getRegisteredUser(id: string): UserProfile | undefined {
        return this.registeredUsers.get(id);
    }

    async getAllRegisteredUsers(): Promise<UserProfile[]> {
        try {
            const users = await getAllUsers();
            this.registeredUsers.clear();
            users.forEach(user => {
                this.registeredUsers.set(user.uid, user);
            });
            return users;
        } catch (error) {
            console.error('Failed to load users from database:', error);
            return Array.from(this.registeredUsers.values());
        }
    }

    // Konvertierungsfunktionen
    async groupPlayersToFullPlayers(groupPlayers: GroupPlayer[]): Promise<Player[]> {
        // Lade alle Benutzer aus der Datenbank, um sicherzustellen, dass wir aktuelle Daten haben
        await this.getAllRegisteredUsers();
        
        return groupPlayers.map(groupPlayer => {
            if (groupPlayer.isTemporary) {
                // Temporären Spieler aus dem lokalen Speicher holen
                const tempPlayer = this.temporaryPlayers.get(groupPlayer.id);
                if (tempPlayer) {
                    return { ...tempPlayer, isTemporary: true };
                }
                // Versuche, aus den registrierten Benutzern zu finden (temporäre Spieler werden jetzt auch dort gespeichert)
                const user = this.registeredUsers.get(groupPlayer.id);
                if (user && user.isTemporary) {
                    return {
                        id: user.uid,
                        email: user.email || '',
                        name: user.lastName || '',
                        firstname: user.firstName || '',
                        result: 0,
                        aktiv: true,
                        isTemporary: true
                    };
                }
                // Fallback, falls nicht gefunden
                return {
                    id: groupPlayer.id,
                    email: '',
                    firstname: 'Unbekannt',
                    name: 'Temporärer Spieler',
                    result: 0,
                    aktiv: true,
                    isTemporary: true
                };
            } else {
                // Registrierten Benutzer aus dem zentralen Speicher holen
                const user = this.registeredUsers.get(groupPlayer.id);
                if (user) {
                    return {
                        id: user.uid,
                        email: user.email || '',
                        name: user.lastName || 'Unbekannt',
                        firstname: user.firstName || user.email?.split('@')[0] || 'Unbekannt',
                        result: 0,
                        aktiv: true,
                        isTemporary: false
                    };
                }
                // Fallback, falls nicht gefunden
                return {
                    id: groupPlayer.id,
                    email: '',
                    firstname: 'Unbekannt',
                    name: 'Registrierter Spieler',
                    result: 0,
                    aktiv: true,
                    isTemporary: false
                };
            }
        });
    }

    fullPlayersToGroupPlayers(players: Player[]): GroupPlayer[] {
        return players.map(player => ({
            id: player.id,
            isTemporary: player.isTemporary
        }));
    }

    // Beim Austausch: Temporären Spieler durch registrierten Benutzer ersetzen
    async replaceTemporaryWithRegistered(tempPlayerId: string, registeredUser: UserProfile): Promise<void> {
        const tempPlayer = this.temporaryPlayers.get(tempPlayerId);
        if (tempPlayer) {
            try {
                // Lösche den temporären User aus Firebase
                await deleteTemporaryUser(tempPlayerId);
                
                // Behalte die Spielerdaten, aber markiere als nicht mehr temporär
                const updatedPlayer: Player = {
                    ...tempPlayer,
                    id: registeredUser.uid,
                    email: registeredUser.email || tempPlayer.email,
                    name: registeredUser.lastName || tempPlayer.name,
                    firstname: registeredUser.firstName || tempPlayer.firstname,
                    isTemporary: false
                };
                
                // Entferne aus temporären Spielern und füge als registrierten Benutzer hinzu
                this.temporaryPlayers.delete(tempPlayerId);
                this.registeredUsers.set(registeredUser.uid, registeredUser);
            } catch (error) {
                console.error('Error deleting temporary user from Firebase:', error);
                throw error;
            }
        }
    }
}

export default PlayerDataService.getInstance();
