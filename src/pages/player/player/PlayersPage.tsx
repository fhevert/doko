import React, {useMemo, useState} from 'react';
import './PlayersPage.css';
import {useGameContext} from "../../../model/context/GameContext";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Stack,
    TextField,
    ToggleButton,
    Typography
} from "@mui/material";
import {DragDropContext, Draggable, DraggableProvidedDragHandleProps, Droppable, DropResult} from '@hello-pangea/dnd';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import {Link} from "react-router-dom";
import Layout from "../../../layout/Layout";
import NewGame from "./components/NewGame";

interface PlayerCardProps {
    player: any;
    canModify: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onChange: (field: 'firstname' | 'name', value: string) => void;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    isDragging?: boolean;
    getInitials: (f: string, n: string) => string;
}

function PlayersPage() {
    const { game, setGame, isLoading } = useGameContext();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newGuest, setNewGuest] = useState({ firstname: '', name: '' });

    const getInitials = (f: string, n: string): string =>
        `${f?.charAt(0) || ''}${n?.charAt(0) || ''}`.toUpperCase() || '?';

    const canModify = useMemo(() =>
            game.players.reduce((sum: number, p: any) => sum + (p.result || 0), 0) === 0 && !isLoading
        , [game.players, isLoading]);

    // 1. AKTIVE SPIELER: Alle, die 'aktiv' sind (Stamm + Gäste), behalten ihre gespeicherte Reihenfolge
    const activePlayers = useMemo(() =>
            game.players.filter((p: any) => p.aktiv)
        , [game.players]);

    // 2. INAKTIVE SPIELER: Sortierung Stamm (A-Z) und danach Gäste ganz unten
    const inactivePlayersSorted = useMemo(() => {
        const inactive = game.players.filter((p: any) => !p.aktiv);

        const regularInactive = inactive.filter((p: any) => !p.id.toString().includes('guest'));
        const guestInactive = inactive.filter((p: any) => p.id.toString().includes('guest'));

        regularInactive.sort((a: any, b: any) =>
            (a.firstname || "").localeCompare(b.firstname || "")
        );

        return [...regularInactive, ...guestInactive];
    }, [game.players]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || !canModify) return;

        const items = Array.from(activePlayers);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Den globalen State aktualisieren: Die neuen aktiven Items + alle Inaktiven
        const inactiveItems = game.players.filter((p: any) => !p.aktiv);
        setGame({ ...game, players: [...items, ...inactiveItems] });
    };

    const changeName = (id: string, field: 'firstname' | 'name', value: string) => {
        setGame({
            ...game,
            players: game.players.map((p: any) => p.id === id ? { ...p, [field]: value } : p)
        });
    };

    const toggleAktiv = (id: string) => {
        setGame({
            ...game,
            players: game.players.map((p: any) => p.id === id ? { ...p, aktiv: !p.aktiv } : p)
        });
    };

    const deletePlayer = (id: string) => {
        setGame({ ...game, players: game.players.filter((p: any) => p.id !== id) });
    };

    const addGuest = () => {
        if (newGuest.firstname || newGuest.name) {
            const guest = { id: `guest-${Date.now()}`, ...newGuest, aktiv: true, result: 0 };
            // Neue Gäste werden vorne in die Liste eingefügt (direkt aktiv)
            setGame({ ...game, players: [guest, ...game.players] });
            setNewGuest({ firstname: '', name: '' });
            setIsDialogOpen(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: '#f4f6f8', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: '600px' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#2c3e50', textAlign: 'center' }}>
                        Spieler Setup
                    </Typography>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="players-list">
                            {(provided) => (
                                <Grid container spacing={1.5} {...provided.droppableProps} ref={provided.innerRef}>

                                    {/* OBERE SEKTION: AKTIVE SPIELER (Inkl. aktive Gäste) */}
                                    {activePlayers.map((player: any, index: number) => (
                                        <Draggable
                                            key={player.id}
                                            draggableId={player.id.toString()}
                                            index={index}
                                            isDragDisabled={!canModify}
                                        >
                                            {(provided, snapshot) => (
                                                <Grid item xs={12} ref={provided.innerRef} {...provided.draggableProps}>
                                                    <PlayerCard
                                                        player={player}
                                                        canModify={canModify}
                                                        onToggle={() => toggleAktiv(player.id)}
                                                        onDelete={() => deletePlayer(player.id)}
                                                        onChange={(f, v) => changeName(player.id, f, v)}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        isDragging={snapshot.isDragging}
                                                        getInitials={getInitials}
                                                    />
                                                </Grid>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* MITTLERE SEKTION: INTERAKTION */}
                                    {canModify && (
                                        <Grid item xs={12} sx={{ my: 1 }}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<AddIcon />}
                                                onClick={() => setIsDialogOpen(true)}
                                                sx={{ py: 1.5, borderRadius: 3, borderStyle: 'dashed', borderWidth: 2, textTransform: 'none' }}
                                            >
                                                Gast hinzufügen
                                            </Button>
                                        </Grid>
                                    )}

                                    {/* UNTERE SEKTION: PAUSIERENDE SPIELER (Stamm A-Z, dann inaktive Gäste) */}
                                    {inactivePlayersSorted.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="overline" sx={{ mt: 2, mb: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
                                                Pausierende Spieler ({inactivePlayersSorted.length})
                                            </Typography>
                                        </Grid>
                                    )}
                                    {inactivePlayersSorted.map((player: any) => (
                                        <Grid item xs={12} key={player.id}>
                                            <PlayerCard
                                                player={player}
                                                canModify={canModify}
                                                onToggle={() => toggleAktiv(player.id)}
                                                onDelete={() => deletePlayer(player.id)}
                                                onChange={(f, v) => changeName(player.id, f, v)}
                                                getInitials={getInitials}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
                        <NewGame />
                        <Button
                            component={Link}
                            to="/results"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ borderRadius: 3, fontWeight: 'bold', textTransform: 'none' }}
                        >
                            Spiel starten
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Neuer Gastspieler</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Vorname" fullWidth value={newGuest.firstname} onChange={(e) => setNewGuest({ ...newGuest, firstname: e.target.value })} />
                        <TextField label="Nachname" fullWidth value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setIsDialogOpen(false)} color="inherit">Abbrechen</Button>
                    <Button onClick={addGuest} variant="contained" disabled={!newGuest.firstname && !newGuest.name}>Hinzufügen</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}

function PlayerCard({ player, canModify, onToggle, onDelete, onChange, dragHandleProps, isDragging, getInitials }: PlayerCardProps) {
    const isGuest = player.id.toString().includes('guest');

    return (
        <Card elevation={isDragging ? 4 : 0} sx={{
            borderRadius: 3,
            transition: 'all 0.2s',
            border: isDragging ? '2px solid #1976d2' : '1px solid #e0e0e0',
            backgroundColor: player.aktiv ? '#fff' : '#fcfcfc',
            opacity: player.aktiv ? 1 : 0.8,
            boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none'
        }}>
            <CardContent sx={{ py: '10px !important', px: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    {player.aktiv && canModify && (
                        <Box {...dragHandleProps} sx={{ color: 'grey.400', cursor: 'grab', display: 'flex', p: 0.5 }}>
                            <DragHandleIcon fontSize="small" />
                        </Box>
                    )}

                    <Avatar sx={{
                        width: 36, height: 36,
                        bgcolor: player.aktiv ? 'primary.main' : 'grey.300',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        border: isGuest && player.aktiv ? '2px solid #1976d2' : 'none'
                    }}>
                        {getInitials(player.firstname, player.name)}
                    </Avatar>

                    <Stack sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                variant="standard"
                                size="small"
                                value={player.firstname || ''}
                                onChange={(e) => onChange('firstname', e.target.value)}
                                InputProps={{ disableUnderline: true, sx: { fontWeight: 'bold', fontSize: '0.9rem' } }}
                                placeholder="Vorname"
                            />
                            <TextField
                                variant="standard"
                                size="small"
                                value={player.name || ''}
                                onChange={(e) => onChange('name', e.target.value)}
                                InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }}
                                placeholder="Nachname"
                            />
                        </Stack>
                        {isGuest && <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.7rem', fontWeight: 600 }}>GASTSPIELER</Typography>}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {isGuest && canModify && (
                            <IconButton size="small" onClick={onDelete} sx={{ color: 'error.light' }}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        )}
                        <ToggleButton
                            value="check"
                            selected={player.aktiv}
                            onChange={onToggle}
                            disabled={!canModify}
                            size="small"
                            color="primary"
                            sx={{ borderRadius: '50%', border: 'none', p: 1 }}
                        >
                            <CheckIcon fontSize="small" />
                        </ToggleButton>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default PlayersPage;