import {Player} from "./Player";

export interface Round {
    id: string
    roundPoints: number;
    results: Map<Player, number>;
}