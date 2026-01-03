import {Game} from "../model/Game";
import {auth, firebaseDB} from "./firebase-config";
import {ref, set} from "firebase/database";
import {ResultType, Round} from "../model/Round";

export function saveGameToFirebase(game: Game): Promise<void> {
    const user = auth.currentUser;
    if (!user) return Promise.reject(new Error('User not authenticated'));
    if (!game.gameGroupId) return Promise.reject(new Error('Game is missing gameGroupId'));
    
    const gameRef = ref(firebaseDB, `gameGroups/${game.gameGroupId}/games/${game.id}`);
    const gameToSave = {
        id: game.id,  // Make sure to include the id
        gameGroupId: game.gameGroupId,  // Include gameGroupId for reference
        players: game.players.map(player => ({
            id: player.id,
            firstname: player.firstname || "",
            name: player.name,
            result: player.result,
            aktiv: player.aktiv
        })),
        averagePoints: game.averagePoints,
        date: game.date ? game.date.toISOString() : new Date().toISOString(),  // Ensure date is included
        rounds: game.rounds.map(round => {
            // Convert Map to array of entries for Firebase, ensuring ResultType is properly handled
            const resultsArray = Array.from(round.results.entries()).map(([key, value]) => ({
                key,
                value: value as number  // Cast to number since enum values are numbers at runtime
            }));
            
            return {
                id: round.id,
                roundPoints: round.roundPoints,
                solo: round.solo,
                bock: round.bock,
                multiplier: round.multiplier,
                cowardicePoints: round.cowardicePoints,
                date: round.date ? (typeof round.date === 'string' ? round.date : round.date.toISOString()) : new Date().toISOString(),
                results: resultsArray
            };
        })
    }

    return set(gameRef, gameToSave);
}

export function convertFromDbGame(gameToConvert: any): Game {
    // Convert date from string to Date object
    const date = gameToConvert.date 
        ? new Date(gameToConvert.date) 
        : new Date();
    
    // Convert rounds if they exist
    let rounds: Round[] = [];
    if (gameToConvert.rounds && Array.isArray(gameToConvert.rounds)) {
        rounds = gameToConvert.rounds.map((round: any) => {
            // Convert results array back to Map with ResultType
            let resultsMap = new Map<string, ResultType>();
            
            if (round.results && Array.isArray(round.results)) {
                round.results.forEach((result: {key: string, value: number}) => {
                    if (result && result.key !== undefined && result.value !== undefined) {
                        // Convert the numeric value to ResultType enum
                        resultsMap.set(String(result.key), result.value as ResultType);
                    }
                });
            } else if (round.results && typeof round.results === 'object') {
                // Fallback for old format (object instead of array)
                Object.entries(round.results).forEach(([key, value]) => {
                    if (value !== undefined) {
                        resultsMap.set(String(key), value as ResultType);
                    }
                });
            }
            
            return {
                id: round.id || `round_${Date.now()}`,
                roundPoints: round.roundPoints || 0,
                bock: round.bock || false,
                solo: round.solo || false,
                multiplier: round.multiplier || 1,
                cowardicePoints: round.cowardicePoints || 0,
                date: round.date ? new Date(round.date) : new Date(),
                results: resultsMap
            };
        });
    }

    // Ensure players is an array and has required fields
    const players = Array.isArray(gameToConvert.players) 
        ? gameToConvert.players.map((player: any) => ({
            id: player.id || `player_${Date.now()}`,
            email: player.email || `unknown-${Date.now()}@doko.app`,
            result: player.result || 0,
            aktiv: player.aktiv !== undefined ? player.aktiv : true
        }))
        : [];

    return {
        id: gameToConvert.id || `game_${Date.now()}`,
        gameGroupId: gameToConvert.gameGroupId || '',
        players: players,
        rounds: rounds,
        averagePoints: gameToConvert.averagePoints || 0,
        date: date
    };
}
