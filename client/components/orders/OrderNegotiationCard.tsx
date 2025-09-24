'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import OrderNegotiationStep1 from './OrderNegotiationStep1';
import { useGetNegotiationInitByOrderIdQuery } from '@/services/api/RepriseOrderApi';

export default function OrderNegotiationCard({ orderId, onConfirm }: { orderId: number | null; onConfirm?: (value: number) => void }) {
  const { data, isLoading, error } = useGetNegotiationInitByOrderIdQuery(orderId as any, { skip: !orderId });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>({ left: window.innerWidth - 382, top: 56 });
  const [dragging, setDragging] = useState<boolean>(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localValue, setLocalValue] = useState<string>('0');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (!position && containerRef.current) {
      const width = containerRef.current.offsetWidth || 360;
      const left = Math.max(15, window.innerWidth - width - 15);
      setPosition({ left, top: 56 });
    }
  }, [position]);

  const onDragStart = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const width = containerRef.current?.offsetWidth || 360;
      const height = containerRef.current?.offsetHeight || 160;
      const maxLeft = Math.max(0, window.innerWidth - width - 8);
      const maxTop = Math.max(0, window.innerHeight - height - 8);
      const newLeft = Math.min(Math.max(8, e.clientX - dragOffset.current.x), maxLeft);
      const newTop = Math.min(Math.max(8, e.clientY - dragOffset.current.y), maxTop);
      setPosition({ left: newLeft, top: newTop });
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);

  if (!orderId) {
    return null;
  }

  const d = data?.data;
  const target = d?.target;
  const mine = d?.mine;
  const diff = Number(d?.difference) || 0;
  const direction = d?.direction as 'payer' | 'recevoir' | 'egal';
  const step = 1 as 1 | 2 | 3;

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
    <div className="pointer-events-auto rounded-xl shadow-xl border border-gray-200 bg-white" ref={containerRef}>
      <div className="flex items-center justify-between px-3 py-2 border-b cursor-move" onMouseDown={onDragStart}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Négociation</span>
          <span className="text-xs text-gray-700">Étape {step}/3</span>
        </div>
        <button
          className="p-1 rounded hover:bg-gray-100"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Afficher' : 'Minimiser'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <OrderNegotiationStep1
          direction={direction}
          target={target}
          mine={mine}
          initialDiff={diff}
          value={localValue}
          onChange={setLocalValue}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );

  return (
    <div
      className="fixed z-50 w-80 sm:w-96 p-2 pointer-events-none"
      style={{ left: position?.left ?? undefined, top: position?.top ?? 56 }}
    >
      {content}
    </div>
  );
}