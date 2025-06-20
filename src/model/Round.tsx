export enum ResultType {
    UNCHANGED, WIN, LOSE
}

export interface Round {
    id: number;
    bock: boolean;
    solo: boolean
    multiplier: number;
    roundPoints: number;
    cowardicePoints: number;
    results: Map<string, ResultType>;
}

