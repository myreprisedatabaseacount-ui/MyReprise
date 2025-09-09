'use client';

import { Provider } from 'react-redux';
import store from './store';
import AuthProvider from '../components/auth/AuthProvider';
import ProductProvider from '../components/products/ProductProvider';

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      {children}
      <AuthProvider />
      <ProductProvider />
    </Provider>
  );
}
