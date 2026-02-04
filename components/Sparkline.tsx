
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../types';

interface SparklineProps {
  data: DataPoint[];
  color: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color }) => {
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
