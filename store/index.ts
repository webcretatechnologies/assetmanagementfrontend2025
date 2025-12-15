import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import organizationReducer from "./slices/organizationSlice";
import branchReducer from "./slices/branchSlice";
import userReducer from "./slices/userSlice";
import categoryReducer from "./slices/categorySlice";
import productReducer from "./slices/productSlice";
import assignmentReducer from "./slices/assignmentSlice";
import requestReducer from "./slices/requestSlice";
import inventoryReducer from "./slices/inventorySlice";
import dashboardReducer from "./slices/dashboardSlice";
import settingsReducer from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    organizations: organizationReducer,
    branches: branchReducer,
    users: userReducer,
    categories: categoryReducer,
    products: productReducer,
    assignments: assignmentReducer,
    requests: requestReducer,
    inventory: inventoryReducer,
    dashboard: dashboardReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;





