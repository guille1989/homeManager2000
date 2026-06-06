import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { api, TOKEN_KEY } from "../../lib/api";
import type { Household, User } from "../../types";

type AuthContextValue = {
  user: User | null;
  household: Household | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    partnerName?: string;
    householdName?: string;
    inviteCode?: string;
    currency: string;
  }) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const refreshMe = useCallback(async () => {
    const { data } = await api.get<{ user: User; household: Household }>("/auth/me");
    setUser(data.user);
    setHousehold(data.household);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    refreshMe()
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setHousehold(null);
      })
      .finally(() => setLoading(false));
  }, [refreshMe, token]);

  const persistSession = (nextToken: string, nextUser: User, nextHousehold?: Household) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    if (nextHousehold) setHousehold(nextHousehold);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      household,
      token,
      loading,
      login: async (email, password) => {
        const { data } = await api.post<{ token: string; user: User }>("/auth/login", {
          email,
          password
        });
        persistSession(data.token, data.user);
        await refreshMe();
      },
      register: async (input) => {
        const { data } = await api.post<{ token: string; user: User; household: Household }>(
          "/auth/register",
          input
        );
        persistSession(data.token, data.user, data.household);
      },
      refreshMe,
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setHousehold(null);
      }
    }),
    [household, loading, refreshMe, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
