'use client';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { CountrySelector } from '../ui/country-selector';
import { 
  User, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Shield,
  Facebook, 
  Chrome,
  Mail,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import countriesData from '../../data/countries.json';
import GmailLoginButton from './GmailLoginButton';
import FacebookLoginButton from './FacebookLoginButtonComponent';
import { 
  signUpStep1Schema, 
  signUpStep2Schema, 
  signUpStep3Schema 
} from '../../lib/validationSchemas';

interface SignUpProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onClose, onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countriesData.find(c => c.dial_code === '+212') || countriesData[0]);

  // Valeurs initiales pour Formik
  const initialValues = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    otpCode: ''
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStep1Submit = async (values: typeof initialValues) => {
    setIsLoading(true);
    // Simulation de validation
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleStep2Submit = async (values: typeof initialValues) => {
    setIsLoading(true);
    // Simulation de validation
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 1000);
  };

  const handleStep3Submit = async (values: typeof initialValues) => {
    setIsLoading(true);
    // Simulation d'inscription
    setTimeout(() => {
      console.log('Inscription réussie:', values);
      setIsLoading(false);
      onClose?.();
    }, 2000);
  };

  const handleSocialSignUp = (provider: string) => {
    console.log(`Inscription avec ${provider}`);
    // Logique d'inscription sociale
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Blur */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md">
        <Card className="bg-white backdrop-blur-xl border-0 shadow-2xl overflow-hidden">
          {/* Header avec gradient */}
          <div className="relative px-8 pt-6 pb-6 ">
            {(step === 2 || step === 3) && (
              <Button
                size="sm"
                onClick={handlePrevStep}
                className="absolute cursor-pointer left-4 top-4 bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-600 z-10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="relative text-center">
              <h2 className="text-2xl font-bold text-blue-600 mb-2 ">
                {step === 1 ? 'Créer un compte' : step === 2 ? 'Sécurité' : 'Vérification'}
              </h2>
              <p className="text-gray-600 text-sm">
                {step === 1 
                  ? 'Rejoignez-nous et commencez votre aventure' 
                  : step === 2 
                  ? 'Définissez votre mot de passe sécurisé'
                  : 'Vérifiez votre numéro de téléphone'
                }
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            <Formik
              initialValues={initialValues}
              validationSchema={
                step === 1 ? signUpStep1Schema :
                step === 2 ? signUpStep2Schema :
                signUpStep3Schema
              }
              onSubmit={
                step === 1 ? handleStep1Submit :
                step === 2 ? handleStep2Submit :
                handleStep3Submit
              }
              validateOnChange={false}
              validateOnBlur={true}
            >
              {({ values, errors, touched, setFieldValue }) => (
                <Form className="space-y-4">
                  {step === 1 ? (
                    <>
                      {/* Prénom et Nom */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            Prénom
                          </label>
                          <Field name="firstName">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                type="text"
                                placeholder="Ahmed"
                                className={`h-11 bg-white/80 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 ${
                                  errors.firstName && touched.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                }`}
                              />
                            )}
                          </Field>
                          <ErrorMessage name="firstName" component="p" className="text-xs text-red-500" />
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            Nom
                          </label>
                          <Field name="lastName">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                type="text"
                                placeholder="Yassine"
                                className={`h-11 bg-white/80 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 ${
                                  errors.lastName && touched.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                }`}
                              />
                            )}
                          </Field>
                          <ErrorMessage name="lastName" component="p" className="text-xs text-red-500" />
                        </div>
                      </div>

                      {/* Numéro de téléphone */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          Numéro de téléphone
                        </label>
                        <div className="flex gap-2">
                          <CountrySelector
                            selectedCountry={selectedCountry}
                            onCountrySelect={setSelectedCountry}
                            className="flex-shrink-0"
                          />
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-4 w-4 text-gray-400" />
                            </div>
                            <Field name="phoneNumber">
                              {({ field }: any) => (
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="600 000 000"
                                  className={`pl-10 h-11 bg-white/80 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 ${
                                    errors.phoneNumber && touched.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                  }`}
                                />
                              )}
                            </Field>
                          </div>
                        </div>
                        <ErrorMessage name="phoneNumber" component="p" className="text-xs text-red-500" />
                      </div>

                      {/* Next Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-700 hover:to-yellow-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Validation...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            Continuer
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        )}
                      </Button>

                      {/* Divider */}
                      <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500">Ou inscrivez-vous avec</span>
                        </div>
                      </div>

                      {/* Social Sign Up */}
                      <div className="grid grid-cols-2 gap-3">
                        <GmailLoginButton/>
                        <FacebookLoginButton onClick={() => {}} />
                      </div>
                    </>
                  ) : step === 2 ? (
                    <>
                      {/* Mot de passe */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <Lock className="w-4 h-4 mr-1" />
                          Mot de passe
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-gray-400" />
                          </div>
                          <Field name="password">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={`pl-10 pr-10 h-11 bg-white/80 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 ${
                                  errors.password && touched.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                }`}
                              />
                            )}
                          </Field>
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        <ErrorMessage name="password" component="p" className="text-xs text-red-500" />
                      </div>

                      {/* Confirmation mot de passe */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <Lock className="w-4 h-4 mr-1" />
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-gray-400" />
                          </div>
                          <Field name="confirmPassword">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={`pl-10 pr-10 h-11 bg-white/80 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 ${
                                  errors.confirmPassword && touched.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                }`}
                              />
                            )}
                          </Field>
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        <ErrorMessage name="confirmPassword" component="p" className="text-xs text-red-500" />
                      </div>

                      {/* Next Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-700 hover:to-yellow-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Validation...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            Continuer
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* OTP Code */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 text-center block">
                          Code de vérification
                        </label>
                        <div className="relative">
                          <Field name="otpCode">
                            {({ field }: any) => (
                              <Input
                                {...field}
                                type="text"
                                placeholder="123456"
                                className={`h-12 text-center text-lg font-mono tracking-widest bg-white/80 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 ${
                                  errors.otpCode && touched.otpCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                }`}
                                maxLength={6}
                              />
                            )}
                          </Field>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          Code envoyé au {selectedCountry.dial_code} {values.phoneNumber}
                        </p>
                        <ErrorMessage name="otpCode" component="p" className="text-xs text-red-500 text-center" />
                      </div>

                      {/* Resend Code */}
                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          <RefreshCw className="w-4 h-4 inline mr-1" />
                          Renvoyer le code
                        </button>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-700 hover:to-yellow-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Création du compte...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <UserCheck className="w-5 h-5 mr-2" />
                            Créer mon compte
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        )}
                      </Button>
                    </>
                  )}
                </Form>
              )}
            </Formik>

            {/* Footer */}
            {step === 1 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center mb-4">
                  En créant un compte, vous acceptez nos{' '}
                  <a href="#" className="text-yellow-600 hover:text-yellow-700 font-medium">
                    Conditions d'utilisation
                  </a>{' '}
                  et notre{' '}
                  <a href="#" className="text-yellow-600 hover:text-yellow-700 font-medium">
                    Politique de confidentialité
                  </a>
                </p>

                {/* Switch to Login */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Déjà un compte ?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="text-yellow-600 hover:text-yellow-700 font-medium underline"
                    >
                      Se connecter
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
