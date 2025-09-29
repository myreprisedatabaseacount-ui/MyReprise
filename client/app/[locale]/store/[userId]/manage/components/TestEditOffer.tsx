import React, { useState } from 'react';
import { Button } from '../../../../../../components/ui/button';
import EditOfferModal from './EditOfferModal';

const TestEditOffer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Données de test
  const testOffer = {
    id: 1,
    title: "iPhone 12 Pro",
    description: "iPhone 12 Pro en bon état, 128GB",
    price: 2500,
    productCondition: "good",
    listingType: "item",
    categoryId: 1,
    brandId: 1,
    subjectId: null,
    specificData: {},
    images: [
      {
        id: 1,
        imageUrl: "/images/iphone12pro_black.jpg",
        isMain: true,
        color: "Noir",
        colorHex: "#000000"
      }
    ],
    repriseCategories: [
      { id: 1, name: "électronique" },
      { id: 2, name: "téléphones" }
    ],
    exchangeBrands: [
      { id: 1, name: "Apple" },
      { id: 2, name: "Samsung" }
    ]
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Test de modification d'offre</h2>
      <Button onClick={() => setIsModalOpen(true)}>
        Ouvrir le modal de modification
      </Button>

      <EditOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offer={testOffer}
        onSuccess={() => {
          console.log('Modification réussie');
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default TestEditOffer;
