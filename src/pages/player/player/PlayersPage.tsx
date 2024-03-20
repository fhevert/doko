import React, {ReactEventHandler} from 'react';
import './PlayersPage.css';
import {useGameContext} from "../../../model/context/GameContext";
import {Button, TextField} from "@mui/material";
import {Simulate} from "react-dom/test-utils";
import play = Simulate.play;
import {Link} from "react-router-dom";

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

    return (
        <>
            {
                game.players.map((player) => (
                    <TextField onChange={changeListener} key={player.id} name={player.id} id="standard-basic" type="text" InputLabelProps={{shrink: true}} variant="standard" value={player.name}/>
                ))
            }
            <Link to="/results">
                <Button>
                    <p>Click Me!</p>
                </Button>
            </Link>
        </>
    );
}

export default PlayersPage;
