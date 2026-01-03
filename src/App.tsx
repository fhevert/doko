import React, {memo, ReactNode, useEffect, useState} from 'react';
import './App.css';
import {
    AppBar,
    Box,
    Breadcrumbs,
    Button,
    CircularProgress,
    createTheme,
    CssBaseline,
    Link,
    ThemeProvider,
    Toolbar,
    Typography
} from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ResultTable from "./pages/result/resulttable/ResultTable";
import {emptyGame} from "./model/EmptyGame";
import {Game} from "./model/Game";
import {GameContext, useGameContext} from './model/context/GameContext';
import {getGameGroup} from './firebase/GameGroupService';
import PlayersPage from "./pages/player/player/PlayersPage";
import GameGroupPage from "./pages/gamegroup";
import GameGroupDetailPage from "./pages/gamegroup/GameGroupDetailPage";
import {Link as RouterLink, MemoryRouter, Navigate, Route, Routes, useLocation} from "react-router-dom";
import {auth, firebaseDB} from "./firebase/firebase-config";
import {DataSnapshot, onValue, ref} from "firebase/database";
import {useAuth} from './firebase/AuthContext';
import {signOut} from 'firebase/auth';
import Login from "./pages/login";
import {convertFromDbGame} from "./firebase/DbFunctions"; // Separate component for auth-dependent UI parts

// Separate component for auth-dependent UI parts
const AppBreadcrumbs = memo(() => {
    const location = useLocation();
    const { game } = useGameContext();
    const [groupName, setGroupName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchGroupName = async () => {
            if (!game.gameGroupId) {
                setGroupName('');
                return;
            }
            
            setIsLoading(true);
            try {
                const group = await getGameGroup(game.gameGroupId);
                if (group) {
                    setGroupName(group.name || `Gruppe ${game.gameGroupId.substring(0, 5)}`);
                }
            } catch (error) {
                console.error('Fehler beim Laden der Gruppe:', error);
                setGroupName(`Gruppe ${game.gameGroupId.substring(0, 5)}`);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchGroupName();
    }, [game.gameGroupId]);

    const pathnames = location.pathname.split('/').filter(x => x);
    
    // Get the current game name if available
    const currentGameName = game?.date 
        ? `Spiel vom ${new Date(game.date).toLocaleDateString('de-DE')}`
        : 'Neues Spiel';

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                    Lade...
                </Typography>
            </Box>
        );
    }

    return (
        <Breadcrumbs
            aria-label="breadcrumb"
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{
                flexGrow: 1,
                ml: 2,
                '& .MuiBreadcrumbs-separator': {
                    mx: 0.5
                }
            }}
        >
            <Link
                component={RouterLink}
                to="/"
                color="inherit"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    '&:hover': {
                        textDecoration: 'underline',
                    },
                }}
            >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Start
            </Link>
            <Link
                component={RouterLink}
                to="/game-groups"
                color="inherit"
                sx={{
                    textDecoration: 'none',
                    '&:hover': {
                        textDecoration: 'underline',
                    },
                }}
            >
                Spielegruppen
            </Link>

            {/* Show group name when in a specific group */}
            {game.gameGroupId && groupName && (
                <Link
                    component={RouterLink}
                    to={`/game-groups/${game.gameGroupId}`}
                    color="inherit"
                    sx={{
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    {groupName}
                </Link>
            )}

            {/* Show group name when in a specific group */}
            {pathnames.includes('results') && (
                <Link
                    component={RouterLink}
                    to={`/game-groups/${game.gameGroupId}`}
                    color="inherit"
                    sx={{
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    {currentGameName}
                </Link>
            )}
        </Breadcrumbs>
    );
});

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
        <Toolbar sx={{ minHeight: '64px', display: 'flex', gap: 2 }}>
            <AppBreadcrumbs />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {currentUser ? (
                    <Button 
                        color="inherit" 
                        onClick={handleLogout}
                        sx={{ 
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)'
                            }
                        }}
                    >
                        <Typography variant="body1" component="div">
                            Abmelden ({currentUser.email})
                        </Typography>
                    </Button>
                ) : (
                    <Button 
                        component={RouterLink}
                        to="/login"
                        color="inherit"
                        sx={{ 
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)'
                            }
                        }}
                    >
                        <Typography variant="body1" component="div">
                            Anmelden
                        </Typography>
                    </Button>
                )}
            </Box>
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
                        <AppBar position="static">
                            <AuthStatusBar />
                        </AppBar>
                        <Routes>
                            <Route path="/" element={
                                <PrivateRoute>
                                    <GameGroupPage />
                                </PrivateRoute>
                            } />
                            <Route path="/login" element={<Login />} />
                            <Route path="/players" element={
                                <PrivateRoute>
                                    <PlayersPage/>
                                </PrivateRoute>
                            } />
                            <Route path="/results" element={
                                <PrivateRoute>
                                    <ResultTable />
                                </PrivateRoute>
                            } />
                            <Route path="/game-groups" element={
                                <PrivateRoute>
                                    <GameGroupPage />
                                </PrivateRoute>
                            } />
                            <Route path="/game-groups/:groupId" element={
                                <PrivateRoute>
                                    <GameGroupDetailPage />
                                </PrivateRoute>
                            } />
                        </Routes>
                    </MemoryRouter>
                </GameContext.Provider>
            </ThemeProvider>
        </>
    );
}

export default App;
