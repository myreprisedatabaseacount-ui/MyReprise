'use client';
// components/ARScene.js
import { useEffect } from 'react';

const ARScene = () => {
  useEffect(() => {
    const scriptAFRAME = document.createElement('script');
    scriptAFRAME.src = 'https://aframe.io/releases/1.0.0/aframe.min.js';
    scriptAFRAME.async = true;
    document.body.appendChild(scriptAFRAME);

    const scriptARJS = document.createElement('script');
    scriptARJS.src = 'https://raw.githack.com/jeromeetienne/AR.js/2.2.2/aframe/build/aframe-ar.js';
    scriptARJS.async = true;
    document.body.appendChild(scriptARJS);

    return () => {
      document.body.removeChild(scriptAFRAME);
      document.body.removeChild(scriptARJS);
    };
  }, []);

  return (
    <a-scene embedded arjs>
      <a-marker preset="hiro">
        <a-box position="0 0.5 0" material="color: red;"></a-box>
      </a-marker>
      <a-entity camera></a-entity>
    </a-scene>
  );
};

export default ARScene;
