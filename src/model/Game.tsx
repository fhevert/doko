import {Player} from "./Player";
import {Round} from "./Round";
import {GroupPlayer} from "./GameGroup";

export interface Game {
    id: string; // Changed from number to string for Firebase compatibility
    gameGroupId: string; // ID of the game group this game belongs to
    players: Player[]; // Vollständige Spielerdaten für die Spiele
    rounds: Round[]; // This is now required and must be an array
    averagePoints: number;
    date: Date;
}
