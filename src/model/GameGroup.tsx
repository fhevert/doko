import {Player} from "./Player";
import {Round} from "./Round";
import {Game} from "./Game";

// Vereinfachte Spieler-Referenz für Gruppen
export interface GroupPlayer {
    id: string;
    isTemporary?: boolean; // Markiert ob Spieler noch nicht registriert ist
}

export interface GameGroup {
    id: string;
    name: string;
    players: GroupPlayer[]; // Nur IDs und Temporär-Status
    rounds: Round[];
    games: Game[];
    startFee: number; // Startgebühr in Euro
    createdAt: number;
    updatedAt: number;
}
