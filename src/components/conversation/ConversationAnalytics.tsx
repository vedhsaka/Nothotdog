import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricsData {
  timestamp: string;
  responseTime: number;
  validationScore: number;
  contextRelevance: number;
}

interface ConversationAnalyticsProps {
  scenarioId: string;
  history: Array<{
    metrics: {
      totalTime: number;
      averageResponseTime: number;
      averageValidationScore: number;
      averageContextRelevance: number;
      completionRate: number;
      successRate: number;
    };
    timestamp: string;
  }>;
  aggregateMetrics: {
    averageTime: number;
    averageResponseTime: number;
    averageValidationScore: number;
    averageContextRelevance: number;
    successRate: number;
  };
}

export function ConversationAnalytics({ history, aggregateMetrics }: ConversationAnalyticsProps) {
  const metricsData: MetricsData[] = history.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    responseTime: item.metrics.averageResponseTime,
    validationScore: item.metrics.averageValidationScore * 100,
    contextRelevance: item.metrics.averageContextRelevance * 100
  }));

  return (
    <div className="space-y-4">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(aggregateMetrics.successRate * 100)}%
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(aggregateMetrics.averageResponseTime)}ms
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Validation Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(aggregateMetrics.averageValidationScore * 100)}%
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Context Relevance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(aggregateMetrics.averageContextRelevance * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Over Time */}
      <Card className="bg-black/40 border-zinc-800">
        <CardHeader>
          <CardTitle>Metrics Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#666"
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fill: '#666' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111',
                    border: '1px solid #333'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3b82f6" 
                  name="Response Time (ms)"
                />
                <Line 
                  type="monotone" 
                  dataKey="validationScore" 
                  stroke="#10b981" 
                  name="Validation Score (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="contextRelevance" 
                  stroke="#f59e0b" 
                  name="Context Relevance (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 