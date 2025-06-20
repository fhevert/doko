import React, {ChangeEvent, useId} from 'react';
import {Stack, TableCell, Typography} from "@mui/material";
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
            <Stack width='100%' alignItems="center" justifyContent="center" direction="row" spacing={1} divider={<Typography>x</Typography>}>
                {parameters.round.solo && <Typography>{'S'}</Typography>}
                {parameters.round.bock && <Typography>{'B'}</Typography>}
                <Typography>{parameters.round.roundPoints}</Typography>
            </Stack>

        </TableCell>
    )
}

export default PointCell;
