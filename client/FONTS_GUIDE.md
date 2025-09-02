# Guide des Polices Google Fonts - my reprise

Ce guide explique comment utiliser les polices Google Fonts intégrées dans le projet my reprise.

## Polices Disponibles

### 1. Cairo (Police par défaut)
- **Usage** : Police principale pour tout le contenu
- **Langues** : Arabe, Latin
- **Poids disponibles** : 200, 300, 400, 500, 600, 700, 800, 900
- **Variable CSS** : `--font-cairo`

### 2. Tajawal (Police Arabe)
- **Usage** : Police spécialisée pour le contenu arabe
- **Langues** : Arabe
- **Poids disponibles** : 200, 300, 400, 500, 700, 800, 900
- **Variable CSS** : `--font-tajawal`

### 3. Poppins (Police Latine)
- **Usage** : Police moderne pour le contenu français/anglais
- **Langues** : Latin
- **Poids disponibles** : 100, 200, 300, 400, 500, 600, 700, 800, 900
- **Styles** : Normal et Italic
- **Variable CSS** : `--font-poppins`

### 4. Mulish (Police Moderne)
- **Usage** : Police alternative moderne
- **Langues** : Latin
- **Poids disponibles** : 200, 300, 400, 500, 600, 700, 800, 900
- **Variable CSS** : `--font-mulish`

### 5. IBM Plex Sans Arabic (Police Professionnelle)
- **Usage** : Police professionnelle pour le contenu arabe
- **Langues** : Arabe
- **Poids disponibles** : 100, 200, 300, 400, 500, 600, 700
- **Variable CSS** : `--font-ibm-plex-sans-arabic`

## Utilisation

### Avec les classes Tailwind CSS

```tsx
// Police par défaut (Cairo)
<p className="font-cairo font-medium">Texte avec Cairo Medium</p>

// Polices spécifiques
<p className="font-tajawal font-bold">نص عربي بخط تجول عريض</p>
<p className="font-poppins font-semibold">Texte français avec Poppins</p>
<p className="font-mulish font-light">Texte avec Mulish Light</p>
<p className="font-arabic font-medium">نص عربي مع IBM Plex</p>
```

### Avec les classes CSS personnalisées

#### Cairo
```tsx
<p className="cairo-light">Cairo Light</p>
<p className="cairo-regular">Cairo Regular</p>
<p className="cairo-medium">Cairo Medium</p>
<p className="cairo-bold">Cairo Bold</p>
```

#### Tajawal
```tsx
<p className="tajawal-light">تجول خفيف</p>
<p className="tajawal-regular">تجول عادي</p>
<p className="tajawal-medium">تجول متوسط</p>
<p className="tajawal-bold">تجول عريض</p>
```

#### Poppins
```tsx
<p className="poppins-light">Poppins Light</p>
<p className="poppins-regular">Poppins Regular</p>
<p className="poppins-medium">Poppins Medium</p>
<p className="poppins-bold">Poppins Bold</p>

// Avec italique
<p className="poppins-light-italic">Poppins Light Italic</p>
<p className="poppins-bold-italic">Poppins Bold Italic</p>
```

#### Mulish
```tsx
<p className="mulish-light">Mulish Light</p>
<p className="mulish-regular">Mulish Regular</p>
<p className="mulish-medium">Mulish Medium</p>
<p className="mulish-bold">Mulish Bold</p>
```

#### IBM Plex Sans Arabic
```tsx
<p className="ibm-plex-sans-arabic-light">خط آي بي إم رفيع</p>
<p className="ibm-plex-sans-arabic-regular">خط آي بي إم عادي</p>
<p className="ibm-plex-sans-arabic-medium">خط آي بي إم متوسط</p>
<p className="ibm-plex-sans-arabic-bold">خط آي بي إم عريض</p>
```

## Configuration Automatique par Langue

Le projet est configuré pour utiliser automatiquement les polices appropriées selon la langue :

- **Français/Anglais** : Cairo par défaut, Poppins pour l'emphase
- **Arabe** : Cairo par défaut, Tajawal ou IBM Plex Sans Arabic pour l'emphase

## Bonnes Pratiques

1. **Police par défaut** : Cairo est déjà appliquée à tous les éléments `body`
2. **Hiérarchie** : Utilisez différents poids pour créer une hiérarchie visuelle
3. **Lisibilité** : Pour l'arabe, privilégiez Tajawal ou IBM Plex Sans Arabic
4. **Performance** : Les polices sont chargées de manière optimisée via Next.js

## Exemple Complet

```tsx
import React from 'react';

const ExempleComposant = () => {
  return (
    <div className="space-y-4">
      {/* Titre principal */}
      <h1 className="font-cairo font-bold text-3xl">
        Titre Principal
      </h1>
      
      {/* Contenu arabe */}
      <p className="font-tajawal font-medium text-lg" dir="rtl">
        هذا نص عربي باستخدام خط تجول
      </p>
      
      {/* Contenu français */}
      <p className="font-poppins font-regular">
        Ceci est un texte français avec Poppins
      </p>
      
      {/* Emphase */}
      <p className="font-mulish font-semibold text-blue-600">
        Texte important avec Mulish
      </p>
    </div>
  );
};
```

## Composant de Démonstration

Un composant de démonstration est disponible dans `components/examples/FontsDemo.tsx` qui montre toutes les polices et leurs variantes.

Pour l'utiliser :

```tsx
import FontsDemo from '@/components/examples/FontsDemo';

// Dans votre composant
<FontsDemo />
```
