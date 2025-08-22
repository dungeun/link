/**
 * Lightweight recharts wrapper
 * Only imports the components actually used to reduce bundle size
 * Tree-shaking friendly exports
 */

// Use standard recharts imports to avoid TypeScript issues in production build
export {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Types
export type {
  LineProps,
  BarProps,
  AreaProps,
  XAxisProps,
  YAxisProps,
  TooltipProps,
  LegendProps,
  ResponsiveContainerProps,
} from "recharts";
