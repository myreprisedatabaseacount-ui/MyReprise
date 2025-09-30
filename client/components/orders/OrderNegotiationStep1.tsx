'use client';

import React, { useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';

type Direction = 'payer' | 'recevoir' | 'egal';

interface ItemInfo {
    image?: string;
    title?: string;
    price?: number | string;
}

interface OrderNegotiationStep1Props {
    direction: Direction;
    target?: ItemInfo | null;
    mine?: ItemInfo | null;
    initialDiff: number;
    value: string;
    onChange: (v: string) => void;
    onConfirm: (value: number) => void;
    isSender?: boolean;
    onAccept?: () => void;
}

export default function OrderNegotiationStep1({
    direction,
    target,
    mine,
    initialDiff,
    value,
    onChange,
    onConfirm,
    isSender = false,
    onAccept,
}: OrderNegotiationStep1Props) {
    const explanation = useMemo(() => {
        const numeric = Math.max(0, Number(value) || 0);
        if (direction === 'payer') return `Vous devez payer ${numeric} DH`;
        if (direction === 'recevoir') return `Vous allez recevoir ${numeric} DH`;
        return 'Échange à valeur égale';
    }, [direction, value]);

    const isDirty = useMemo(() => {
        const base = Math.max(0, Number(initialDiff) || 0);
        const current = Math.max(0, Number(value) || 0);
        return current !== base;
    }, [initialDiff, value]);

    const handleConfirm = () => {
        const v = Math.max(0, Number(value) || 0);
        onConfirm(v);
    };

    return (
        <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
                {target && (
                    <div className="flex items-center gap-2 border rounded-lg px-2 py-1 flex-1 min-w-0">
                        <img src={(target.image as string) || '/placeholder.png'} alt={(target.title as string) || ''} className="w-10 h-10 rounded object-cover" />
                        <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{(target.title as string) || ''}</div>
                            <div className="text-[11px] text-gray-600">{Number(target.price)} DH</div>
                        </div>
                    </div>
                )}
                <ArrowLeftRight size={14} className="text-blue-600 animate-pulse" />
                {mine && (
                    <div className="relative flex items-center gap-2 border rounded-lg px-2 py-1 flex-1 min-w-0">
                        <img src={(mine.image as string) || '/placeholder.png'} alt={(mine.title as string) || ''} className="w-10 h-10 rounded object-cover" />
                        <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{(mine.title as string) || ''}</div>
                            <div className="text-[11px] text-gray-600">{Number(mine.price)} DH</div>
                        </div>
                        {direction === 'payer' && (
                            <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow border bg-amber-100 text-amber-700 border-amber-300`}>
                                + {Math.max(0, Number(value) || 0)} DH
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Valeur à ajouter"
                />
                {/* Boutons conditionnels selon le rôle et la modification */}
                {isSender ? (
                    // L'expéditeur courant ne voit rien si pas de modification; sinon il peut proposer
                    isDirty ? (
                        <button
                            onClick={handleConfirm}
                            className={`bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm rounded-md text-white flex items-center gap-1`}
                        >
                            <span>Proposer ce prix</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 ml-1">
                                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    ) : null
                ) : (
                    // Le destinataire peut accepter si pas de modification, sinon proposer
                    isDirty ? (
                        <button
                            onClick={handleConfirm}
                            className={`bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm rounded-md text-white flex items-center gap-1`}
                        >
                            <span>Proposer ce prix</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 ml-1">
                                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={onAccept}
                            className={`bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-sm rounded-md text-white`}
                        >
                            Accepter
                        </button>
                    )
                )}
            </div>
            <div className={`text-xs ${direction === 'payer' ? 'text-amber-700' : direction === 'recevoir' ? 'text-emerald-700' : 'text-gray-600'}`}>{explanation}</div>
        </div>
    );
}


