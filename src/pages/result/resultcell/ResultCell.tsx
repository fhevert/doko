import React, {ChangeEvent} from 'react';
import '../css/Result.css';
import {FormControl, Icon, InputBase, InputLabel, MenuItem, NativeSelect, Select, TableCell} from "@mui/material";
import {ResultType, Round} from "../../../model/Round";
import {Player} from "../../../model/Player";
import {useGameContext} from "../../../model/context/GameContext";
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';

function ResultCell(parameters: { round: Round, player: Player }) {
    const {game, setGame} = useGameContext()


    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        parameters.round.results.set(parameters.player.id, Number(event.currentTarget.value));
        setGame({
            ...game
        })
    }

    return (
        <TableCell key={'TC-' + parameters.round.id + '-' + parameters.player.id}>
            {parameters.round.results.get(parameters.player.id)}
        </TableCell>
    )
}

export default ResultCell;
