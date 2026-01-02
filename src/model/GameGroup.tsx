import {Player} from "./Player";
import {Round} from "./Round";
import {Game} from "./Game";

export interface GameGroup {
    id: string;
    name: string;
    players: Player[];
    rounds: Round[];
    games: Game[];
    createdAt: number;
    updatedAt: number;
}