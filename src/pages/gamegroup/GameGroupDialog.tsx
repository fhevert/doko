import React, {useEffect, useState} from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
    Tabs,
    Tab,
    Alert,
    Menu,
    MenuItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {Player} from '../../model/Player';
import {GameGroup} from '../../model/GameGroup';
import {Game} from '../../model/Game';
import {Delete as DeleteIcon, PersonAdd as PersonAddIcon, SwapHoriz as SwapIcon} from '@mui/icons-material';
import {getAllUsers, UserProfile} from '../../firebase/UserService';
import {replaceTemporaryPlayer, replacePlayerInAllGames} from '../../utils/playerUtils';

type GameGroupFormData = Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>;

interface GameGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => void;
    group: GameGroup | null;
    games?: Game[]; // Spiele der Gruppe für den Austausch
    onGamesUpdate?: (games: Game[]) => void; // Callback für aktualisierte Spiele
}

const GameGroupDialog: React.FC<GameGroupDialogProps> = ({open, onClose, onSave, group, games = [], onGamesUpdate}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [formData, setFormData] = useState<GameGroupFormData>({
        name: '',
        players: [],
        startFee: 5
    });
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playerInputTab, setPlayerInputTab] = useState(0); // 0 = registrierte Spieler, 1 = manuelle Eingabe
    const [manualPlayerName, setManualPlayerName] = useState('');
    const [manualPlayerEmail, setManualPlayerEmail] = useState('');
    const [swapMenuAnchor, setSwapMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedPlayerToSwap, setSelectedPlayerToSwap] = useState<Player | null>(null);
    const [pendingSwaps, setPendingSwaps] = useState<Map<string, UserProfile>>(new Map());
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const users = await getAllUsers();
                setAvailableUsers(users);
                setError(null);
            } catch (err) {
                console.error('Error loading users:', err);
                setError('Fehler beim Laden der Benutzer');
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchUsers();
        }
    }, [open]);

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name || '',
                players: [...group.players],
                startFee: group.startFee || 0
            });
        } else {
            setFormData({
                name: '',
                players: [],
                startFee: 0
            });
        }
    }, [group]);

    const handleAddPlayer = (user: UserProfile) => {
        if (!formData.players.some(p => p.id === user.uid)) {
            const newPlayer: Player = {
                id: user.uid,
                email: user.email || '',
                name: user.lastName || 'Unbekannt',
                firstname: user.firstName || user.email?.split('@')[0] || 'Unbekannt',
                result: 0,
                aktiv: true,
                isTemporary: false
            };

            setFormData(prev => ({
                ...prev,
                players: [...prev.players, newPlayer]
            }));
            
            // Find the next available user who isn't already in the group
            const nextUser = availableUsers.find(u => 
                !formData.players.some(p => p.id === u.uid) && u.uid !== user.uid
            );
            
            // Set the next user as selected
            setSelectedUser(nextUser || null);
        }
    };

    const handleAddManualPlayer = () => {
        if (!manualPlayerName.trim()) return;
        
        // Generate temporary ID with timestamp to avoid conflicts
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newPlayer: Player = {
            id: tempId,
            email: manualPlayerEmail.trim() || `${tempId}@temp.local`,
            name: manualPlayerName.split(' ').slice(1).join(' ') || '',
            firstname: manualPlayerName.split(' ')[0] || manualPlayerName,
            result: 0,
            aktiv: true,
            isTemporary: true
        };

        setFormData(prev => ({
            ...prev,
            players: [...prev.players, newPlayer]
        }));
        
        // Clear manual input fields
        setManualPlayerName('');
        setManualPlayerEmail('');
    };

    const handleOpenSwapMenu = (event: React.MouseEvent<HTMLElement>, player: Player) => {
        setSwapMenuAnchor(event.currentTarget);
        setSelectedPlayerToSwap(player);
    };

    const handleCloseSwapMenu = () => {
        setSwapMenuAnchor(null);
        setSelectedPlayerToSwap(null);
    };

    const handleSelectSwapPlayer = (user: UserProfile) => {
        if (!selectedPlayerToSwap) return;
        
        // Speichere den Austausch als pending
        setPendingSwaps(prev => new Map(prev).set(selectedPlayerToSwap.id, user));
        handleCloseSwapMenu();
    };

    const handleConfirmSwaps = () => {
        setConfirmDialogOpen(true);
    };

    const handleExecuteSwaps = () => {
        let updatedPlayers = [...formData.players];
        let updatedGames = [...games];

        // Führe alle pending Swaps aus
        pendingSwaps.forEach((user, tempPlayerId) => {
            // Ersetze in der Spielerliste
            updatedPlayers = replaceTemporaryPlayer(updatedPlayers, tempPlayerId, user);
            
            // Ersetze in allen Spielen
            updatedGames = replacePlayerInAllGames(updatedGames, tempPlayerId, user.uid);
        });

        setFormData(prev => ({ ...prev, players: updatedPlayers }));
        
        // Informiere Eltern-Komponente über aktualisierte Spiele
        if (onGamesUpdate) {
            onGamesUpdate(updatedGames);
        }

        // Clear pending swaps
        setPendingSwaps(new Map());
        setConfirmDialogOpen(false);
        
        // Speichere die Gruppe nach dem Austausch
        onSave({
            name: formData.name,
            players: updatedPlayers.filter(p => p.aktiv),
            startFee: formData.startFee
        });
    };

    const handleCancelSwaps = () => {
        setPendingSwaps(new Map());
        setConfirmDialogOpen(false);
    };

    const handleUserSelect = (event: React.SyntheticEvent, value: UserProfile | null) => {
        setSelectedUser(value);
    };

    const handleRemovePlayer = (id: string) => {
        // Only check for active players if it's an existing group
        if (group) {
            const activePlayers = formData.players.filter(p => p.aktiv);
            if (activePlayers.length === 1 && activePlayers[0].id === id) {
                return; // Don't remove the last active player in an existing group
            }
        }

        setFormData(prev => ({
            ...prev,
            players: prev.players.filter(player => player.id !== id)
        }));
    };

    const handleToggleActive = (id: string) => {
        setFormData(prev => ({
            ...prev,
            players: prev.players.map(player =>
                player.id === id ? {...player, aktiv: !player.aktiv} : player
            )
        }));
    };

    const handleSubmit = () => {
        // Wenn es pending Swaps gibt, zuerst bestätigen
        if (pendingSwaps.size > 0) {
            handleConfirmSwaps();
            return;
        }
        
        onSave({
            name: formData.name,
            players: formData.players.filter(p => p.aktiv),
            startFee: formData.startFee
        });
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth={isMobile ? 'xs' : 'sm'} 
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                {group ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Gruppenname"
                    fullWidth
                    variant="outlined"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    sx={{mb: 2}}
                    size={isMobile ? 'small' : 'medium'}
                />

                <TextField
                    margin="dense"
                    label="Startgebühr (€)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.startFee}
                    onChange={(e) => setFormData(prev => ({...prev, startFee: parseFloat(e.target.value) || 0}))}
                    sx={{mb: 3}}
                    size={isMobile ? 'small' : 'medium'}
                    inputProps={{ min: 0, step: 0.5 }}
                />

                <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                    Spieler
                </Typography>
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs 
                        value={playerInputTab} 
                        onChange={(e, newValue) => setPlayerInputTab(newValue)}
                        variant={isMobile ? 'fullWidth' : 'standard'}
                    >
                        <Tab label="Registrierte Spieler" />
                        <Tab label="Manuelle Eingabe" />
                    </Tabs>
                </Box>

                {playerInputTab === 0 && (
                    <Box sx={{
                        display: 'flex', 
                        gap: 2, 
                        mb: 2, 
                        alignItems: 'center',
                        flexDirection: isMobile ? 'column' : 'row',
                        width: '100%'
                    }}>
                        <Autocomplete
                            options={availableUsers.filter(user => 
                                !formData.players.some(player => player.id === user.uid)
                            )}
                            getOptionLabel={(user) => 
                                user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : user.email?.split('@')[0] || 'Unbekannt'
                            }
                            value={selectedUser}
                            onChange={handleUserSelect}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Spieler auswählen"
                                    variant="outlined"
                                    size={isMobile ? 'small' : 'small'}
                                    sx={{ 
                                        minWidth: isMobile ? '100%' : 300,
                                        width: isMobile ? '100%' : 'auto'
                                    }}
                                />
                            )}
                            renderOption={(props, user) => (
                                <li {...props}>
                                    {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}` 
                                        : user.email?.split('@')[0] || 'Unbekannter Benutzer'}
                                </li>
                            )}
                            isOptionEqualToValue={(option, value) => option.uid === value.uid}
                            noOptionsText="Keine weiteren Spieler verfügbar"
                            loadingText="Lade Benutzer..."
                            loading={loading}
                            disabled={loading}
                            fullWidth={isMobile}
                        />
                        <Button
                            variant="contained"
                            onClick={() => selectedUser && handleAddPlayer(selectedUser)}
                            startIcon={<PersonAddIcon/>}
                            disabled={!selectedUser}
                            sx={{ 
                                height: '40px',
                                width: isMobile ? '100%' : 'auto',
                                minWidth: isMobile ? '100%' : 'auto'
                            }}
                        >
                            Hinzufügen
                        </Button>
                    </Box>
                )}

                {playerInputTab === 1 && (
                    <Box sx={{
                        display: 'flex', 
                        gap: 2, 
                        mb: 2, 
                        alignItems: 'flex-end',
                        flexDirection: isMobile ? 'column' : 'row',
                        width: '100%'
                    }}>
                        <TextField
                            label="Spielername"
                            variant="outlined"
                            value={manualPlayerName}
                            onChange={(e) => setManualPlayerName(e.target.value)}
                            size={isMobile ? 'small' : 'small'}
                            sx={{ 
                                width: isMobile ? '100%' : '200px'
                            }}
                            placeholder="Vorname Nachname"
                        />
                        <TextField
                            label="E-Mail (optional)"
                            variant="outlined"
                            value={manualPlayerEmail}
                            onChange={(e) => setManualPlayerEmail(e.target.value)}
                            size={isMobile ? 'small' : 'small'}
                            type="email"
                            sx={{ 
                                width: isMobile ? '100%' : '200px'
                            }}
                            placeholder="spieler@email.de"
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddManualPlayer}
                            startIcon={<PersonAddIcon/>}
                            disabled={!manualPlayerName.trim()}
                            sx={{ 
                                height: '40px',
                                width: isMobile ? '100%' : 'auto',
                                minWidth: isMobile ? '100%' : 'auto'
                            }}
                        >
                            Hinzufügen
                        </Button>
                    </Box>
                )}
                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <List dense sx={{ maxHeight: isMobile ? '300px' : 'auto', overflowY: 'auto' }}>
                    {formData.players.map((player) => (
                        <ListItem key={player.id} divider sx={{ pr: isMobile ? 8 : 16 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={player.aktiv}
                                        onChange={() => handleToggleActive(player.id)}
                                        size={isMobile ? 'small' : 'medium'}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography sx={{ 
                                            textDecoration: player.aktiv ? 'none' : 'line-through', 
                                            opacity: player.aktiv ? 1 : 0.7,
                                            fontSize: isMobile ? '0.875rem' : '1rem'
                                        }}>
                                            {player.firstname} {player.name}
                                        </Typography>
                                        {player.isTemporary && (
                                            <Typography variant="caption" color="warning.main">
                                                Temporärer Spieler
                                            </Typography>
                                        )}
                                    </Box>
                                }
                                sx={{ 
                                    textDecoration: player.aktiv ? 'none' : 'line-through', 
                                    opacity: player.aktiv ? 1 : 0.7,
                                    fontSize: isMobile ? '0.875rem' : '1rem'
                                }}
                            />
                            <ListItemSecondaryAction>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {player.isTemporary && (
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => handleOpenSwapMenu(e, player)}
                                            title="Spieler austauschen"
                                        >
                                            <SwapIcon />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleRemovePlayer(player.id)}
                                        title="Spieler entfernen"
                                    >
                                        <DeleteIcon/>
                                    </IconButton>
                                </Box>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
                
                {formData.players.some(p => p.isTemporary) && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Temporäre Spieler können über das Austausch-Icon (↔) durch registrierte Benutzer ersetzt werden. Die Spielergebnisse werden dabei übernommen.
                        {pendingSwaps.size > 0 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {pendingSwaps.size} Austausch(e) zum Speichern ausstehend.
                            </Typography>
                        )}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1 : 0,
                px: isMobile ? 2 : 3,
                pb: isMobile ? 2 : 3
            }}>
                <Button 
                    onClick={onClose}
                    fullWidth={isMobile}
                    sx={{ order: isMobile ? 2 : 1 }}
                >
                    Abbrechen
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!formData.name.trim() || formData.players.filter(p => p.aktiv).length < 1}
                    fullWidth={isMobile}
                    sx={{ order: isMobile ? 1 : 2 }}
                >
                    {pendingSwaps.size > 0 ? `Austauschen & Speichern` : 'Speichern'}
                </Button>
            </DialogActions>
            
            {/* Swap Menu */}
            <Menu
                anchorEl={swapMenuAnchor}
                open={Boolean(swapMenuAnchor)}
                onClose={handleCloseSwapMenu}
                PaperProps={{
                    style: {
                        maxHeight: 300,
                        width: '300px'
                    }
                }}
            >
                <MenuItem disabled>
                    <Typography variant="subtitle2" color="text.secondary">
                        Spieler austauschen: {selectedPlayerToSwap?.firstname} {selectedPlayerToSwap?.name}
                    </Typography>
                </MenuItem>
                {availableUsers.filter(user => 
                    !formData.players.some(player => player.id === user.uid)
                ).map(user => (
                    <MenuItem 
                        key={user.uid} 
                        onClick={() => handleSelectSwapPlayer(user)}
                    >
                        <ListItemIcon>
                            <SwapIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                            primary={user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.email?.split('@')[0] || 'Unbekannt'
                            }
                            secondary={user.email}
                        />
                    </MenuItem>
                ))}
                {availableUsers.filter(user => 
                    !formData.players.some(player => player.id === user.uid)
                ).length === 0 && (
                    <MenuItem disabled>
                        <ListItemText primary="Keine verfügbaren Spieler" />
                    </MenuItem>
                )}
            </Menu>

            {/* Bestätigungsdialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleCancelSwaps}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Spieleraustausch bestätigen</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sie sind dabei {pendingSwaps.size} temporäre Spieler durch registrierte Benutzer zu ersetzen.
                    </Typography>
                    <Typography sx={{ mt: 2, fontWeight: 'bold', color: 'warning.main' }}>
                        ⚠️ Dieser Vorgang kann nicht rückgängig gemacht werden!
                    </Typography>
                    <Typography sx={{ mt: 2 }}>
                        Alle Spielergebnisse in den betroffenen Spielen werden übernommen.
                    </Typography>
                    <List sx={{ mt: 2 }}>
                        {Array.from(pendingSwaps.entries()).map(([tempId, user]) => {
                            const tempPlayer = formData.players.find(p => p.id === tempId);
                            return (
                                <ListItem key={tempId}>
                                    <ListItemText
                                        primary={`${tempPlayer?.firstname} ${tempPlayer?.name}`}
                                        secondary={`→ ${user.firstName} ${user.lastName}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelSwaps}>Abbrechen</Button>
                    <Button 
                        onClick={handleExecuteSwaps} 
                        variant="contained" 
                        color="warning"
                    >
                        Austauschen & Speichern
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default GameGroupDialog;
