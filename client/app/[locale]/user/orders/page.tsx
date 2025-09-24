"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function UserOrdersPage() {
  const params = useParams();
  const locale = (params as any)?.locale as string | undefined;
  const base = locale ? `/${locale}` : '';
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Commandes</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5 text-emerald-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6h4l2 3h4l2-3h4z" />
            </svg>
            <h2 className="text-base font-medium">Commandes reçues</h2>
          </div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Les demandes envoyées par vos clients.</p>
              <Link
                href={`${base}/user/orders/received`}
                className="mt-3 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <span>Voir les commandes reçues</span>
              </Link>
              <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-gray-500">
                Aucune commande reçue pour le moment.
              </div>
            </div>
            <Image
              src="/receivedOrder.svg"
              alt="Illustration commandes reçues"
              width={125}
              height={125}
              className="hidden md:block mx-2"
            />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5 text-indigo-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 8h14l-1 11a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z" />
            </svg>
            <h2 className="text-base font-medium">Mes commandes</h2>
          </div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Consultez vos commandes passées et en cours.</p>
              <Link
                href={`${base}/user/orders/sent`}
                className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span>Voir mes commandes envoyées</span>
              </Link>
              <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-gray-500">
                Aucune commande pour le moment.
              </div>
            </div>
            <Image
              src="/sendOrder.svg"
              alt="Illustration commandes envoyées"
              width={125}
              height={125}
              className="hidden md:block mx-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}