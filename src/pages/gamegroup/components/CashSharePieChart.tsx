import React from 'react';
import { Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlayerStats } from '../types/statistics.types';

interface CashSharePieChartProps {
  players: PlayerStats[];
  title?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].name}</p>
        <p style={{ margin: 0 }}>
          Anteil: {payload[0].value.toFixed(2)} €
        </p>
        <p style={{ margin: 0 }}>
          Prozent: {payload[0].payload.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percentage < 5) return null; // Nicht anzeigen bei sehr kleinen Anteilen

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${percentage.toFixed(1)}%`}
    </text>
  );
};

export const CashSharePieChart: React.FC<CashSharePieChartProps> = ({ 
  players, 
  title = "Anteil an der Kasse" 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Daten vorbereiten und nach Kasse-Anteil absteigend sortieren
  const chartData = players
    .filter(player => player.cashShare > 0)
    .sort((a, b) => b.cashShare - a.cashShare)
    .map(player => ({
      name: player.name.split(' ')[0], // Nur Vornamen für kompakte Darstellung
      fullName: player.name,
      value: player.cashShare,
      percentage: 0 // Wird später berechnet
    }));

  // Gesamtsumme berechnen und Prozente hinzufügen
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percentage = total > 0 ? (item.value / total) * 100 : 0;
  });

  // Legende-Daten (bereits sortiert)
  const legendData = chartData.map((item, index) => ({
    id: index,
    value: item.fullName,
    color: COLORS[index % COLORS.length],
    percentage: item.percentage
  }));

  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '4px',
        padding: '10px',
        fontSize: isMobile ? '12px' : '14px'
      }}>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: entry.color,
                  marginRight: '8px',
                  borderRadius: '2px'
                }}
              />
              <span>{entry.value}</span>
            </div>
            <span style={{ 
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              {entry.payload.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          textAlign: 'center',
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Keine Daten für Kasse-Anteile vorhanden
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: { xs: 1, sm: 2 }, 
        height: { xs: '350px', sm: '400px' },
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
      
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={isMobile ? 80 : 120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            content={renderLegend}
            verticalAlign="middle"
            align="right"
            layout="vertical"
            wrapperStyle={{
              paddingLeft: '20px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CashSharePieChart;
