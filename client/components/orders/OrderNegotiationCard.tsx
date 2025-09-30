'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import OrderNegotiationStep1 from './OrderNegotiationStep1';
import OrderNegotiationStep2 from './OrderNegotiationStep2';
import { useGetNegotiationInitByOrderIdQuery, useAcceptNegotiationMutation } from '@/services/api/RepriseOrderApi';
import { useCurrentUser } from '@/services/hooks/useCurrentUser';

export default function OrderNegotiationCard({ orderId, onConfirm }: { orderId: number | null; onConfirm?: (value: number) => void }) {
  const { data, isLoading, error, refetch } = useGetNegotiationInitByOrderIdQuery(orderId as any, { skip: !orderId });
  const { currentUser } = useCurrentUser();
  const [acceptNegociation] = useAcceptNegotiationMutation();

  const [localValue, setLocalValue] = useState<string>('0');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Déplacement désactivé: suppression de toute logique de drag/position

  if (!orderId) {
    return null;
  }

  const d = data?.data;
  const target = d?.target;
  const mine = d?.mine;
  const diff = Number(d?.difference) || 0;
  const direction = d?.direction as 'payer' | 'recevoir' | 'egal';
  const balanceSenderId = d?.order?.balanceSenderId ?? d?.balanceSenderId; // compat
  const isSender = currentUser?.id && balanceSenderId ? currentUser.id === balanceSenderId : false;
  const orderStatus = d?.order?.status || 'negotiation';
  const senderDisplayName = d?.senderDisplayName || null;
  const isOrderSender = !!d?.isOrderSender;
  const step = (orderStatus === 'accepted' ? 2 : 1) as 1 | 2 | 3;

  useEffect(() => {
    setLocalValue(String(diff));
  }, [diff]);

  const handleConfirm = () => {
    const v = Math.max(0, Number(localValue) || 0);
    if (onConfirm) onConfirm(v);
  };

  if (isLoading) {
    return <div className="text-xs text-gray-500">Chargement de la négociation...</div>;
  }
  if (error || !data?.data) {
    return <div className="text-xs text-red-600">Impossible de charger les détails de négociation.</div>;
  }

  const content = (
    <div className="pointer-events-auto bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Négociation</span>
          <span className="text-xs text-gray-700">Étape {step}/3</span>
        </div>
        <button
          className={`p-1 rounded hover:bg-gray-100 ${collapsed ? 'animate-attention ring-2 ring-blue-300 rounded-full' : ''}`}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Afficher' : 'Minimiser'}
        >
          {collapsed ? <ChevronDown size={17} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        step === 1 ? (
          <OrderNegotiationStep1
            direction={direction}
            target={target}
            mine={mine}
            initialDiff={diff}
            value={localValue}
            onChange={setLocalValue}
            onConfirm={handleConfirm}
            isSender={isSender}
            onAccept={async () => {
              try {
                if (!orderId) return;
                if (!window.confirm('Confirmer l\'acceptation de cette proposition ?')) return;
                await acceptNegociation({ orderId }).unwrap();
                // Recharger les infos pour passer à l'étape 2
                setTimeout(() => { try { refetch(); } catch {} }, 150);
              } catch {}
            }}
          />
        ) : (
          <OrderNegotiationStep2
            isOrderSender={isOrderSender}
            senderDisplayName={senderDisplayName}
            onSelectMethod={(m) => {
              // TODO: brancher API + socket
              console.log('Méthode sélectionnée:', m);
            }}
            onSelectCarrier={(carrier) => {
              // Placeholder: intégration API à venir
              console.log('Carrier selected:', carrier);
            }}
          />
        )
      )}
    </div>
  );

  return (
    <>
      <style jsx>{`
        @keyframes attention-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-attention {
          animation: attention-bounce 1.2s ease-in-out infinite;
        }
      `}</style>
      <div
        className="w-full p-2 pointer-events-none"
        style={{ right: 16, top: 56 }}
      >
        {content}
      </div>
    </>
  );
}