import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  useMediaQuery, 
  useTheme, 
  Box, 
  IconButton, 
  Typography, 
  Divider, 
  Collapse,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useState, useEffect } from 'react';
import { GameGroup } from '../model/GameGroup';
import { ref, onValue } from 'firebase/database';
import { firebaseDB } from '../firebase/firebase-config';
import { Game } from '../model/Game';

interface GameGroupWithId extends GameGroup {
  // All properties are inherited from GameGroup
}

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<GameGroupWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Lade Gruppen und deren Spiele
  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    const groupsRef = ref(firebaseDB, 'gameGroups');
    
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      const groupsData = snapshot.val();
      if (groupsData) {
        const groupsList = Object.entries(groupsData).map(([id, group]) => {
          const { id: _, ...groupWithoutId } = group as GameGroup;
          return {
            id,
            ...groupWithoutId,
            games: Array.isArray((group as GameGroup).games) 
              ? (group as GameGroup).games
                  .filter((g: any) => g && g.date)
                  .sort((a: any, b: any) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 5) // Nur die letzten 5 Spiele
              : []
          };
        });
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
      // Cleanup listener when component unmounts or isOpen changes
      unsubscribe();
    };
  }, [isOpen]);

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'keydown' && 
        ((event as React.KeyboardEvent).key === 'Tab' || 
         (event as React.KeyboardEvent).key === 'Shift')) {
      return;
    }
    setIsOpen(open);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
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
        return group?.name || 'Gruppendetails';
      }
      return 'Spielgruppen';
    } else if (path.includes('players')) {
      return 'Spieler';
    } else if (path.includes('results')) {
      return 'Ergebnisse';
    } else if (path.includes('profile')) {
      return 'Profil';
    }
    return 'Doko App';
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
              onClick={() => navigate('/game-groups')}
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
                    onClick={() => toggleGroup(group.id)}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      pl: 4,
                    }}
                  >
                    <ListItemText 
                      primary={group.name || `Gruppe ${group.id.substring(0, 6)}`} 
                      primaryTypographyProps={{
                        fontWeight: location.pathname.includes(`/game-groups/${group.id}`) 
                          ? 'bold' 
                          : 'normal'
                      }}
                    />
                    {expandedGroups[group.id] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  
                  <Collapse in={expandedGroups[group.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {group.games && group.games.length > 0 ? (
                        group.games.map((game, index) => (
                          <ListItemButton 
                            key={index}
                            sx={{ pl: 6 }}
                            onClick={() => {
                              navigate(`/game-groups/${group.id}`);
                              // Hier könntest du auch direkt zum Spiel navigieren, falls gewünscht
                              // navigate(`/game/${game.id}`);
                            }}
                          >
                            <ListItemText 
                              primary={game.date ? formatGameDate(game.date) : 'Ohne Datum'}
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: 'text.secondary'
                              }}
                            />
                          </ListItemButton>
                        ))
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
