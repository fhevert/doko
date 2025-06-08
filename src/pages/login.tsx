import React, { useState, FormEvent } from 'react'; // Importiere FormEvent
import {
    TextField,
    Button,
    Container,
    Typography,
    Box,
    Alert,
} from '@mui/material';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import { useNavigate } from 'react-router-dom';
import {auth} from "../firebase/firebase-config";

function Login() {
    const [email, setEmail] = useState<string>(''); // Typisierung von email
    const [password, setPassword] = useState<string>(''); // Typisierung von password
    const [error, setError] = useState<string>(''); // Typisierung von error
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => { // Typisierung des Event-Objekts
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/doko');
        } catch (err: any) { // err kann von verschiedenen Typen sein, hier 'any' zur Vereinfachung
            setError(err.message);
        }
    };

    const handleRegister = async (e: FormEvent) => { // Typisierung des Event-Objekts
        e.preventDefault();
        setError('');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/doko');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Login / Registrierung
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="E-Mail-Adresse"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} // Typisierung des ChangeEvent
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="password"
                        label="Passwort"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} // Typisierung des ChangeEvent
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        onClick={handleLogin}
                    >
                        Login
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 1, mb: 2 }}
                        onClick={handleRegister}
                    >
                        Registrieren
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Login;
// Add this line at the very end of the file if you're still getting TS1208
export {};