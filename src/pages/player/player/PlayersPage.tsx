import React, {ReactEventHandler} from 'react';
import './PlayersPage.css';
import {useGameContext} from "../../../model/context/GameContext";
import {ToggleButton, CardActions, CardContent, Card, Stack, Button, TextField, Grid} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import {Simulate} from "react-dom/test-utils";
import play = Simulate.play;
import {Link} from "react-router-dom";
import Layout from "../../../layout/Layout";

function PlayersPage() {
    const {game, setGame, isLoading} = useGameContext()

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
                <Grid container spacing={2} sx={{padding: 5}}>
                   {
                       game.players.map((player) => (
                           <Grid item xs={12} sm={6} md={4} key={player.id}>
                               <Card variant="outlined" sx={{padding:1, height: '100%'}} >
                                   <CardContent>
                                        <TextField fullWidth onChange={changeListener} name={player.id} type="text" InputLabelProps={{shrink: true}} variant="standard" value={player.name} disabled={isLoading}/>
                                   </CardContent>
                                   <CardActions>
                                       <ToggleButton
                                           disabled={calculateTotalResults() > 0 || isLoading}
                                           value="check"
                                           selected={player.aktiv}
                                           name={player.id}
                                           onChange={handleChangeAktiv}
                                       >
                                            <CheckIcon />
                                       </ToggleButton>
                                   </CardActions>
                               </Card>
                           </Grid>
                       ))
                   }
                   <Grid item xs={12} sx={{display: 'flex', justifyContent: 'center', marginTop: 2}}>
                       <Link to={isLoading ? "#" : "/results"}>
                           <Button disabled={isLoading}>
                               <p>Ergebnisse</p>
                           </Button>
                       </Link>
                   </Grid>
               </Grid>
            </Layout>
        </>
    );
}

export default PlayersPage;
