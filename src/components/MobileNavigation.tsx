import {
  Box,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme
} from '@mui/material';
import {useLocation, useNavigate} from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {useEffect, useState} from 'react';
import {GameGroup} from '../model/GameGroup';
import {onValue, ref} from 'firebase/database';
import {firebaseDB} from '../firebase/firebase-config';
import {Game} from "../model/Game";

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<GameGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Lade Gruppen und deren Spiele
  useEffect(() => {
    setLoading(true);
    const groupsRef = ref(firebaseDB, 'gameGroups');
    
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      const groupsData = snapshot.val();
      if (groupsData) {
        const groupsList = Object.entries<GameGroup>(groupsData).map(([id, group]) => {
          // Convert games object to array and ensure proper data structure
          let games: Game[] = [];
          if (group.games) {
            if (Array.isArray(group.games)) {
              // If it's already an array, use it directly
              games = group.games;
            } else if (typeof group.games === 'object' && group.games !== null) {
              // If it's an object, convert to array
              games = Object.entries(group.games).map(([gameId, game]) => {
                // Ensure we have a proper game object with id
                const gameData = game as Game;
                return {
                  ...gameData,
                  id: gameId,
                  // Ensure date is a proper Date object
                  date: gameData.date ? (gameData.date instanceof Date ? gameData.date : new Date(gameData.date)) : new Date()
                };
              });
            }
            // Sort games by date, newest first
            games.sort((a, b) => b.date.getTime() - a.date.getTime());
          }
          
          return {
            ...group,
            id,
            games
          };
        });
        
        // Set initial expanded state for groups
        const initialExpanded = groupsList.reduce((acc, group) => {
          acc[group.id] = expandedGroups[group.id] || false;
          return acc;
        }, {} as {[key: string]: boolean});
        
        setExpandedGroups(prev => ({
          ...initialExpanded,
          ...prev // Preserve any existing expanded states
        }));
        
        setGroups(groupsList);
      } else {
        setGroups([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading groups:', error);
      setLoading(false);
    });

    return () => {
      // Cleanup listener when component unmounts
      unsubscribe();
    };
  }, []); // Remove isOpen from dependencies to load data once

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'keydown' && 
        ((event as React.KeyboardEvent).key === 'Tab' || 
         (event as React.KeyboardEvent).key === 'Shift')) {
      return;
    }
    setIsOpen(open);
  };

  const handleGroupClick = (groupId: string) => {
    setExpandedGroups(prev => {
      // If the group is not in the expanded state, close all other groups
      if (!prev[groupId]) {
        const newState = Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {} as {[key: string]: boolean});
        return {
          ...newState,
          [groupId]: true
        };
      }
      // If the group is already expanded, just close it
      return {
        ...prev,
        [groupId]: false
      };
    });
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleGameClick = (groupId: string, gameId: string) => {
    // Navigate to the specific game
    navigate(`/game-groups/${groupId}/games/${gameId}`);
    setIsOpen(false);
  };

  const formatGameDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('game-groups')) {
      if (path.includes('game-groups/')) {
        const groupId = path.split('/').pop();
        const group = groups.find(g => g.id === groupId);
        return group?.name || 'Gruppe';
      }
      return 'Meine Gruppen';
    } else if (path.includes('players')) {
      return 'Spieler verwalten';
    } else if (path.includes('results')) {
      return 'Spielergebnisse';
    } else if (path.includes('profile')) {
      return 'Mein Profil';
    } else if (path.includes('game')) {
      return 'Aktuelles Spiel';
    }
    return 'Meine Gruppen';
  };

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar - 1
      }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleDrawer(true)}
          sx={{ color: 'inherit' }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ ml: 1, flexGrow: 1, color: 'inherit' }}>
          {getPageTitle()}
        </Typography>
      </Box>
      
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: theme.palette.background.paper,
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing(0, 1),
            ...theme.mixins.toolbar,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={toggleDrawer(false)}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ ml: 1 }}>
              Menü
            </Typography>
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{
            width: '100%',
            overflowY: 'auto',
            flexGrow: 1,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.action.hover,
              borderRadius: '4px',
            },
          }}
        >
          <List>
            {/* Gruppen Abschnitt */}
            <ListItemButton 
              onClick={() => handleNavigation('/game-groups')}
              selected={location.pathname === '/game-groups'}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.action.selected,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                },
              }}
            >
              <ListItemText primary="Gruppen" />
            </ListItemButton>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : groups.length === 0 ? (
              <Typography variant="body2" sx={{ px: 3, py: 1, color: 'text.secondary' }}>
                Keine Gruppen gefunden
              </Typography>
            ) : (
              groups.map((group) => (
                <div key={group.id}>
                  <ListItemButton 
                    onClick={() => handleGroupClick(group.id)}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      pl: 4,
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Box 
                          component="a"
                          href={`/game-groups/${group.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/game-groups/${group.id}`);
                            setIsOpen(false);
                          }}
                          sx={{
                            color: 'inherit',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'none',
                            },
                            cursor: 'pointer',
                            fontWeight: 'normal'
                          }}
                        >
                          {group.name || `Gruppe ${group.id.substring(0, 6)}`}
                        </Box>
                      }
                    />
                    {expandedGroups[group.id] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>

                  <Collapse in={expandedGroups[group.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {group.games && group.games.length > 0 ? (
                        group.games.map((game: Game) => {
                          // Convert Firebase timestamp to Date if needed
                          const gameDate = game.date instanceof Date ? game.date : new Date(game.date);
                          return (
                            <ListItemButton
                              key={game.id}
                              sx={{ pl: 6 }}
                              onClick={() => handleGameClick(group.id, game.id)}
                            >
                              <ListItemText
                                primary={gameDate ? formatGameDate(gameDate) : 'Ohne Datum'}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: 'text.secondary'
                                }}
                              />
                            </ListItemButton>
                          );
                        })
                      ) : (
                        <Typography variant="body2" sx={{ pl: 8, py: 1, color: 'text.secondary' }}>
                          Keine Spiele
                        </Typography>
                      )}
                    </List>
                  </Collapse>
                </div>
              ))
            )}

            <Divider sx={{ my: 1 }} />

            {/* Weitere Menüpunkte können hier hinzugefügt werden */}
          </List>
        </Box>
      </Drawer>
    </>
  );
};
