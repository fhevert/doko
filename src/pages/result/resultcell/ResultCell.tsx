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


    const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
        parameters.round.results.set(parameters.player, Number(event.currentTarget.value));
        setGame({
            ...game
        })
    }

    return (
        <TableCell key={'TC-' + parameters.round.id + '-' + parameters.player.id}>
            <FormControl fullWidth>
                <NativeSelect
                    onChange={onChange}
                    defaultValue={ResultType.UNCHANGED}
                    inputProps={{
                        name: 'age',
                        id: 'uncontrolled-native',
                    }}
                    value={parameters.round.results.get(parameters.player)}
                >
                    <option value={ResultType.UNCHANGED}></option>
                    <option value={ResultType.WIN}>/</option>
                    <option value={ResultType.LOSE}>X</option>
                </NativeSelect>
            </FormControl>
        </TableCell>
    )
}

export default ResultCell;
