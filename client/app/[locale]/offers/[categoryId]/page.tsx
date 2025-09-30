import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import NavBar from '../../../../components/Header/NavBar';
import CategoryOffersPage from '../../../../components/offers/CategoryOffersPage';

interface CategoryOffersPageProps {
  params: Promise<{ 
    locale: string;
    categoryId: string;
  }>;
}

export default async function CategoryOffersPageRoute({
  params
}: CategoryOffersPageProps) {
  const { locale, categoryId } = await params;

  // Activer le rendu statique
  setRequestLocale(locale);

  // Vérifier que categoryId est un nombre valide
  if (!categoryId || isNaN(Number(categoryId))) {
    notFound();
  }

  const t = await getTranslations('Offers');

  return (
    <>
      <NavBar />
      <CategoryOffersPage 
        categoryId={Number(categoryId)} 
        locale={locale}
        title={t('categoryOffers')}
      />
    </>
  );
}
