import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdown } from "../../types";
import { money } from "../../utils/format";

export const CategoryPieChart = ({
  data,
  currency
}: {
  data: CategoryBreakdown[];
  currency: string;
}) => (
  <div className="h-72 w-full">
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((item) => (
            <Cell key={item.categoryId} fill={item.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => money(Number(value), currency)} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

