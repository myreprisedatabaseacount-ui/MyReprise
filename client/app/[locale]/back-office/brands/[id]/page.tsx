import React from 'react';
import BrandDetailsClient from './BrandDetailsClient';

interface BrandDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const BrandDetailsPage: React.FC<BrandDetailsPageProps> = async ({ params }) => {
  const { id } = await params;
  const brandId = parseInt(id);

  return <BrandDetailsClient brandId={brandId} />;
};

export default BrandDetailsPage;
