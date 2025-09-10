import { configureStore } from '@reduxjs/toolkit';
import { CategoryApi } from '../services/api/CategoryApi';
import { subjectApi } from '../services/api/SubjectApi';
import { brandApi } from '../services/api/BrandApi';
import userApi from '../services/api/UserApi';
import authReducer from '../services/slices/authSlice';
import userReducer from '../services/slices/userSlice';
import productReducer from '../services/slices/productSlice';

const configurestore = configureStore({
  reducer: {
    [CategoryApi.reducerPath]: CategoryApi.reducer,
    [subjectApi.reducerPath]: subjectApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    auth: authReducer,
    user: userReducer,
    product: productReducer,
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
          'brandApi/subscriptions/unsubscribeQueryResult',
          'brandApi/mutations/removeMutationResult',
        ],
      },
    })
      .concat(CategoryApi.middleware)
      .concat(subjectApi.middleware)
      .concat(brandApi.middleware)
      .concat(userApi.middleware)
});
export default configurestore;
export type RootState = ReturnType<typeof configurestore.getState>;
export type AppDispatch = typeof configurestore.dispatch;
