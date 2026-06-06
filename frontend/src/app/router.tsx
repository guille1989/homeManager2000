import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { HomePage } from "../features/home/HomePage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { TransactionsPage } from "../features/transactions/TransactionsPage";
import { CategoriesPage } from "../features/categories/CategoriesPage";
import { BudgetsPage } from "../features/budgets/BudgetsPage";
import { SavingsGoalsPage } from "../features/savings-goals/SavingsGoalsPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SettingsPage } from "../features/settings/SettingsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/registro", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "mi-economia", element: <DashboardPage visibility="private" /> },
          { path: "mi-economia/movimientos", element: <TransactionsPage visibility="private" /> },
          { path: "mi-economia/presupuestos", element: <BudgetsPage visibility="private" /> },
          { path: "mi-economia/metas", element: <SavingsGoalsPage visibility="private" /> },
          { path: "movimientos", element: <TransactionsPage visibility="shared" /> },
          { path: "categorias", element: <CategoriesPage /> },
          { path: "presupuestos", element: <BudgetsPage visibility="shared" /> },
          { path: "metas", element: <SavingsGoalsPage visibility="shared" /> },
          { path: "balance-miembros", element: <DashboardPage visibility="shared" focusBalance /> },
          { path: "reportes", element: <ReportsPage /> },
          { path: "configuracion", element: <SettingsPage /> }
        ]
      }
    ]
  }
]);
