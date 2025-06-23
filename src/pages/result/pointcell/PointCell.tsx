import React, {useId} from 'react';
import {Stack, TableCell, Typography} from "@mui/material";
import {Round} from "../../../model/Round";

function PointCell(parameters: { round: Round}) {
    const key = useId();
    return (
        <TableCell sx={{ whiteSpace: 'nowrap', width:'0px', borderRight: '1px solid #e0e0e0'}} align={'center'} className='cellWithRightLine' key={'TC' + key}>
            <Stack width='100%' alignItems="center" justifyContent="center" direction="row" spacing={'1px'} divider={<Typography>|</Typography>}>
                {parameters.round.solo && <Typography>{'S'}</Typography>}
                {parameters.round.bock && <Typography>{'B'}</Typography>}
                <Typography>{parameters.round.roundPoints}</Typography>
            </Stack>

        </TableCell>
    )
}

export default PointCell;
