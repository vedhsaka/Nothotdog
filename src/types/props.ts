import { MetricVariant } from './base';

export interface MetricsDisplayProps {
  label: string;
  value: number;
  variant?: MetricVariant;
  className?: string;
}