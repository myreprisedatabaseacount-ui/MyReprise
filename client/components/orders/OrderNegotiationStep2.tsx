'use client';

import React, { useMemo, useState } from 'react';
import { Truck, Store } from 'lucide-react';

interface OrderNegotiationStep2Props {
    isOrderSender: boolean;
    senderDisplayName?: string | null;
    onSelectCarrier?: (carrierName: string) => void;
    onSelectMethod?: (method: 'delivery' | 'pickup') => void;
}

export default function OrderNegotiationStep2({
    isOrderSender,
    senderDisplayName,
    onSelectCarrier,
    onSelectMethod,
}: OrderNegotiationStep2Props) {
    const carriers = useMemo(() => ([
        {
            key: 'ozonexpress',
            name: 'OzonExpress',
            logo: '/delivery/ozone.png',
            basePrice: 50,
            discountPercent: 5,
        },
        {
            key: 'forcelog',
            name: 'Forcelog',
            logo: '/delivery/forcelog.png',
            basePrice: 48,
            discountPercent: 10,
        },
        {
            key: 'cathedis',
            name: 'Cathedis',
            logo: '/delivery/cathedis.png',
            basePrice: 45,
            discountPercent: 15, // Meilleure remise
            best: true,
        },
    ]), []);
    const [method, setMethod] = useState<'delivery' | 'pickup' | null>(null);
    const priceAfterDiscount = (p: number, d: number) => Math.max(0, Math.round(p * (1 - d / 100)));

    return (
        <div className="p-3 space-y-2">
            {isOrderSender ? (
                <div className="space-y-3">
                    {!method && (
                        <>
                            <div className="text-sm font-medium">Choisissez le mode de réception</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setMethod('delivery'); onSelectMethod?.('delivery'); }}
                                    className="p-4 rounded-lg border hover:border-blue-400 hover:bg-blue-50 text-left flex items-start gap-3"
                                >
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Truck size={16} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">Livraison</div>
                                        <div className="text-xs text-gray-600 mt-1">Recevoir via une société de livraison</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { setMethod('pickup'); onSelectMethod?.('pickup'); }}
                                    className="p-4 rounded-lg border hover:border-emerald-400 hover:bg-emerald-50 text-left flex items-start gap-3"
                                >
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <Store size={16} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">Retrait sur place</div>
                                        <div className="text-xs text-gray-600 mt-1">Récupérer en personne</div>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}

                    {method === 'delivery' && (
                        <>
                            <div className="text-sm font-medium">Choisissez la société de livraison</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {carriers.map((carrier) => (
                                    <button
                                        key={carrier.key}
                                        onClick={() => onSelectCarrier?.(carrier.name)}
                                        className={` relative px-3 py-3 rounded-md border text-sm hover:bg-gray-50 text-left ${carrier.best ? 'border-amber-300 ring-1 ring-amber-200' : ''}`}
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                                <img
                                                    src={carrier.logo}
                                                    alt={carrier.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{carrier.name}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-600 flex flex-col">
                                                    <div>
                                                        <span className="line-through mr-1">{carrier.basePrice} DH</span>
                                                        <span className="font-semibold">{priceAfterDiscount(carrier.basePrice, carrier.discountPercent)} DH</span>
                                                    </div>
                                                    <span className="mt-1 flex items-center justify-center absolute top-0 right-1 h-6 w-6 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">-{carrier.discountPercent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="text-[11px] text-gray-500">Sélection factice pour l’instant.</div>
                        </>
                    )}

                    {method === 'pickup' && (
                        <div className="p-3 rounded-md border bg-gray-50 text-sm">
                            Retrait sur place.
                            <button>confirmer</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-gray-700">
                    En attente du choix de livraison par {senderDisplayName || "l'expéditeur"}…
                </div>
            )}
        </div>
    );
}


