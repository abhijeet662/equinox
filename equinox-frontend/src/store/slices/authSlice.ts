import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '../../types';
import { authService } from '../../services/auth.service';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ─── Async thunks ─────────────────────────────────────────────────────────────

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

export const registerAsync = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string; name: string; role?: string; company?: string }, { rejectWithValue }) => {
    try {
      return await authService.register(payload);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      return rejectWithValue(msg);
    }
  }
);

export const fetchMeAsync = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.me();
    } catch {
      return rejectWithValue('Session expired');
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  // Start in loading state if a token exists so DashboardLayout waits
  // for session restore before deciding to redirect
  loading: !!localStorage.getItem('equinox_access'),
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload; },
    // Keep synchronous logout for instant UI clearing
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Login ──
    builder
      .addCase(loginAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Register ──
    builder
      .addCase(registerAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Fetch me (session restore) ──
    builder
      .addCase(fetchMeAsync.pending, (state) => { state.loading = true; })
      .addCase(fetchMeAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMeAsync.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    // ── Logout ──
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
