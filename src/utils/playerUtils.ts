import {Player} from '../model/Player';
import {UserProfile} from '../firebase/UserService';
import {Game} from '../model/Game';
import {GroupPlayer} from '../model/GameGroup';
import {ResultType} from '../model/Round';
import PlayerDataService from '../services/PlayerDataService';

/**
 * Ersetzt einen temporären Spieler durch einen registrierten Benutzer
 */
export function replaceTemporaryPlayer(
    players: GroupPlayer[], 
    temporaryPlayerId: string, 
    registeredUser: UserProfile
): GroupPlayer[] {
    return players.map(player => {
        if (player.id === temporaryPlayerId && player.isTemporary) {
            return {
                id: registeredUser.uid,
                isTemporary: false
            };
        }
        return player;
    });
}

/**
 * Ersetzt einen Spieler in allen Spielen und Runden einer Spielgruppe
 */
export function replacePlayerInAllGames(
    games: Game[],
    oldPlayerId: string,
    newPlayerId: string
): Game[] {
    return games.map(game => {
        // Ersetze Spieler in der Spielerliste des Spiels
        const updatedPlayers = game.players.map(player => 
            player.id === oldPlayerId ? {...player, id: newPlayerId} : player
        );

        // Ersetze Spieler in allen Runden-Ergebnissen
        const updatedRounds = game.rounds.map(round => {
            // Erstelle eine neue Map mit den aktualisierten Spieler-IDs
            const updatedResults = new Map<string, ResultType>();
            
            // Kopiere alle Ergebnisse und ersetze die alte Spieler-ID
            round.results.forEach((result, playerId) => {
                const newPlayerIdForKey = playerId === oldPlayerId ? newPlayerId : playerId;
                updatedResults.set(newPlayerIdForKey, result);
            });

            return {
                ...round,
                results: updatedResults
            };
        });

        return {
            ...game,
            players: updatedPlayers,
            rounds: updatedRounds
        };
    });
}

/**
 * Ersetzt einen temporären Spieler vollständig in einer Spielgruppe
 * (Spielerliste + alle Spiele und Runden)
 */
export function replaceTemporaryPlayerInGroup(
    players: GroupPlayer[],
    games: Game[],
    temporaryPlayerId: string,
    registeredUser: UserProfile
): { updatedPlayers: GroupPlayer[], updatedGames: Game[] } {
    // Ersetze in der Spielerliste
    const updatedPlayers = replaceTemporaryPlayer(players, temporaryPlayerId, registeredUser);
    
    // Ersetze in allen Spielen
    const updatedGames = replacePlayerInAllGames(games, temporaryPlayerId, registeredUser.uid);

    // Aktualisiere den zentralen PlayerDataService
    PlayerDataService.replaceTemporaryWithRegistered(temporaryPlayerId, registeredUser);

    return { updatedPlayers, updatedGames };
}

/**
 * Findet temporäre Spieler, die durch einen registrierten Benutzer ersetzt werden könnten
 * Basierend auf Namensähnlichkeit oder E-Mail-Übereinstimmung
 */
export function findReplaceableTemporaryPlayers(
    players: Player[], 
    registeredUser: UserProfile
): Player[] {
    return players.filter(player => {
        if (!player.isTemporary) return false;
        
        // Prüfe auf Namensähnlichkeit
        const playerName = `${player.firstname} ${player.name}`.toLowerCase().trim();
        const registeredName = `${registeredUser.firstName} ${registeredUser.lastName}`.toLowerCase().trim();
        
        // Exakte Namensübereinstimmung
        if (playerName === registeredName) return true;
        
        // E-Mail-Übereinstimmung (falls bei temporärem Spieler angegeben)
        if (player.email && registeredUser.email && 
            player.email.toLowerCase() === registeredUser.email.toLowerCase()) {
            return true;
        }
        
        // Teilweise Namensübereinstimmung (Vorname oder Nachname)
        const playerFirst = player.firstname?.toLowerCase() || '';
        const playerLast = player.name?.toLowerCase() || '';
        const registeredFirst = registeredUser.firstName?.toLowerCase() || '';
        const registeredLast = registeredUser.lastName?.toLowerCase() || '';
        
        return (playerFirst === registeredFirst && playerFirst.length > 2) ||
               (playerLast === registeredLast && playerLast.length > 2);
    });
}

/**
 * Gibt alle temporären Spieler zurück
 */
export function getTemporaryPlayers(players: Player[]): Player[] {
    return players.filter(player => player.isTemporary);
}

/**
 * Prüft ob eine Spielgruppe temporäre Spieler enthält
 */
export function hasTemporaryPlayers(players: Player[]): boolean {
    return players.some(player => player.isTemporary);
}
