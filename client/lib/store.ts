import { configureStore } from '@reduxjs/toolkit';
import { CategoryApi } from '../services/api/CategoryApi';
import { subjectApi } from '../services/api/SubjectApi';
import authReducer from '../services/slices/authSlice';

const configurestore = configureStore({
  reducer: {
    [CategoryApi.reducerPath]: CategoryApi.reducer,
    [subjectApi.reducerPath]: subjectApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['user.socketConnection'],
        ignoredActions: [
          'user/setSocketConnection',
          'UserApi/subscriptions/unsubscribeQueryResult',
          'UserApi/mutations/removeMutationResult',
          'subjectApi/subscriptions/unsubscribeQueryResult',
          'subjectApi/mutations/removeMutationResult',
        ],
      },
    })
      .concat(CategoryApi.middleware)
      .concat(subjectApi.middleware)
});
export default configurestore;
export type RootState = ReturnType<typeof configurestore.getState>;
export type AppDispatch = typeof configurestore.dispatch;
