"use client";

import { useListReceivedOrdersOnMyOffersQuery } from '@/services/api/RepriseOrderApi';
import { Truck, MessageSquareShare, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import OrderNegotiationCard from '@/components/orders/OrderNegotiationCard';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ChatPanel from '@/components/ChatPanel/chatPanel';

function formatOrderDate(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const hhmm = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

  if (diffSec < 60) {
    return `il y a ${diffSec} ${diffSec <= 1 ? 'seconde' : 'secondes'} (${hhmm})`;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `il y a ${diffMin === 1 ? '1 minute' : `${diffMin} minutes`} (${hhmm})`;
  }
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) {
    return `il y a ${diffH === 1 ? 'une heure' : `${diffH} heures`}`;
  }
  const diffDays = Math.floor(diffH / 24);
  if (diffDays < 7) {
    return `il y a ${diffDays === 1 ? 'un jour' : `${diffDays} jours`} (${hhmm})`;
  }
  const abs = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  return `le ${abs}`;
}

export default function ReceivedOrdersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, error } = useListReceivedOrdersOnMyOffersQuery({ page, limit });
  const params = useParams();
  const locale = (params as any)?.locale || '';
  const searchParams = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [orderNegotiationCardOpen, setOrderNegotiationCardOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Scroll + animation 2s, puis conserver le fond vert
  useEffect(() => {
    const orderId = searchParams.get('orderid');
    if (!orderId || !data?.data) return;

    // Attendre le rendu des éléments
    const t = setTimeout(() => {
      const el = document.getElementById(`order-${orderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedId(orderId); // garde le fond vert
        setAnimatingId(orderId); // anime 2s
        setTimeout(() => setAnimatingId(null), 2000);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [searchParams, data]);

  const conditionLabel = (cond?: string) => {
    const map: Record<string, string> = {
      new: 'Neuf',
      like_new: 'Comme neuf',
      good: 'Bon état',
      fair: 'État correct',
    };
    return cond ? (map[cond] || 'Occasion') : 'Occasion';
  };

  const handleOpenNegotiation = (orderId: number, userId: number) => {
    setChatPanelOpen(true);
    setOrderNegotiationCardOpen(true);
    setSelectedOrderId(orderId);
    setSelectedUserId(userId);
  };

  return (
    <>
      {orderNegotiationCardOpen && <OrderNegotiationCard orderId={selectedOrderId} />}
      <div className="max-h-90 h-90 mt-[100px] relative overflow-y-hidden flex-1 bg-red-500" >
        {chatPanelOpen && <ChatPanel isOpen={chatPanelOpen} onToggle={() => { setChatPanelOpen(!chatPanelOpen), setOrderNegotiationCardOpen(false), setSelectedOrderId(null) }} selectedUserId={selectedUserId} orderId={selectedOrderId} />}
      </div>
      <div className="space-y-4 ">
        <h1 className="text-xl font-semibold">Commandes reçues</h1>

        {isLoading && (
          <div className="text-sm text-gray-500">Chargement...</div>
        )}
        {error && (
          <div className="text-sm text-red-600">Erreur lors du chargement.</div>
        )}

        {data?.data?.length ? (
          <div className="space-y-6">
            {data.data.map((group: any) => (
              <div key={group.offer.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {/* En-tête type enchères avec vendeur */}
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-6">
                        <img src={group.offer?.seller?.avatar || '/placeholder.png'} alt={group.offer?.seller?.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{group.offer?.seller?.name || 'Moi'}</h3>
                            {group.offer?.seller?.verified && (
                              <span className="w-3.5 h-3.5 bg-blue-500 rounded-full inline-flex items-center justify-center"><span className="w-1.5 h-1.5 bg-white rounded-full" /></span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Propriétaire du produit</div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
                        {/* Image principale */}
                        <div className="w-full sm:w-36">
                          <div className="aspect-square rounded-lg overflow-hidden">
                            <img src={group.offer.mainImageUrl} alt={group.offer.title} className="w-full h-full object-cover" />
                          </div>
                        </div>

                        {/* Détails produit */}
                        <div className="space-y-2">
                          <h2 className="text-lg font-bold text-gray-900">{group.offer.title}</h2>
                          <div className="text-2xl font-bold text-blue-600">{Number(group.offer.price)} DH</div>
                          {group.offer.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mt-2 line-clamp-3">{group.offer.description}</p>
                          )}
                          {group.offer.productCondition && (
                            <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{conditionLabel(group.offer.productCondition)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {group.orders.map((o: any) => (
                    <div
                      key={o.order.id}
                      id={`order-${o.order.id}`}
                      className={`p-4 flex flex-col gap-3 transition-colors ${highlightedId === String(o.order.id) ? 'bg-green-50' : ''} ${animatingId === String(o.order.id) ? 'animate-pulse' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Sender card à gauche comme style enchères */}
                          {o.sender && (
                            <div className="flex items-center gap-2 mr-4">
                              <img src={o.sender?.profileImage || '/placeholder.png'} alt={o.sender?.name} className="w-9 h-9 rounded-full object-cover border" />
                              <div className="text-sm">
                                <div className="font-medium flex items-center gap-2">
                                  <span>{o.sender.name}</span>
                                  <span className="text-xs text-gray-500">( {o.sender.completedOrdersCount || 0} commandes réussies )</span>
                                </div>
                                <div className="text-gray-500">propose son produit</div>
                              </div>
                            </div>
                          )}
                          {/* Bannière livraison mobile (sous le profil) */}
                          <div className="sm:hidden mt-1">
                            <PromoBanner createdAt={o.order.createdAt} />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="hidden sm:flex items-center gap-3 ">
                            <PromoBanner createdAt={o.order.createdAt} />
                          </div>
                          <span className="text-xs text-right text-gray-500 w-full">{formatOrderDate(o.order.createdAt)}</span>
                        </div>
                      </div>

                      {/* Bandeau comparatif avec balanceAmount du serveur */}
                      {(() => {
                        const senderPrice = Number(o.senderProductSnapshot?.price ?? o.senderOffer?.price ?? 0);
                        const myPrice = Number(group.offer?.price ?? 0);
                        const balance = Number(o.order?.balanceAmount ?? 0);
                        const payerId = o.order?.balancePayerId;
                        return (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {o.senderOffer && (
                              <Link href={`/${locale}/product/${o.senderOffer.id}`} className="relative flex items-start gap-2 border rounded-md p-2 w-full sm:max-w-[320px] hover:bg-gray-50 transition">
                                {/* Badge rôle expéditeur */}
                                <img src={o.senderOffer.mainImageUrl} alt={o.senderOffer.title} className="w-24 h-24 sm:w-28 sm:h-28 rounded object-cover" />
                                <div className="min-w-0">
                                  <div className="text-[11px] text-gray-500">Produit proposé</div>
                                  <div className="text-sm font-medium line-clamp-1">{o.senderOffer.title}</div>
                                  <div className="text-xs text-gray-600">{Number(senderPrice)} DH</div>
                                  {o.senderOffer.productCondition && (
                                    <span className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{conditionLabel(o.senderOffer.productCondition)}</span>
                                  )}
                                  {o.senderOffer.description && (
                                    <div className="mt-1 text-[11px] text-gray-500 line-clamp-2">{o.senderOffer.description}</div>
                                  )}
                                </div>
                                {(balance > 0 && payerId !== group.offer.sellerId) && (
                                  <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow border bg-emerald-100 text-emerald-700 border-emerald-300`}>
                                    + {Number(balance)} DH
                                  </div>
                                )}
                              </Link>
                            )}
                            {/* Icône mobile pivotée */}
                            <span className="text-gray-400 sm:hidden self-center"><ArrowRightLeft className="w-6 h-6 transform rotate-90" /></span>
                            <span className="text-gray-400 hidden sm:inline"><ArrowRightLeft className="w-6 h-6" /></span>
                            <Link href={`/${locale}/product/${group.offer.id}`} className="relative flex items-start gap-2 border rounded-md p-2 w-full sm:max-w-[320px] hover:bg-gray-50 transition">
                              {/* Badge rôle receveur */}
                              <img src={group.offer.mainImageUrl} alt={group.offer.title} className="w-24 h-24 sm:w-28 sm:h-28 rounded object-cover grayscale" />
                              <div className="min-w-0">
                                <div className="text-[11px] text-gray-500">Mon produit</div>
                                <div className="text-sm font-medium line-clamp-1">{group.offer.title}</div>
                                <div className="text-xs text-gray-600">{Number(myPrice)} DH</div>
                                {group.offer.productCondition && (
                                  <span className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{conditionLabel(group.offer.productCondition)}</span>
                                )}
                                {group.offer.description && (
                                  <div className="mt-1 text-[11px] text-gray-500 line-clamp-2">{group.offer.description}</div>
                                )}
                              </div>
                              {(balance > 0 && payerId === group.offer.sellerId) && (
                                <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow border bg-amber-100 text-amber-700 border-amber-300`}>
                                  + {Number(balance)} DH
                                </div>
                              )}
                            </Link>
                          </div>
                        );
                      })()}

                      {o.productChanges && (
                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                          <span className="font-medium">Changements produit</span>
                          {o.productChanges.titleChanged && (
                            <span className="truncate">Titre: "{o.productChanges.snapshotTitle}" → "{o.productChanges.currentTitle}"</span>
                          )}
                          {o.productChanges.snapshotPrice !== undefined && (
                            <span>Prix: {Number(o.productChanges.snapshotPrice)} → {Number(o.productChanges.currentPrice)} DH</span>
                          )}
                        </div>
                      )}

                      {/* Message si l'autre a demandé un prix (balanceAmount > 0 et payerId = moi) */}
                      {(() => {
                        return (o.order.balanceAmount > 0 && o.order.balancePayerId === group.offer.sellerId) ? (
                          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                            {o.sender?.name || 'L’utilisateur'} demande d’ajouter <span className="font-bold text-a">{Number(o.order.balanceAmount)} DH</span> sur votre produit.
                          </div>
                        ) : null;
                      })()}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
                        <div className="text-sm text-gray-700">
                          {(() => {
                            const sp = Number(o.senderProductSnapshot?.price ?? o.senderOffer?.price ?? 0);
                            const mp = Number(group.offer?.price ?? 0);
                            const df = Math.abs(mp - sp);
                            return (
                              <>
                                Différence: <span className="font-bold text-emerald-600">{Number(df)} DH</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex flex-row items-stretch gap-2 w-full sm:w-auto max-w-sm sm:max-w-none">
                          <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-md font-medium text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none">Refuser</button>
                          <button
                            onClick={() => handleOpenNegotiation(o.order.id, o.sender.userId)}
                            className="inline-flex items-center justify-center gap-3 rounded-md bg-emerald-600 px-4 py-2 text-md font-medium text-white hover:bg-emerald-700 flex-1 sm:flex-none"
                          >
                            <span>Accepter et négocier</span>
                            <MessageSquareShare className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <div className="text-sm text-gray-600">
                Page {page} / {Math.max(1, Math.ceil((data?.pagination?.totalOffers || 0) / limit))}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil((data?.pagination?.totalOffers || 0) / limit)}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        ) : (
          !isLoading && <div className="text-sm text-gray-500">Aucune commande reçue.</div>
        )}
      </div>
    </>
  );
}

// Bannière promotionnelle inspirée du design fourni, sans dépendances externes (icônes SVG inline)
function PromoBanner({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState<number>(() => {
    const start = new Date(createdAt).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return Math.max(0, end - Date.now());
  });
  useEffect(() => {
    const id = setInterval(() => {
      const start = new Date(createdAt).getTime();
      const end = start + 24 * 60 * 60 * 1000;
      setRemaining(Math.max(0, end - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const total = Math.floor(remaining / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  const isExpired = total <= 0;


  return (
    <div className="rounded-md bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-1 inline-flex items-center gap-2 text-[10px] sm:text-[11px]">
      <img src="https://static-content-dropify.com/dropify_static_assets/img/apps/new_apps/cathedis.svg" alt="Cathedis" className="w-5 h-5 sm:w-7 sm:h-7" />
      <span className="hidden sm:inline">Cathedis</span>
      <span className="opacity-80 hidden sm:inline">•</span>
      <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
      <span className="text-white font-semibold text-[11px] sm:text-sm">{isExpired ? '-5% livraison' : '-15% livraison'}</span>
      {!isExpired && (
        <>
          <span className="opacity-80">•</span>
          <span className="font-mono flex items-center gap-2">
            <div className=" bg-white/20 flex items-center justify-center w-7 backdrop-blur-sm rounded-md py-1 my-1">
              {h}
            </div>
            :
            <div className=" bg-white/20 flex items-center justify-center w-7 backdrop-blur-sm rounded-md py-1 my-1">
              {m}
            </div>
            :
            <div className=" bg-white/20 flex items-center justify-center w-7 backdrop-blur-sm rounded-md py-1 my-1">
              {s}
            </div>
          </span>
        </>
      )}
    </div>
  );

}