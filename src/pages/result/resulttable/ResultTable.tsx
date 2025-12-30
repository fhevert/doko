import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

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

    // --- DYNAMISCHE ANPASSUNG ---
    const activePlayers = useMemo(() => game.players.filter(p => p.aktiv), [game.players]);
    const playerCount = activePlayers.length;

    // Berechnet Styles basierend auf der Anzahl der Spieler
    const getAdaptiveStyles = () => {
        if (playerCount <= 4) {
            return { fontSizeName: '0.7rem', fontSizeScore: '1.5rem', padding: 2 };
        } else if (playerCount === 5) {
            return { fontSizeName: '0.6rem', fontSizeScore: '1.2rem', padding: 1.5 };
        } else {
            // Ab 6 Spielern sehr kompakt
            return { fontSizeName: '0.5rem', fontSizeScore: '1rem', padding: 1 };
        }
    };

    const { fontSizeName, fontSizeScore, padding } = getAdaptiveStyles();

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
        if (res === ResultType.WIN) return '#2e7d32'; // MUI Success
        if (res === ResultType.LOSE) return '#d32f2f'; // MUI Error
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
                {[...game.rounds].reverse().map((round, idx) => (
                    <Paper
                        key={round.id}
                        elevation={0}
                        onClick={() => setSelectedRoundId(round.id)}
                        sx={{
                            p: padding,
                            borderRadius: 2,
                            bgcolor: '#fff',
                            border: '1px solid #e0e0e0',
                            transition: 'background-color 0.2s',
                            '&:active': { bgcolor: '#f0f0f0' }
                        }}
                    >
                        {/* Runden-Info */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 'bold' }}>
                                    #{game.rounds.length - idx}
                                </Typography>
                                {round.bock && <LocalFireDepartmentIcon sx={{ color: '#ff1744', fontSize: 14 }} />}
                            </Stack>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: '800', color: headerBlue }}>
                                WERT: {round.roundPoints}
                            </Typography>
                        </Stack>

                        {/* Ergebnisse der Spieler */}
                        <Box sx={{ display: 'flex', width: '100%' }}>
                            {activePlayers.map((p) => (
                                <Box key={p.id} sx={{ flex: 1, textAlign: 'center' }}>
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
                                    <Typography noWrap sx={{ fontSize: '0.5rem', color: 'text.disabled', mt: 0.2 }}>
                                        {p.firstname.substring(0, 3).toUpperCase()}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <RundenDialog
                            round={round}
                            open={selectedRoundId === round.id}
                            onClose={() => setSelectedRoundId(null)}
                        />
                    </Paper>
                ))}
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