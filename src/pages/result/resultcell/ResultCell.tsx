import React from 'react';
import {TableCell, Typography} from "@mui/material";
import {ResultType, Round} from "../../../model/Round";
import {Player} from "../../../model/Player";

    export function getResult(round: Round, playerId: string): number {
        var result: ResultType | undefined = round.results.get(playerId);
        
        // Check if it's a solo game and this is the only loser
        if (round.solo && result === ResultType.LOSE) {
            // Count how many players lost
            let loseCount = 0;
            round.results.forEach((value) => {
                if (value === ResultType.LOSE) loseCount++;
            });
            
            // If this is the only loser, return roundPoints * 3
            if (loseCount === 1) {
                return round.roundPoints * 3 * round.multiplier;
            }
        }
        
        // Default behavior for non-solo games or when not the only loser
        switch(result) {
           case ResultType.WIN: {
              return round.cowardicePoints * round.multiplier;
           }
           case ResultType.LOSE: {
               return round.roundPoints * round.multiplier;
           }
           default: {
               return 0;
           }
        }
    }

export function ResultCell(parameters: { round: Round, player: Player }) {
    return (
        <TableCell align={'center'} key={'TC-' + parameters.round.id + '-' + parameters.player.id}>
            {/* eslint-disable-next-line eqeqeq */}
            <Typography color={() => {
                if (parameters.round.results.get(parameters.player.id) === ResultType.WIN) {
                    return 'green';
                } else if (parameters.round.results.get(parameters.player.id) === ResultType.LOSE) {
                    return 'red';
                } else {
                    return 'black';
                }
            }
            }>{getResult(parameters.round, parameters.player.id)}</Typography>
        </TableCell>
    )
}
