import React, {ChangeEvent} from 'react';
import '../css/Result.css';
import {FormControl, Icon, InputBase, InputLabel, MenuItem, NativeSelect, Select, TableCell} from "@mui/material";
import {ResultType, Round} from "../../../model/Round";
import {Player} from "../../../model/Player";
import {useGameContext} from "../../../model/context/GameContext";
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';

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
        <TableCell key={'TC-' + parameters.round.id + '-' + parameters.player.id}>
            {getResult(parameters.round, parameters.player.id)}
        </TableCell>
    )
}