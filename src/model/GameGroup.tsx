import {Player} from "./Player";
import {Round} from "./Round";
import {Game} from "./Game";

export interface GameGroup {
    id: string;
    name: string;
    players: Player[];
    rounds: Round[];
    games: Game[];
    startFee: number; // Startgebühr in Euro
    createdAt: number;
    updatedAt: number;
}
