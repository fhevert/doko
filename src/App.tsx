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
import ProfilePage from "./pages/profile/ProfilePage";
import {convertFromDbGame} from "./firebase/DbFunctions";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Avatar, IconButton, Menu, MenuItem } from '@mui/material'; // Separate component for auth-dependent UI parts

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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            handleClose();
        } catch (error) {
            console.error('Fehler beim Abmelden:', error);
        }
    };

    return (
        <Toolbar sx={{ minHeight: '64px', display: 'flex', justifyContent: 'space-between' }}>
            <AppBreadcrumbs />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {currentUser ? (
                    <>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                            sx={{ p: 0, ml: 2 }}
                        >
                            <Avatar 
                                alt={currentUser.displayName || currentUser.email || 'User'} 
                                src={currentUser.photoURL || ''}
                                sx={{ width: 40, height: 40 }}
                            >
                                {currentUser.email?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={open}
                            onClose={handleClose}
                        >
                            <MenuItem 
                                component={RouterLink} 
                                to="/profile"
                                onClick={handleClose}
                            >
                                <AccountCircleIcon sx={{ mr: 1 }} />
                                Mein Profil
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <Typography color="error">
                                    Abmelden
                                </Typography>
                            </MenuItem>
                        </Menu>
                    </>
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
                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <ProfilePage />
                                </PrivateRoute>
                            } />
                            <Route path="/" element={<Navigate to="/doko" replace />} />
                            <Route path="*" element={<div>404 Not Found</div>} />
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
