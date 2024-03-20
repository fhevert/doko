import {Game} from "../Game";
import {Player} from "../Player";
import {ResultType, Round} from "../Round";

const fabi: Player = {
    id: '1',
    name: 'Fabian'
}
const chrissi: Player = {
    id: '2',
    name: 'Chrissi'
}
const joschi: Player = {
    id: '3',
    name: 'Joschi'
}
const marcus: Player = {
    id: '4',
    name: 'Marcus'
}
const marci: Player = {
    id: '5',
    name: 'Marci'
}

const createRound = (id: string, points: number): Round => {
    const  resultsMap= new Map<Player, ResultType>();

    resultsMap.set(fabi, ResultType.LOSE);
    resultsMap.set(chrissi, ResultType.UNCHANGED);
    resultsMap.set(joschi, ResultType.UNCHANGED);
    resultsMap.set(marcus, ResultType.UNCHANGED);
    resultsMap.set(marci, ResultType.LOSE);

    return {
        id: id,
        roundPoints: points,
        results: resultsMap
    }
}

export const bspGame = {
    players: [fabi, chrissi, marcus, joschi, marci],
    rounds: [
        createRound('1', 2),
        createRound('2', 2),
        createRound('3', 2),
        createRound('4', 2),
        createRound('5', 2),
        createRound('6', 2),
        createRound('7', 2),
        createRound('8', 2),
        createRound('9', 2),
        createRound('10', 2),
        createRound('11', 2),
        createRound('12', 2),
    ],
    result: new Map<Player, number | undefined>()
} as Game;