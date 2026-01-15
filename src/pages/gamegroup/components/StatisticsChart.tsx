import React from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatisticsChartProps } from '../types/statistics.types';

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  title,
  data,
  series: seriesProp,
  formatter = (value) => String(value),
}) => {
  // Normalize series to always be an array
  const series = Array.isArray(seriesProp) ? seriesProp : [seriesProp];
  const hasMultipleSeries = series.length > 1;

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
      <Typography variant="h6" gutterBottom align="center">
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barGap={0}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: any) => [formatter(value), '']}
            labelFormatter={(label) => `Spieler: ${label}`}
          />
          <Legend />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
              stackId={hasMultipleSeries ? 'a' : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default StatisticsChart;
