import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  notifications: number;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  notifications: 3,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    decrementNotifications: (state) => {
      if (state.notifications > 0) state.notifications -= 1;
    },
    clearNotifications: (state) => {
      state.notifications = 0;
    },
  },
});

export const { toggleSidebar, toggleSidebarCollapse, setSidebarOpen, decrementNotifications, clearNotifications } = uiSlice.actions;
export default uiSlice.reducer;
