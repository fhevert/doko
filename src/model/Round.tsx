import {Player} from "./Player";

export enum ResultType {
    UNCHANGED, WIN, LOSE
}

export interface Round {
    id: number
    roundPoints: number;
    results: Map<string, number>;
}

