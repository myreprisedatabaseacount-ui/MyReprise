'use client';

import React, { useState } from 'react';
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
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Mail
} from 'lucide-react';
import countriesData from '../../data/countries.json';

interface ForgotPasswordProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onClose, onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedCountry, setSelectedCountry] = useState(countriesData.find(c => c.dial_code === '+212') || countriesData[0]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le numéro de téléphone est obligatoire';
    } else if (!/^\+?[0-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Format de numéro invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.otpCode.trim()) {
      newErrors.otpCode = 'Le code de vérification est obligatoire';
    } else if (formData.otpCode.length !== 6) {
      newErrors.otpCode = 'Le code doit contenir 6 chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est obligatoire';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est obligatoire';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateStep1()) {
      return;
    }

    setIsLoading(true);

    // Simulation d'envoi OTP
    setTimeout(() => {
      console.log('OTP envoyé au:', selectedCountry.dial_code, formData.phoneNumber);
      setIsLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);

    // Simulation de vérification OTP
    setTimeout(() => {
      console.log('OTP vérifié:', formData.otpCode);
      setIsLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);

    // Simulation de réinitialisation
    setTimeout(() => {
      console.log('Mot de passe réinitialisé avec succès');
      setIsLoading(false);
      onClose?.();
    }, 2000);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    // Simulation de renvoi OTP
    setTimeout(() => {
      console.log('OTP renvoyé au:', selectedCountry.dial_code, formData.phoneNumber);
      setIsLoading(false);
    }, 1000);
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
                variant="ghost"
                size="sm"
                onClick={handlePrevStep}
                className="absolute cursor-pointer left-4 top-4 bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-600 z-10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="relative text-center">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                {step === 1 ? 'Mot de passe oublié' : step === 2 ? 'Vérification' : 'Nouveau mot de passe'}
              </h2>
              <p className="text-gray-600 text-sm">
                {step === 1 
                  ? 'Entrez votre numéro de téléphone pour recevoir un code de réinitialisation' 
                  : step === 2 
                  ? 'Vérifiez votre numéro de téléphone'
                  : 'Définissez votre nouveau mot de passe'
                }
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            {step === 1 ? (
              <div className="space-y-4">
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
                      <Input
                        type="tel"
                        name="phoneNumber"
                        placeholder="600 000 000"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`pl-10 h-11 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${errors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                          }`}
                        required
                      />
                    </div>
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Send OTP Button */}
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Envoi en cours...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Envoyer le code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button>
              </div>
            ) : step === 2 ? (
              <div className="space-y-4">
                {/* OTP Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 text-center block">
                    Code de vérification
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      name="otpCode"
                      placeholder="123456"
                      value={formData.otpCode}
                      onChange={handleInputChange}
                      className="h-12 text-center text-lg font-mono tracking-widest bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Code envoyé au {selectedCountry.dial_code} {formData.phoneNumber}
                  </p>
                  {errors.otpCode && (
                    <p className="text-xs text-red-500 text-center">{errors.otpCode}</p>
                  )}
                </div>

                {/* Resend Code */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <RefreshCw className={`w-4 h-4 inline mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Renvoyer le code
                  </button>
                </div>

                {/* Verify Button */}
                <Button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Vérification...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Vérifier le code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Nouveau mot de passe */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Lock className="w-4 h-4 mr-1" />
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 h-11 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${errors.newPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                        }`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-red-500">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirmation nouveau mot de passe */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Lock className="w-4 h-4 mr-1" />
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 h-11 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                        }`}
                      required
                    />
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
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Réinitialisation...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Réinitialiser le mot de passe
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button>
              </form>
            )}

            {/* Footer */}
            {step === 1 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                {/* Switch to Login */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Vous vous souvenez de votre mot de passe ?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
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

export default ForgotPassword;
