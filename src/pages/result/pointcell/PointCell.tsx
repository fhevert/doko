import React, {ChangeEvent, Key, useId, useState} from 'react';
import '../css/Result.css';
import {InputBase, TableCell, TextField} from "@mui/material";
import {useGameContext} from "../../../model/context/GameContext";
import {Round} from "../../../model/Round";

function PointCell(parameters: { round: Round}) {
    const {game, setGame} = useGameContext()
    const key = useId();
    const updateState = (event: ChangeEvent<HTMLInputElement>) => {
        const round = game.rounds.find((r) => r.id ===parameters.round.id);
        if (round){
            round.roundPoints = Number(event.currentTarget.value);
            setGame({
                ...game
            })
        }
    };

    return (
        <TableCell className='cellWithRightLine' key={'TC' + key}>
            <InputBase onChange={updateState}
                       sx={{ ml: 1, flex: 1 }}
                       type="number"
                       value={parameters.round.roundPoints}
            />
        </TableCell>
    )
}

export default PointCell;
