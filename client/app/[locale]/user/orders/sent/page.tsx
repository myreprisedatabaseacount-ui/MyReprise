"use client";

import { useListSendedOrdersOnMyOffersQuery } from '@/services/api/RepriseOrderApi';
import { Truck, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

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

export default function SentOrdersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, error } = useListSendedOrdersOnMyOffersQuery({ page, limit });
  const params = useParams();
  const locale = (params as any)?.locale || '';
  const searchParams = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    const orderId = searchParams.get('orderid');
    if (!orderId || !data?.data) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`order-${orderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedId(orderId);
        setAnimatingId(orderId);
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

  const statusBadge = (status?: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-700', label: 'En attente' },
      completed: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700', label: 'Terminé' },
      cancelled: { bg: 'bg-rose-100 border-rose-200', text: 'text-rose-700', label: 'Annulé' },
      refunded: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700', label: 'Remboursé' },
    };
    const k = status && map[status] ? status : 'pending';
    const s = map[k];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 ">
      <h1 className="text-xl font-semibold">Commandes envoyées</h1>

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
                      <div className="w-full sm:w-36">
                        <div className="aspect-square rounded-lg overflow-hidden">
                          <img src={group.offer.mainImageUrl} alt={group.offer.title} className="w-full h-full object-cover" />
                        </div>
                      </div>

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

                    {(() => {
                      const senderPrice = Number(o.senderProductSnapshot?.price ?? o.senderOffer?.price ?? 0);
                      const myPrice = Number(group.offer?.price ?? 0);
                      const balance = Number(o.order?.balanceAmount ?? 0);
                      const payerId = o.order?.balancePayerId;
                      return (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          {o.senderOffer && (
                            <Link href={`/${locale}/product/${o.senderOffer.id}`} className="relative flex items-start gap-2 border rounded-md p-2 w-full sm:max-w-[320px] hover:bg-gray-50 transition">
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
                          <span className="text-gray-400 sm:hidden self-center"><ArrowRightLeft className="w-6 h-6 transform rotate-90" /></span>
                          <span className="text-gray-400 hidden sm:inline"><ArrowRightLeft className="w-6 h-6" /></span>
                          <Link href={`/${locale}/product/${group.offer.id}`} className="relative flex items-start gap-2 border rounded-md p-2 w-full sm:max-w-[320px] hover:bg-gray-50 transition">
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
                      <div className="flex items-center justify-end">
                        {statusBadge(o.order.status)}
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
        !isLoading && <div className="text-sm text-gray-500">Aucune commande envoyée.</div>
      )}
    </div>
  );
}

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
