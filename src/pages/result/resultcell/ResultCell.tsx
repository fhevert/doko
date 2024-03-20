import React, {ChangeEvent} from 'react';
import '../css/Result.css';
import {InputBase, TableCell, TextField} from "@mui/material";
import {Round} from "../../../model/Round";
import {Player} from "../../../model/Player";
import {useGameContext} from "../../../model/context/GameContext";

function ResultCell(parameters: { round: Round, player: Player }) {
    const {game, setGame} = useGameContext()
    const updateState = (event: ChangeEvent<HTMLInputElement>) => {
        parameters.round.results.set(parameters.player, Number(event.currentTarget.value));
        setGame({
            ...game
        })
    }

    return (
        <TableCell key={'TC-' + parameters.round.id + '-' + parameters.player.id}>
            <InputBase onChange={updateState}
                sx={{ ml: 1, flex: 1 }}
                type="number"
                value={parameters.round.results.get(parameters.player)}
            />
        </TableCell>
    )
}

export default ResultCell;
