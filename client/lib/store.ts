import { configureStore } from '@reduxjs/toolkit';
import { CategoryApi } from '../services/api/CategoryApi';
import { subjectApi } from '../services/api/SubjectApi';
import { brandApi } from '../services/api/BrandApi';
import userApi from '../services/api/UserApi';
import { conversationsApi } from '../services/api/ConversationsApi';
import { reactionsApi } from '../services/api/ReactionsApi';
import { OfferApi } from '../services/api/OfferApi';
import authReducer from '../services/slices/authSlice';
import userReducer from '../services/slices/userSlice';
import productReducer from '../services/slices/productSlice';

const configurestore = configureStore({
  reducer: {
    [CategoryApi.reducerPath]: CategoryApi.reducer,
    [subjectApi.reducerPath]: subjectApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [conversationsApi.reducerPath]: conversationsApi.reducer,
    [reactionsApi.reducerPath]: reactionsApi.reducer,
    [OfferApi.reducerPath]: OfferApi.reducer,
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
      .concat(conversationsApi.middleware)
      .concat(reactionsApi.middleware)
      .concat(OfferApi.middleware)
});
export default configurestore;
export type RootState = ReturnType<typeof configurestore.getState>;
export type AppDispatch = typeof configurestore.dispatch;
