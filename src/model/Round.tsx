export enum ResultType {
    UNCHANGED, WIN, LOSE
}

export interface Round {
    id: number;
    bock: boolean;
    roundPoints: number;
    cowardicePoints: number;
    results: Map<string, ResultType>;
}

