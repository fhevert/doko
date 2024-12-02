import React, {useState} from 'react';
import './App.css';
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import ResultTable from "./pages/result/resulttable/ResultTable";
import {bspGame} from "./model/bsp/BspGame";
import {GameContext} from './model/context/GameContext';
import PlayersPage from "./pages/player/player/PlayersPage";
import {BrowserRouter, Route, Routes} from "react-router-dom";

function App() {
    const [gameId, setGameId] = useState('gameId');
    const [game, setGame] = React.useState(bspGame);

    const darkTheme = createTheme({
        palette: {
            mode: 'light',
        },
    });

    return (
        <>
            <CssBaseline/>
            <ThemeProvider theme={darkTheme}>
                <GameContext.Provider value={{game, setGame}}>
                    <BrowserRouter>
                        <Routes>
                            <Route index path="doko" element={<PlayersPage/>}/>
                            <Route path="results" element={<ResultTable gameId={gameId}/>}/>
                        </Routes>
                    </BrowserRouter>
                </GameContext.Provider>
            </ThemeProvider>
        </>
    );
}

export default App;
