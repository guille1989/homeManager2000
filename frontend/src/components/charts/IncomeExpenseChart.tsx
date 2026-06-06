import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { IncomeExpensePoint } from "../../types";
import { money } from "../../utils/format";

export const IncomeExpenseChart = ({
  data,
  currency
}: {
  data: IncomeExpensePoint[];
  currency: string;
}) => (
  <div className="h-72 w-full">
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(value) => money(Number(value), currency)} width={82} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => money(Number(value), currency)} />
        <Legend />
        <Bar dataKey="income" name="Ingresos" fill="#59b2b0" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Gastos" fill="#353d54" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
