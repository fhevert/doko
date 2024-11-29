import {Player} from "./Player";

export enum ResultType {
    UNCHANGED, WIN, LOSE
}

export interface Round {
    id: string
    roundPoints: number;
    results: Map<Player, number>;
}