import { configureStore } from '@reduxjs/toolkit';
import { CategoryApi } from '../services/api/CategoryApi';
import userApi from '../services/api/UserApi';

const configurestore = configureStore({
  reducer: {
    [CategoryApi.reducerPath]: CategoryApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['user.socketConnection'],
        ignoredActions: [
          'user/setSocketConnection',
          'UserApi/subscriptions/unsubscribeQueryResult',
          'UserApi/mutations/removeMutationResult',
        ],
      },
    })
      .concat(CategoryApi.middleware)
      .concat(userApi.middleware)
});
export default configurestore;
export type RootState = ReturnType<typeof configurestore.getState>;
export type AppDispatch = typeof configurestore.dispatch;
