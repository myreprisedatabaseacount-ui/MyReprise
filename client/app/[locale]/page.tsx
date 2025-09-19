import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import NavBar from '../../components/Header/NavBar';
import AuthProvider from '../../components/auth/AuthProvider';
import ProductSlider from '@/components/home/productSlider/slider';
import Hero from '@/components/home/Hero/hero';
import ProductsGrid from '@/components/home/ProductsGrid/ProductsGrid';
import ChatPanelWrapper from '@/components/ChatPanel/ChatPanelWrapper';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Activer le rendu statique
  setRequestLocale(locale);

  const t = await getTranslations('Index');

  return (
    <>
      <NavBar />
      <Hero />
      <ProductSlider title={t('title')} />
      <AuthProvider />
      <ProductsGrid />
      <ChatPanelWrapper />
    </>
  );
}
