'use client'

import React, { useState } from 'react';
import { ArrowLeftRight, Coins, MapPin, Search, Truck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/services/hooks/useCurrentUser';
import { useGetOffersBySellerQuery } from '@/services/api/OfferApi';
import { useSearchLocationsMutation } from '@/services/api/AddressApi';
import { useCreateRepriseOrderMutation } from '@/services/api/RepriseOrderApi';
import { toast } from 'sonner';
import { useProduct } from '@/services/hooks/useProduct';

type DeliveryMethod = 'delivery' | 'pickup';

export interface RepriseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Produit cible (celui affiché sur la page)
  target: {
    id: number;
    title: string;
    image: string;
    price: number;
    sellerId: number;
  };
}

// ha target kifach dayar : {{ id: product.id, title: product.title, image: product.images[0], price: product.price }}
const RepriseOrderModal: React.FC<RepriseOrderModalProps> = ({ isOpen, onClose, target }) => {
  const { currentUser } = useCurrentUser();
  const { data: myOffersData, isLoading: isLoadingMyOffers, error: errorMyOffers } = useGetOffersBySellerQuery(currentUser?.id);
  const myOffersList: any[] = Array.isArray(myOffersData?.data) ? myOffersData.data : [];
  const { openCreateProduct } = useProduct();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMyOfferId, setSelectedMyOfferId] = useState<number | null>(null);
  const [customDifference, setCustomDifference] = useState<string>('');
  const selectedMyOffer = myOffersList.find(o => o.id === selectedMyOfferId) || null;

  // Helper: retourne l'URL de l'image principale selon le nouveau format
  const getOfferMainImageUrl = (offer: any): string => {
    const images = Array.isArray(offer?.images) ? offer.images : [];
    if (images.length === 0) return '/placeholder.png';
    const main = images.find((img: any) => img?.isMain) || images[0];
    return main?.imageUrl || '/placeholder.png';
  };

  const baseDifference = selectedMyOffer ? Number(target.price) - Number(selectedMyOffer.price) : 0;
  const absDifference = Math.abs(baseDifference);
  const direction: 'payer' | 'recevoir' | 'egal' = baseDifference > 0 ? 'payer' : baseDifference < 0 ? 'recevoir' : 'egal';
  const effectiveDiff = customDifference !== '' && !isNaN(Number(customDifference)) ? Math.max(0, Number(customDifference)) : absDifference;

  // Delivery
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [searchLocations, { isLoading: isSearchingLocations }] = useSearchLocationsMutation();
  const [createRepriseOrder, { isLoading: isCreating }] = useCreateRepriseOrderMutation();

  const handleRegionSearch = async (val: string) => {
    setLocationSearch(val);
    if (val.length < 3) {
      setLocationResults([]);
      setShowLocationResults(false);
      return;
    }
    try {
      const result = await searchLocations(val).unwrap();
      setLocationResults(result.data || []);
      setShowLocationResults(true);
    } catch {
      setLocationResults([]);
      setShowLocationResults(false);
    }
  };

  const handleRegionSelect = (loc: any) => {
    setSelectedLocation(loc);
    const text = loc.sector ? `${loc.city}, ${loc.sector}` : loc.city;
    setLocationSearch(text);
    setShowLocationResults(false);
  };

  const handleRegionClear = () => {
    setSelectedLocation(null);
    setLocationSearch('');
    setLocationResults([]);
    setShowLocationResults(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold">Reprise</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>

        {/* Steps header */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-1 rounded ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>1 — Choisir un de mes produits</span>
            <span className="text-gray-400">→</span>
            <span className={`px-2 py-1 rounded ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>2 — Différence et confirmation</span>
            <span className="text-gray-400">→</span>
            <span className={`px-2 py-1 rounded ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>3 — Livraison / Retrait</span>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="p-4 overflow-y-auto max-h-[65vh]">
            {isLoadingMyOffers && <p className="text-gray-500">Chargement de mes offres...</p>}
            {errorMyOffers && <p className="text-red-600">Erreur lors du chargement de mes offres.</p>}
            {!isLoadingMyOffers && myOffersList.length === 0 && <p className="text-gray-600">Vous n'avez pas encore d'offres disponibles.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Carte d'ajout de produit en première position - même gabarit */}
              <button
                onClick={() => {
                  onClose();
                  openCreateProduct();
                }}
                className="text-left border-2 border-dashed rounded-xl overflow-hidden hover:shadow transition bg-white"
              >
                <div className="aspect-[4/3] bg-gray-50 grid place-items-center">
                  <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900">Ajouter un produit</p>
                  <p className="text-xs text-gray-500 mt-1">Ouvrir le même formulaire que la navbar</p>
                </div>
              </button>
              {myOffersList.map(offer => (
                <button key={offer.id} onClick={() => setSelectedMyOfferId(offer.id)} className={`text-left border rounded-xl overflow-hidden hover:shadow transition ${selectedMyOfferId === offer.id ? 'ring-2 ring-blue-600' : ''}`}>
                  <div className="aspect-[4/3] bg-gray-100">
                    <img src={getOfferMainImageUrl(offer)} alt={offer.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{offer.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{Number(offer.price)} DH</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{offer.productCondition?.replace(/_/g,' ')}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
                 <button onClick={() => {
                   if (!selectedMyOfferId) return;
                   const mineId = currentUser?.id;
                   const myOffer = myOffersList.find(o => o.id === selectedMyOfferId);
                   if (!myOffer) return;
                  // Empêcher si mon offre et le produit cible appartiennent au même vendeur
                  if (typeof target.sellerId === 'number' && myOffer.sellerId === target.sellerId) {
                     toast.error('Produit invalide.');
                     return;
                   }
                   setStep(2);
                 }} disabled={!selectedMyOfferId} className={`px-5 py-2 rounded-lg font-medium ${selectedMyOfferId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Continuer</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && selectedMyOffer && (
          <div className="p-4 overflow-y-auto max-h-[65vh]">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="relative flex items-center gap-2">
                <img src={target.image} alt={target.title} className="w-16 h-16 rounded-lg object-cover border" />
                <div className="min-w-[140px]"><span className="block text-sm font-medium line-clamp-1">{target.title}</span><span className="block text-xs text-gray-500">{Number(target.price)} DH</span></div>
                {direction === 'recevoir' && (<div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow bg-emerald-100 text-emerald-700 border border-emerald-300">+ {effectiveDiff} DH</div>)}
              </div>
              <ArrowLeftRight size={28} className="text-blue-600 animate-pulse" />
              <div className="relative flex items-center gap-2">
                <img src={getOfferMainImageUrl(selectedMyOffer)} alt={selectedMyOffer.title} className="w-16 h-16 rounded-lg object-cover border" />
                <div className="min-w-[140px]"><span className="block text-sm font-medium line-clamp-1">{selectedMyOffer.title}</span><span className="block text-xs text-gray-500">{Number(selectedMyOffer.price)} DH</span></div>
                {direction === 'payer' && (<div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow bg-amber-100 text-amber-700 border border-amber-300">+ {effectiveDiff} DH</div>)}
              </div>
            </div>
            {direction !== 'egal' ? (
              <div className="bg-gray-50 border rounded-xl p-4">
                {direction === 'payer' ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-amber-700"><Coins size={18} className="text-amber-500" /><span className="font-medium">Vous devez ajouter <strong>{effectiveDiff} DH</strong> à votre produit pour compenser la différence.</span></div>
                    <p className="text-xs text-amber-700/80 mt-1">Votre produit est moins cher que le sien. Le montant sera proposé comme compensation.</p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-emerald-700"><Coins size={18} className="text-emerald-500" /><span className="font-medium">Vous demandez <strong>{effectiveDiff} DH</strong> au destinataire. Son produit est moins cher que le vôtre.</span></div>
                    <p className="text-xs text-emerald-700/80 mt-1">Ce montant sera demandé au destinataire pour équilibrer l'échange.</p>
                  </div>
                )}
                <label className="block text-sm text-gray-600 mb-1">Ajuster le montant (optionnel)</label>
                <input type="number" value={customDifference} onChange={(e) => setCustomDifference(e.target.value)} placeholder={`${absDifference}`} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <p className="text-xs text-gray-500 mt-1">Laissez vide pour utiliser la différence calculée automatiquement.</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4">Les deux produits ont la même valeur. Aucune différence à régler.</div>
            )}
            <div className="mt-5 flex items-center justify-between"><button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Retour</button><button onClick={() => setStep(3)} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">Continuer</button></div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="p-4 overflow-y-auto max-h-[65vh]">
            <div className="mb-4"><p className="text-sm text-gray-700">Choisissez comment s’effectuera l’échange. Livraison est sélectionnée par défaut pour plus de flexibilité.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button type="button" onClick={() => setDeliveryMethod('delivery')} className={`border rounded-xl p-4 text-left transition ${deliveryMethod === 'delivery' ? 'border-blue-600 ring-2 ring-blue-100 bg-gradient-to-br from-blue-50 to-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-start gap-3"><div className={`p-2 rounded-lg ${deliveryMethod === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}><Truck size={18} /></div><div><div className="font-medium text-gray-900">Livraison</div><div className="text-sm text-gray-600 mt-1">Nous organisons la livraison selon la région choisie.</div></div></div>
              </button>
              <button type="button" onClick={() => setDeliveryMethod('pickup')} className={`border rounded-xl p-4 text-left transition ${deliveryMethod === 'pickup' ? 'border-emerald-600 ring-2 ring-emerald-100 bg-gradient-to-br from-emerald-50 to-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-start gap-3"><div className={`${deliveryMethod === 'pickup' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'} p-2 rounded-lg`}><MapPin size={18} /></div><div><div className="font-medium text-gray-900">Retrait sur place</div><div className="text-sm text-gray-600 mt-1">Vous fixez un point de retrait convenu avec le propriétaire.</div></div></div>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={locationSearch} onChange={(e) => handleRegionSearch(e.target.value)} placeholder="Rechercher une ville, région ou secteur..." className="pl-10 pr-10" />
                {locationSearch && (<button type="button" onClick={handleRegionClear} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>)}
                {showLocationResults && locationResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationResults.map((loc) => (
                      <button key={loc.id} type="button" onClick={() => handleRegionSelect(loc)} className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /><div><p className="font-medium text-gray-900">{loc.city}</p>{loc.sector && (<p className="text-sm text-gray-500">{loc.sector}</p>)}</div></div>
                      </button>
                    ))}
                  </div>
                )}
                {isSearchingLocations && (<div className="absolute right-3 top-1/2 transform -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div></div>)}
              </div>
              {selectedLocation && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /><div><p className="text-sm font-medium text-blue-800">{selectedLocation.city}</p>{selectedLocation.sector && (<p className="text-xs text-blue-700">{selectedLocation.sector}</p>)}</div></div>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Retour</button>
              <button
                onClick={async () => {
                  if (!selectedMyOfferId) return;
                  // Vérifs avant envoi: propriétaires différents et mon offre m'appartient
                  const myOffer = myOffersList.find(o => o.id === selectedMyOfferId);
                  if (!myOffer) { toast.error('Offre sélectionnée introuvable'); return; }
                  if (currentUser?.id && myOffer.sellerId !== currentUser.id) { toast.error("Cette offre ne vous appartient pas"); return; }
                  const differenceAmount = effectiveDiff;
                  const payload = {
                    senderOfferId: selectedMyOfferId,
                    receiverOfferId: target.id,
                    differenceAmount,
                    method: deliveryMethod, // 'delivery' | 'pickup'
                    locationId: selectedLocation?.id || null,
                  };
                  try {
                    const res = await createRepriseOrder(payload).unwrap();
                    toast.success('Demande de reprise envoyée');
                    onClose();
                  } catch (e) {
                    toast.error("Échec d'envoi de la demande");
                  }
                }}
                disabled={isCreating || !selectedMyOfferId}
                className={`px-5 py-2 rounded-lg ${isCreating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium`}
              >
                {isCreating ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepriseOrderModal;


