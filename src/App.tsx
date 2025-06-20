import React, {memo, ReactNode, useEffect, useState} from 'react';
import './App.css';
import {AppBar, Button, createTheme, CssBaseline, ThemeProvider, Toolbar, Typography} from "@mui/material";
import ResultTable from "./pages/result/resulttable/ResultTable";
import {emptyGame} from "./model/EmptyGame";
import {Game} from "./model/Game";
import {Round} from "./model/Round";
import {GameContext} from './model/context/GameContext';
import PlayersPage from "./pages/player/player/PlayersPage";
import {Link, MemoryRouter, Navigate, Route, Routes} from "react-router-dom";
import {auth, firebaseDB} from "./firebase/firebase-config";
import {DataSnapshot, onValue, ref} from "firebase/database";
import {useAuth} from './firebase/AuthContext';
import {signOut} from 'firebase/auth';
import Login from "./pages/login";
import {convertFromDbGame} from "./firebase/DbFunctions";

// Separate component for auth-dependent UI parts
const AuthStatusBar = memo(() => {
    const { currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Fehler beim Abmelden:', error);
        }
    };

    return (
        <Toolbar sx={{height: '50px', maxheight: '50px'}}>
            <Link to="/doko" style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
                <Typography variant="h6" component="div">
                    Doko
                </Typography>
            </Link>
            {currentUser ? (
                <Button  color="inherit" onClick={handleLogout}>
                    <Typography variant="body1" component="div">
                        Logout ({currentUser.email})
                    </Typography>
                </Button>
            ) : (
                <Link to="/login">
                    <Button color="inherit">
                        <Typography variant="body1" component="div">
                            Login
                        </Typography>
                    </Button>
                </Link>
            )}
        </Toolbar>
    );
});

// Definieren Sie den Typ für die Props der PrivateRoute
interface PrivateRouteProps {
    children: ReactNode;
}

// Separate component for private routes
const PrivateRoute: React.FC<PrivateRouteProps> = memo(({ children }) => {
    const { currentUser } = useAuth();
    return currentUser ? <>{children}</> : <Navigate to="/login" />; // Verwende <></> für fragment
});

function App() {
    const [gameId, setGameId] = useState('gameId');
    const [game, setGame] = React.useState(emptyGame);
    const [isLoading, setIsLoading] = React.useState(true);


    const darkTheme = createTheme({
        palette: {
            mode: 'light',
        },
    });

     useEffect(() => {
         const collectionRef = ref(firebaseDB, 'game');
         const fetchData = () => {
            setIsLoading(true);
            // Listen for changes in the collection
            onValue(collectionRef, (firebaseDbSnapshot: DataSnapshot) => {
                if (firebaseDbSnapshot.exists()) {
                    const game = firebaseDbSnapshot.val() as Game
                    if (game) {
                        setGame(convertFromDbGame(game));
                    }
               }
               setIsLoading(false);
            });
          };

          // Fetch data when the component mounts
          fetchData();
     }, []);

    return (
        <>
            <CssBaseline/>
            <ThemeProvider theme={darkTheme}>
                <GameContext.Provider value={{game, setGame, isLoading}}>
                    <MemoryRouter>
                        <AppBar position="static" sx={{ '& .MuiToolbar-root': { minHeight: '50px' } }}>
                            <AuthStatusBar />
                        </AppBar>
                        <Routes>
                            <Route path="/" element={<Navigate to="/doko" />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/doko" element={
                                    <PrivateRoute>
                                        <PlayersPage/>
                                    </PrivateRoute>
                                }
                            />
                            <Route path="/results" element={
                                    <PrivateRoute>
                                        <ResultTable gameId={gameId}/>
                                    </PrivateRoute>
                                }
                            />
                        </Routes>
                    </MemoryRouter>
                </GameContext.Provider>
            </ThemeProvider>
        </>
    );
}

export default App;
