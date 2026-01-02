import {Player} from "./Player";
import {Round} from "./Round";

export interface Game {
    id: string; // Changed from number to string for Firebase compatibility
    gameGroupId: string; // ID of the game group this game belongs to
    players: Player[];
    rounds: Round[]; // This is now required and must be an array
    averagePoints: number;
    date: Date;
}