'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import { closeAllModals, switchToSignUp, switchToLogin, switchToForgotPassword } from '../../services/slices/authSlice';
import { useAuthUrlSync } from '../../services/hooks/useAuthUrlSync';
import Login from './Login';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';

const AuthProvider: React.FC = () => {
  const dispatch = useDispatch();
  const { isLoginOpen, isSignUpOpen, isForgotPasswordOpen, currentStep } = useAuthUrlSync();

  const handleCloseLogin = () => {
    dispatch(closeAllModals());
  };

  const handleCloseSignUp = () => {
    dispatch(closeAllModals());
  };

  const handleCloseForgotPassword = () => {
    dispatch(closeAllModals());
  };

  const handleSwitchToSignUp = () => {
    dispatch(switchToSignUp());
  };

  const handleSwitchToLogin = () => {
    dispatch(switchToLogin());
  };

  const handleSwitchToForgotPassword = () => {
    dispatch(switchToForgotPassword());
  };

  return (
    <>
      {isLoginOpen && (
        <Login 
          onClose={handleCloseLogin}
          onSwitchToSignUp={handleSwitchToSignUp}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      )}
      {isSignUpOpen && (
        <SignUp 
          onClose={handleCloseSignUp}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
      {isForgotPasswordOpen && (
        <ForgotPassword 
          onClose={handleCloseForgotPassword}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </>
  );
};

export default AuthProvider;
