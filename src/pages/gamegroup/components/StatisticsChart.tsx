import React from 'react';
import { Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatisticsChartProps } from '../types/statistics.types';

interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  title,
  data,
  series: seriesProp,
  formatter = (value) => String(value),
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Normalize series to always be an array
  const series = Array.isArray(seriesProp) ? seriesProp : [seriesProp];
  const hasMultipleSeries = series.length > 1;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: { xs: 1, sm: 2 }, 
        height: { xs: '300px', sm: '400px' },
        overflow: 'hidden'
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        align="center"
        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
      >
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{ 
            top: 10, 
            right: isMobile ? 10 : 30, 
            left: isMobile ? 0 : 20, 
            bottom: isMobile ? 5 : 20 
          }}
          barSize={isMobile ? 20 : undefined}
          barGap={isMobile ? 0 : 2}
          barCategoryGap={isMobile ? '10%' : '20%'}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: isMobile ? 12 : 14 }}
            tickMargin={isMobile ? 5 : 10}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 12 : 14 }}
            width={isMobile ? 30 : 50}
          />
          <Tooltip
            formatter={(value: any) => [formatter(value), '']}
            labelFormatter={(label) => `Spieler: ${label}`}
            contentStyle={{
              fontSize: isMobile ? '12px' : '14px',
              padding: isMobile ? '5px' : '10px',
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: isMobile ? '5px' : '10px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
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
