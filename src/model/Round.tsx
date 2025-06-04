import {Player} from "./Player";

export enum ResultType {
    UNCHANGED, WIN, LOSE
}

export interface Round {
    id: number
    roundPoints: number;
    cowardicePoints: number;
    results: Map<string, ResultType>;
}

