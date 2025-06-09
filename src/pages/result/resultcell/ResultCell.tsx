import React from 'react';
import {TableCell} from "@mui/material";
import {ResultType, Round} from "../../../model/Round";
import {Player} from "../../../model/Player";
import {useGameContext} from "../../../model/context/GameContext";

    export function getResult(round: Round, playerId: string): number {
        var result: ResultType | undefined = round.results.get(playerId);
        switch(result) {
           case ResultType.WIN: {
              return round.cowardicePoints;
           }
           case ResultType.LOSE: {
                return round.roundPoints;
           }
           default: {
               return 0;
           }
        }
    }

export function ResultCell(parameters: { round: Round, player: Player }) {
    const {game, setGame} = useGameContext()


    return (
        <TableCell align={'center'} key={'TC-' + parameters.round.id + '-' + parameters.player.id}>
            {getResult(parameters.round, parameters.player.id)}
        </TableCell>
    )
}
