import React, {ChangeEvent, Key, useId, useState} from 'react';
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
        <TableCell sx={{ whiteSpace: 'nowrap', width:'0px', borderRight: '1px solid #e0e0e0'}} align={'center'} className='cellWithRightLine' key={'TC' + key}>
            {parameters.round.roundPoints}
        </TableCell>
    )
}

export default PointCell;
