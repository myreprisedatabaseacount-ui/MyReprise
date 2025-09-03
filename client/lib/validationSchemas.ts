import * as Yup from 'yup';

// Schéma de validation pour le mot de passe (8 caractères minimum avec des chiffres)
export const passwordSchema = Yup.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .matches(/\d/, 'Le mot de passe doit contenir au moins un chiffre')
  .required('Le mot de passe est obligatoire');

// Schéma de validation pour le numéro de téléphone
export const phoneSchema = Yup.string()
  .matches(/^\d{8,10}$/, 'Le numéro doit contenir entre 8 et 10 chiffres')
  .required('Le numéro de téléphone est obligatoire');

// Schéma de validation pour le code OTP
export const otpSchema = Yup.string()
  .length(6, 'Le code doit contenir exactement 6 chiffres')
  .matches(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres')
  .required('Le code de vérification est obligatoire');

// Schéma de validation pour les noms
export const nameSchema = Yup.string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(50, 'Le nom ne peut pas dépasser 50 caractères')
  .required('Ce champ est obligatoire');

// Schéma de validation pour l'étape 1 du SignUp
export const signUpStep1Schema = Yup.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phoneNumber: phoneSchema,
});

// Schéma de validation pour l'étape 2 du SignUp
export const signUpStep2Schema = Yup.object({
  password: passwordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est obligatoire'),
});

// Schéma de validation pour l'étape 3 du SignUp
export const signUpStep3Schema = Yup.object({
  otpCode: otpSchema,
});

// Schéma de validation pour l'étape 1 du Login
export const loginStep1Schema = Yup.object({
  phoneNumber: phoneSchema,
  password: Yup.string().required('Le mot de passe est obligatoire'),
});

// Schéma de validation pour l'étape 2 du Login
export const loginStep2Schema = Yup.object({
  verificationCode: otpSchema,
});

// Schéma de validation pour l'étape 1 du ForgotPassword
export const forgotPasswordStep1Schema = Yup.object({
  phoneNumber: phoneSchema,
});

// Schéma de validation pour l'étape 2 du ForgotPassword
export const forgotPasswordStep2Schema = Yup.object({
  otpCode: otpSchema,
});

// Schéma de validation pour l'étape 3 du ForgotPassword
export const forgotPasswordStep3Schema = Yup.object({
  newPassword: passwordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est obligatoire'),
});
