import React, {ReactEventHandler} from 'react';
import './PlayersPage.css';
import {useGameContext} from "../../../model/context/GameContext";
import {ToggleButton, CardActions, CardContent, Card, Stack, Button, TextField} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import {Simulate} from "react-dom/test-utils";
import play = Simulate.play;
import {Link} from "react-router-dom";
import Layout from "../../../layout/Layout";

function PlayersPage() {
    const {game, setGame} = useGameContext()

    function changeListener(event: React.ChangeEvent<HTMLInputElement>) {
        const playerId = event.currentTarget.name;
        const player = game.players.find((p) => p.id ===playerId);
        if (player){
            player.name = event.currentTarget.value;
            setGame({
                ...game
            })
        }
    }

    const handleChangeAktiv = (event: React.ChangeEvent<any>): void => {
         const playerId = event.currentTarget.name;
         const player = game.players.find((p) => p.id ===playerId);
         if (player){
             player.aktiv = !player.aktiv
             setGame({
                 ...game
             })
         }
    };

    const calculateTotalResults = (): number => {
        return game.players.reduce((total, player) => {
            return total + (player.result || 0);
        }, 0);
    };


    return (
        <>
            <Layout>
                <Stack  direction="row" sx={{padding: 5, display:'flex', flexWrap:'wrap', alignContent:'center',  alignItems:'center'}}>
                   {
                       game.players.map((player) => (
                           <Card variant="outlined" sx={{padding:1}} >
                               <CardContent>
                                    <TextField fullWidth onChange={changeListener} key={player.id} name={player.id}  type="text" InputLabelProps={{shrink: true}} variant="standard" value={player.name}/>
                               </CardContent>
                               <CardActions>
                                   <ToggleButton
                                       disabled={calculateTotalResults() > 0}
                                       value="check"
                                       selected={player.aktiv}
                                       key={player.id} name={player.id}
                                       onChange={handleChangeAktiv}
                                   >
                                        <CheckIcon />
                                   </ToggleButton>
                               </CardActions>
                           </Card>
                       ))
                   }
                  <Link to="/results">
                       <Button>
                           <p>Ergebnisse</p>
                       </Button>
                   </Link>
               </Stack>
            </Layout>
        </>
    );
}

export default PlayersPage;
