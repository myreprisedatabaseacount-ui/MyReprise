'use client';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useDispatch } from 'react-redux';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { CountrySelector } from '../ui/country-selector';

import {
    Phone,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Shield,
    Smartphone
} from 'lucide-react';
import countriesData from '../../data/countries.json';
import GmailLoginButton from './GmailLoginButton';
import FacebookLoginButton from './FacebookLoginButtonComponent';
import { loginStep1Schema } from '../../lib/validationSchemas';
import { useLoginUserMutation } from '../../services/api/UserApi';
import { setAuthStatus, setAuthError, closeAllModals } from '../../services/slices/authSlice';
import { useCurrentUser } from '../../services/hooks/useCurrentUser';

interface LoginProps {
    onClose?: () => void;
    onSwitchToSignUp?: () => void;
    onSwitchToForgotPassword?: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose, onSwitchToSignUp, onSwitchToForgotPassword }) => {
    const dispatch = useDispatch();
    const [showPassword, setShowPassword] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(countriesData.find(c => c.dial_code === '+212') || countriesData[0]);
    
    // Hook RTK Query pour la connexion
    const [loginUser, { isLoading, error }] = useLoginUserMutation();
    
    // Hook pour rafraîchir les données utilisateur après connexion
    const { refreshUser } = useCurrentUser();

    // Valeurs initiales pour Formik
    const initialValues = {
        phoneNumber: '',
        password: ''
    };

    const handleLoginSubmit = async (values: typeof initialValues) => {
        try {
            dispatch(setAuthStatus('loading'));
            
            // Préparer les données de connexion
            // Nettoyer le numéro de téléphone pour ne garder que les chiffres
            const cleanPhoneNumber = values.phoneNumber.replace(/\D/g, '');
            
            const loginData = {
                phone: cleanPhoneNumber, // Numéro sans le code pays
                country: selectedCountry.dial_code, // Code pays séparé
                password: values.password
            };

            console.log('Données de connexion envoyées:', loginData);

            // Appel à l'API de connexion avec Redux Toolkit
            const result = await loginUser(loginData).unwrap();
            
            // Rafraîchir les données utilisateur pour synchroniser l'état
            await refreshUser();

            dispatch(setAuthStatus('success'));
            dispatch(closeAllModals());
            onClose?.();
            
            console.log('Connexion réussie:', result);
        } catch (error: any) {
            console.error('Erreur de connexion:', error);
            const errorMessage = error?.data?.error || error?.message || 'Erreur de connexion';
            dispatch(setAuthError(errorMessage));
        }
    };

    const handleSocialLogin = (provider: string) => {
        console.log(`Connexion avec ${provider}`);
        // Logique de connexion sociale
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
                    <div className="relative px-8 pt-8 pb-6 ">

                        <div className="relative text-center">
                            <h2 className="text-2xl font-bold text-blue-600 mb-2">
                                Connexion
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Connectez-vous à votre compte
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8">
                        <Formik
                            initialValues={initialValues}
                            validationSchema={loginStep1Schema}
                            onSubmit={handleLoginSubmit}
                            validateOnChange={false}
                            validateOnBlur={true}
                        >
                            {({ values, errors, touched }) => (
                                <Form className="space-y-6">
                                    {/* Phone Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <Smartphone className="w-4 h-4 mr-2" />
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
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Field name="phoneNumber">
                                                    {({ field }: any) => (
                                                        <Input
                                                            {...field}
                                                            type="tel"
                                                            placeholder="600 000 000"
                                                            className={`pl-10 h-11 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${errors.phoneNumber && touched.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                                                }`}
                                                        />
                                                    )}
                                                </Field>
                                            </div>
                                        </div>
                                        <ErrorMessage name="phoneNumber" component="p" className="text-xs text-red-500" />
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <Lock className="w-4 h-4 mr-2" />
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
                                                        className={`pl-10 pr-10 h-11 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${errors.password && touched.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
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

                                    {/* Forgot Password Link */}
                                    <div className=" mt-4">
                                        <button
                                            type="button"
                                            onClick={onSwitchToForgotPassword}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                                        >
                                            Mot de passe oublié ?
                                        </button>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-sm text-red-600">
                                                {(() => {
                                                    if ('data' in error && error.data && typeof error.data === 'object' && 'error' in error.data) {
                                                        return (error.data as any).error;
                                                    }
                                                    if ('message' in error) {
                                                        return error.message;
                                                    }
                                                    return 'Erreur de connexion';
                                                })()}
                                            </p>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                Connexion...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <Shield className="w-5 h-5 mr-2" />
                                                Se connecter
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </div>
                                        )}
                                    </Button>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-white text-gray-500">Ou continuez avec</span>
                                        </div>
                                    </div>

                                    {/* Social Login */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <GmailLoginButton />
                                        <FacebookLoginButton onClick={() => { }} />
                                    </div>
                                </Form>
                            )}
                        </Formik>

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center mb-4">
                                En continuant, vous acceptez nos{' '}
                                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Conditions d'utilisation
                                </a>{' '}
                                et notre{' '}
                                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Politique de confidentialité
                                </a>
                            </p>

                            {/* Switch to Sign Up */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Pas encore de compte ?{' '}
                                    <button
                                        type="button"
                                        onClick={onSwitchToSignUp}
                                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                                    >
                                        Créer un compte
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;