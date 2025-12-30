import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'; // Icon für den Geber
import {getResult} from "../resultcell/ResultCell";
import {useGameContext} from "../../../model/context/GameContext";
import {ResultType, Round} from "../../../model/Round";
import RundenDialog from "../dialog/RundenDialog";
import ErgebnisDialog from "../dialog/ErgebnisDialog";
import {Player} from "../../../model/Player";

function ResultTable(parameters: { gameId: string }) {
    const { game, setGame } = useGameContext();
    const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

    const headerBlue = "#1a237e";

    const activePlayers = useMemo(() => game.players.filter(p => p.aktiv), [game.players]);
    const playerCount = activePlayers.length;

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
            results: resultsMap
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
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                    <ErgebnisDialog />
                </Box>
                <Box sx={{ display: 'flex', width: '100%', px: padding, pb: 2 }}>
                    {activePlayers.map((player) => (
                        <Box key={player.id} sx={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
                            <Typography noWrap sx={{ fontSize: fontSizeName, color: 'text.secondary', fontWeight: 'bold' }}>
                                {player.firstname.toUpperCase()}
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
                                    <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 'bold' }}>
                                        #{actualRoundIndex + 1}
                                    </Typography>
                                    {round.bock && <LocalFireDepartmentIcon sx={{ color: '#ff1744', fontSize: 14 }} />}
                                </Stack>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: '800', color: headerBlue }}>
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
                                            <Typography noWrap sx={{ fontSize: '0.5rem', color: pIdx === dealerIndex ? headerBlue : 'text.disabled', fontWeight: pIdx === dealerIndex ? 'bold' : 'normal' }}>
                                                {p.firstname.substring(0, 3).toUpperCase()}
                                            </Typography>
                                            {pIdx === dealerIndex && <SportsEsportsIcon sx={{ fontSize: 10, color: headerBlue }} />}
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

            {/* --- FIXIERTER BUTTON --- */}
            <Box sx={{
                position: 'fixed', bottom: 0, left: 0, right: 0, p: 2,
                background: 'linear-gradient(to top, #f5f5f5 70%, rgba(245,245,245,0) 100%)',
                display: 'flex', justifyContent: 'center', zIndex: 20
            }}>
                <Button
                    variant="contained"
                    onClick={handleNeueZeileClick}
                    startIcon={<AddIcon />}
                    sx={{
                        borderRadius: '10px', px: 4, py: 1.5, width: '100%', maxWidth: '350px',
                        fontWeight: '800', bgcolor: headerBlue, textTransform: 'none'
                    }}
                >
                    Nächste Runde
                </Button>
            </Box>
        </Box>
    );
}

export default ResultTable;