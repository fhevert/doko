import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'; // Icon für den Geber
import {useNavigate, useParams} from 'react-router-dom';
import {getResult} from "../resultcell/ResultCell";
import {useGameContext} from "../../../model/context/GameContext";
import {ResultType, Round} from "../../../model/Round";
import RundenDialog from "../dialog/RundenDialog";
import ErgebnisDialog from "../dialog/ErgebnisDialog";
import {Player} from "../../../model/Player";
import {get, ref} from 'firebase/database';
import {firebaseDB} from "../../../firebase/firebase-config";

function GamePage() {
    const { game, setGame } = useGameContext();
    const navigate = useNavigate();
    const { gameId, groupId } = useParams<{ gameId: string, groupId: string }>();
    const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadGame = async () => {
            if (!gameId || !groupId) {
                console.error('Game ID or Group ID is missing');
                return;
            }
            
            try {
                setIsLoading(true);
                const gameRef = ref(firebaseDB, `gameGroups/${groupId}/games/${gameId}`);
                const snapshot = await get(gameRef);
                
                if (snapshot.exists()) {
                    const gameData = snapshot.val();
                    // Convert results to Map if needed (similar to loadGame in GameGroupDetailPage)
                    const rounds = Array.isArray(gameData?.rounds) 
                        ? gameData.rounds.map((round: any) => {
                            const resultsMap = new Map<string, ResultType>();
                            if (round.results) {
                                if (Array.isArray(round.results)) {
                                    round.results.forEach((result: {key: string, value: number}) => {
                                        if (result && result.key !== undefined && result.value !== undefined) {
                                            resultsMap.set(String(result.key), result.value as ResultType);
                                        }
                                    });
                                } else if (typeof round.results === 'object') {
                                    Object.entries(round.results).forEach(([key, value]) => {
                                        if (value !== undefined) {
                                            resultsMap.set(String(key), value as ResultType);
                                        }
                                    });
                                }
                            }
                            return {
                                ...round,
                                results: resultsMap,
                                date: round.date ? new Date(round.date) : new Date()
                            };
                        })
                        : [];
                    
                    setGame({
                        ...gameData,
                        id: gameId,
                        gameGroupId: groupId,
                        rounds: rounds,
                        date: gameData.date ? new Date(gameData.date) : new Date()
                    });
                }
            } catch (error) {
                console.error('Error loading game:', error);
                // Handle error (e.g., show error message to user)
            } finally {
                setIsLoading(false);
            }
        };
        
        loadGame();
    }, [gameId, groupId, setGame]);
    
    const activePlayers = useMemo(() => game.players.filter(p => p.aktiv), [game.players]);
    const playerCount = activePlayers.length;
    const headerBlue = "#1a237e";

    // Move the useEffect hook before any conditional returns
    useEffect(() => {
        const players = [...game.players];
        let totalActivePoints = 0;
        let activeCount = 0;
        players.forEach(p => {
            if (p.aktiv) {
                let playerResult = 0;
                game.rounds.forEach((round) => {
                    const point = getResult(round, p.id);
                    if (point) playerResult += point;
                });
                p.result = playerResult;
                totalActivePoints += playerResult;
                activeCount++;
            }
        });
        if (activeCount > 0) {
            const average = totalActivePoints / activeCount;
            players.forEach(p => {
                if (!p.aktiv) p.result = average;
            });
            game.averagePoints = average;
        }
    }, [game, setGame]);

    if (isLoading) {
        return <div>Loading game data...</div>;
    }

    const getAdaptiveStyles = () => {
        if (playerCount <= 4) {
            return { fontSizeName: '0.7rem', fontSizeScore: '1.5rem', padding: 2 };
        } else if (playerCount === 5) {
            return { fontSizeName: '0.6rem', fontSizeScore: '1.2rem', padding: 1.5 };
        } else {
            return { fontSizeName: '0.5rem', fontSizeScore: '1rem', padding: 1 };
        }
    };

    const { fontSizeName, fontSizeScore, padding } = getAdaptiveStyles();

    // Berechnung des Gebers für eine bestimmte Runde
    // "Rechts vom Geber wird neuer Geber" bedeutet im Array-Index meist (alt - 1) oder (alt + 1).
    // Hier wird der Geber einfach pro Runde durchrotiert.
    const getDealerIndex = (roundIndex: number) => {
        if (playerCount === 0) return -1;
        return roundIndex % playerCount;
    };

    const handleNeueZeileClick = () => {
        const resultsMap = new Map<string, number>();
        game.players.forEach((player) => resultsMap.set(player.id, 0));
        const newRound: Round = {
            id: game.rounds.length,
            roundPoints: 0,
            bock: false,
            solo: false,
            multiplier: 1,
            cowardicePoints: 0,
            results: resultsMap,
            date: new Date().toISOString()  // Add current date in ISO format
        };
        setGame({ ...game, rounds: [...game.rounds, newRound] });
        setSelectedRoundId(newRound.id);
    };

    function getScoreColor(round: Round, p: Player) {
        const res = round.results.get(p.id);
        if (res === ResultType.WIN) return '#2e7d32';
        if (res === ResultType.LOSE) return '#d32f2f';
        return 'text.primary';
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', bgcolor: '#f5f5f5', overflow: 'hidden' }}>

            {/* --- HEADER --- */}
            <Paper elevation={3} sx={{ borderRadius: 0, bgcolor: 'white', zIndex: 10, borderBottom: `3px solid ${headerBlue}` }}>
                <Box sx={{ display: 'flex', width: '100%', px: padding, p: 2 }}>
                    {activePlayers.map((player) => (
                        <Box key={player.id} sx={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
                            <Typography noWrap sx={{ fontSize: fontSizeName, color: 'text.secondary', fontWeight: 'bold' }}>
                                {player.firstname?.toUpperCase()}
                            </Typography>
                            <Typography sx={{ fontSize: fontSizeScore, fontWeight: '900', lineHeight: 1 }}>
                                {player.result}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Paper>

            {/* --- SCROLL-LISTE --- */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, pb: '100px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[...game.rounds].reverse().map((round, visualIdx) => {
                    const actualRoundIndex = game.rounds.length - 1 - visualIdx;

                    // BLOCK-FARBE: Wechselt alle "playerCount" Runden
                    const blockNumber = Math.floor(actualRoundIndex / playerCount);
                    const isAlternatingBlock = blockNumber % 2 === 1;
                    const dealerIndex = getDealerIndex(actualRoundIndex);

                    return (
                        <Paper
                            key={round.id}
                            elevation={0}
                            onClick={() => setSelectedRoundId(round.id)}
                            sx={{
                                p: padding,
                                borderRadius: 2,
                                // Hintergrundfarbe wechselt blockweise
                                bgcolor: isAlternatingBlock ? '#f0f4ff' : '#fff',
                                border: isAlternatingBlock ? '1px solid #d1d9ff' : '1px solid #e0e0e0',
                                transition: 'background-color 0.2s',
                                '&:active': { bgcolor: '#e0e0e0' }
                            }}
                        >
                            {/* Runden-Info */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', fontWeight: 'bold' }}>
                                        #{actualRoundIndex + 1}
                                    </Typography>
                                    {round.bock && <LocalFireDepartmentIcon sx={{ color: '#ff1744', fontSize: 14 }} />}
                                </Stack>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: '800', color: headerBlue }}>
                                    WERT: {round.roundPoints}
                                </Typography>
                            </Stack>

                            {/* Ergebnisse der Spieler */}
                            <Box sx={{ display: 'flex', width: '100%' }}>
                                {activePlayers.map((p, pIdx) => (
                                    <Box key={p.id} sx={{
                                        flex: 1,
                                        textAlign: 'center',
                                        position: 'relative',
                                        pb: pIdx === dealerIndex ? 0.5 : 0
                                    }}>
                                        <Typography
                                            sx={{
                                                fontSize: fontSizeScore,
                                                fontWeight: '800',
                                                color: getScoreColor(round, p),
                                                lineHeight: 1
                                            }}
                                        >
                                            {getResult(round, p.id) || 0}
                                        </Typography>
                                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.2}>
                                            <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 'normal' }}>
                                                {p.firstname?.substring(0, 3).toUpperCase()}
                                            </Typography>
                                            {pIdx === dealerIndex && <SportsEsportsIcon sx={{ fontSize: '1rem', color: headerBlue }} />}
                                        </Stack>
                                    </Box>
                                ))}
                            </Box>

                            <RundenDialog
                                round={round}
                                open={selectedRoundId === round.id}
                                onClose={() => setSelectedRoundId(null)}
                            />
                        </Paper>
                    );
                })}
            </Box>

            {/* --- FIXIERTE BUTTONS --- */}
            <Box sx={{
                position: 'fixed', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                p: 2,
                background: 'linear-gradient(to top, #f5f5f5 70%, rgba(245,245,245,0) 100%)',
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2,
                zIndex: 20
            }}>
                <Button
                    variant="contained"
                    onClick={handleNeueZeileClick}
                    startIcon={<AddIcon />}
                    sx={{
                        borderRadius: '10px', 
                        px: 4, 
                        py: 1.5, 
                        flex: 1,
                        maxWidth: '350px',
                        minWidth: '150px',
                        fontWeight: '800', 
                        bgcolor: headerBlue, 
                        textTransform: 'none',
                        '&:hover': {
                            bgcolor: '#0d1b6b'
                        }
                    }}
                >
                    Nächste Runde
                </Button>
                <Box sx={{ 
                    flex: 1,
                    maxWidth: '350px',
                    minWidth: '150px',
                    '& .MuiButton-root': {
                        width: '100%',
                        height: '100%',
                        minHeight: '48px'
                    }
                }}>
                    <ErgebnisDialog />
                </Box>
            </Box>
        </Box>
    );
}

export default GamePage;