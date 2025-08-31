'use client';

import { ReactNode } from 'react';
import { Sidebar } from '../../../components/back-office/side-bar/sideBar';
import {  TopBar } from '../../../components/back-office/header/Header';
import { SidebarProvider } from '../../../components/ui/sidebar';

export default function BackOfficeLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="h-screen overflow-hidden flex w-full bg-white">
                {/* Sidebar avec overlay sur mobile */}
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <TopBar />
                    <main className="flex-1 p-4 md:p-6 bg-white overflow-y-auto">
                        <div className="max-w-7xl mx-auto mt-14">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
