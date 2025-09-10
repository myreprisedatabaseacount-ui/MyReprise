import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProductModalState {
  isCreateProductOpen: boolean;
  isEditProductOpen: boolean;
  isDeleteProductOpen: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  currentStep: number; // Pour les étapes de création de produit
  selectedProduct: any | null; // Produit sélectionné pour édition/suppression
  selectedListingType: 'item' | 'vehicle' | 'property' | null; // Type de produit sélectionné
  productData: any; // Données du produit en cours de création
}

const initialState: ProductModalState = {
  isCreateProductOpen: false,
  isEditProductOpen: false,
  isDeleteProductOpen: false,
  status: 'idle',
  error: null,
  currentStep: 1,
  selectedProduct: null,
  selectedListingType: null,
  productData: {},
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    // Actions pour ouvrir les modales
    openCreateProductModal: (state) => {
      state.isCreateProductOpen = true;
      state.isEditProductOpen = false;
      state.isDeleteProductOpen = false;
      state.error = null;
      state.currentStep = 1;
      state.selectedProduct = null;
    },
    openEditProductModal: (state, action: PayloadAction<any>) => {
      state.isEditProductOpen = true;
      state.isCreateProductOpen = false;
      state.isDeleteProductOpen = false;
      state.error = null;
      state.currentStep = 1;
      state.selectedProduct = action.payload;
    },
    openDeleteProductModal: (state, action: PayloadAction<any>) => {
      state.isDeleteProductOpen = true;
      state.isCreateProductOpen = false;
      state.isEditProductOpen = false;
      state.error = null;
      state.selectedProduct = action.payload;
    },
    
    // Actions pour fermer les modales
    closeCreateProductModal: (state) => {
      state.isCreateProductOpen = false;
      state.error = null;
      state.currentStep = 1;
      state.selectedProduct = null;
    },
    closeEditProductModal: (state) => {
      state.isEditProductOpen = false;
      state.error = null;
      state.currentStep = 1;
      state.selectedProduct = null;
    },
    closeDeleteProductModal: (state) => {
      state.isDeleteProductOpen = false;
      state.error = null;
      state.selectedProduct = null;
    },
    
    // Action pour fermer toutes les modales
    closeAllProductModals: (state) => {
      state.isCreateProductOpen = false;
      state.isEditProductOpen = false;
      state.isDeleteProductOpen = false;
      state.error = null;
      state.currentStep = 1;
      state.selectedProduct = null;
    },
    
    // Actions pour basculer entre les modales
    switchToEditProduct: (state, action: PayloadAction<any>) => {
      state.isCreateProductOpen = false;
      state.isEditProductOpen = true;
      state.isDeleteProductOpen = false;
      state.error = null;
      state.currentStep = 1;
      state.selectedProduct = action.payload;
    },
    switchToDeleteProduct: (state, action: PayloadAction<any>) => {
      state.isCreateProductOpen = false;
      state.isEditProductOpen = false;
      state.isDeleteProductOpen = true;
      state.error = null;
      state.selectedProduct = action.payload;
    },
    
    // Actions pour gérer le statut
    setProductStatus: (state, action: PayloadAction<'idle' | 'loading' | 'success' | 'error'>) => {
      state.status = action.payload;
    },
    
    // Action pour gérer les erreurs
    setProductError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = 'error';
    },
    
    // Action pour gérer l'étape
    setProductCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    
    // Actions pour gérer le type de produit et les données
    setSelectedListingType: (state, action: PayloadAction<'item' | 'vehicle' | 'property'>) => {
      state.selectedListingType = action.payload;
    },
    
    updateProductData: (state, action: PayloadAction<any>) => {
      state.productData = { ...state.productData, ...action.payload };
    },
    
    clearProductData: (state) => {
      state.productData = {};
    },
    
    // Action pour réinitialiser l'état
    resetProductState: (state) => {
      state.isCreateProductOpen = false;
      state.isEditProductOpen = false;
      state.isDeleteProductOpen = false;
      state.status = 'idle';
      state.error = null;
      state.currentStep = 1;
      state.selectedProduct = null;
      state.selectedListingType = null;
      state.productData = {};
    },
  },
});

export const {
  openCreateProductModal,
  openEditProductModal,
  openDeleteProductModal,
  closeCreateProductModal,
  closeEditProductModal,
  closeDeleteProductModal,
  closeAllProductModals,
  switchToEditProduct,
  switchToDeleteProduct,
  setProductStatus,
  setProductError,
  setProductCurrentStep,
  setSelectedListingType,
  updateProductData,
  clearProductData,
  resetProductState,
} = productSlice.actions;

export default productSlice.reducer;
