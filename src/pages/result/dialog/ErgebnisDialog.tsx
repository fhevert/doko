import React from 'react';
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {useGameContext} from "../../../model/context/GameContext";
import {saveGameToFirebase} from "../../../firebase/DbFunctions";
import {Player} from "../../../model/Player";

function ErgebnisDialog() {
    const { game } = useGameContext();
    const [open, setOpen] = React.useState(false);

    // Theme-Hooks für Responsive Design
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

    const getSpielerergebnis = (player: Player) => player.result * 0.1 + 5;

    const getGesamtergebnis = () =>
        game.players.reduce((total, p) => total + getSpielerergebnis(p), 0);

    const sortedPlayers = [...game.players].sort((a, b) => a.result - b.result);

    return (
        <>
            <Button
                variant="contained"
                onClick={() => setOpen(true)}
                sx={{ borderRadius: '20px'}}
            >
                {String.fromCharCode(216) + ' ' +  game.averagePoints}
            </Button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth
                maxWidth="xs"
                // Verhindert, dass der Dialog auf kleinen Handys zu hoch wird
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '90vh',
                        m: 1
                    }
                }}
            >
                <DialogTitle sx={{ m: 0, p: isMobile ? 1.5 : 2, textAlign: 'center', fontWeight: 'bold', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                    Gesamtergebnis
                    <IconButton
                        onClick={() => { setOpen(false); saveGameToFirebase(game); }}
                        sx={{ position: 'absolute', right: 4, top: 4, color: (theme) => theme.palette.grey[500] }}
                    >
                        <CloseIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                </DialogTitle>

                <Box sx={{ px: 2, pb: 1, textAlign: 'center' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} color="primary.main" fontWeight="800">
                        {formatCurrency(getGesamtergebnis())}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Gesamteinsatz im Topf</Typography>
                </Box>

                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    <List sx={{ width: '100%', bgcolor: 'background.paper', py: 0 }}>
                        {sortedPlayers.map((spieler, index) => {
                            const ergebnis = getSpielerergebnis(spieler);
                            const isWinner = index === 0;

                            return (
                                <React.Fragment key={spieler.id}>
                                    <ListItem
                                        sx={{
                                            py: isMobile ? 0.5 : 1, // Deutlich weniger Padding vertikal
                                            px: 2,
                                            bgcolor: spieler.aktiv ? 'inherit' : 'action.hover'
                                        }}
                                        secondaryAction={
                                            <Typography
                                                variant="body1"
                                                fontWeight="700"
                                                color={ergebnis >= 5 ? "success.main" : "error.main"}
                                                sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                                            >
                                                {formatCurrency(ergebnis)}
                                            </Typography>
                                        }
                                    >
                                        <ListItemAvatar sx={{ minWidth: isMobile ? 40 : 56 }}>
                                            <Avatar sx={{
                                                width: isMobile ? 30 : 40,
                                                height: isMobile ? 30 : 40,
                                                fontSize: isMobile ? '0.8rem' : '1rem',
                                                bgcolor: isWinner ? 'gold' : (spieler.aktiv ? 'primary.light' : 'grey.400'),
                                                boxShadow: isWinner ? 2 : 0
                                            }}>
                                                {isWinner ? <EmojiEventsIcon sx={{ fontSize: isMobile ? 18 : 24 }} /> : (index + 1)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${spieler.firstname} ${spieler.name}`}
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                fontWeight: 600,
                                                style: { fontSize: isMobile ? '0.85rem' : '1rem', lineHeight: 1.2 }
                                            }}
                                            secondary={
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                                                    {spieler.result} Pkt. {!spieler.aktiv && " • Inaktiv"}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ErgebnisDialog;