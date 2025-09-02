'use client'

import Image from 'next/image';
import Imagetest from '/public/23872855_6867958.jpg';
import { CldImage } from 'next-cloudinary';

export default function HomePage() {

  return (
    <div className="min-h-screen ">
      {/* <Image src={Imagetest} alt="Image"  /> */}
      teste
      {/* <CldImage
        width="960"
        height="600"
        src={'/public/23872855_6867958.jpg'}
        sizes="100vw"
        alt="Description of my image"
      /> */}

    </div>
  );
}
