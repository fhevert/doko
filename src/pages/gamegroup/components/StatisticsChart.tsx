import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatisticsChartProps } from '../types/statistics.types';

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  title,
  data,
  dataKey,
  color,
  formatter = (value) => String(value),
}) => (
  <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
    <Typography variant="h6" gutterBottom align="center">
      {title}
    </Typography>
    <ResponsiveContainer width="100%" height="90%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value: any) => [formatter(value), '']}
          labelFormatter={(label) => `Spieler: ${label}`}
        />
        <Legend />
        <Bar 
          dataKey={dataKey} 
          name={title}
          fill={color} 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  </Paper>
);

export default StatisticsChart;
