import {Container} from '@mui/material'
import React from 'react';
import LayoutProperties from './LayoutProperties';

export default function Layout(properties: LayoutProperties): React.JSX.Element{
    return (
        <>
            <Container component="main" sx={{height: '100dvh', display:'flex', flexDirection:'column', flexWrap:'nowrap', whiteSpaces:'nowrap'}}>
                 <Container component="main" sx={{height: '100dvh', overflow:'auto'}}>
                    {properties.children}
                </Container>
            </Container>
        </>
    );
}