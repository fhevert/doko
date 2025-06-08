import React from "react";
import {Game} from "../Game";


export type GameContent = {
    game: Game
    setGame: (c: (Game)) => void
    isLoading: boolean
}
export const GameContext = React.createContext<GameContent>({
    game: {} as Game,
    setGame: (_value: Game) => {},
    isLoading: true
})

export const useGameContext = () => React.useContext(GameContext)
