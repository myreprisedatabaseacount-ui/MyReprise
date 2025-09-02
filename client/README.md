# My Reprise Client 🌍

Application web multilingue développée avec Next.js 15, supportant l'arabe (RTL), le français et l'anglais avec traduction automatique et adaptation de l'interface.

## ✨ Fonctionnalités

- **🌐 Multilingue**: Support de 3 langues
  - العربية (ar) - Langue par défaut
  - Français (fr)
  - English (en)

- **📱 RTL/LTR automatique**: 
  - Direction RTL pour l'arabe
  - Direction LTR pour français/anglais
  - Inversion automatique des layouts

- **🎨 UI moderne**:
  - Tailwind CSS avec support RTL
  - Mode sombre/clair
  - Design responsive
  - Transitions fluides

## 🚀 Démarrage rapide

### Installation

\`\`\`bash
# Cloner le projet
git clone [votre-repo]
cd my-reprise-client

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
\`\`\`

### Accès à l'application

- **Accueil**: http://localhost:3000 (redirige vers /ar)
- **Arabe**: http://localhost:3000/ar
- **Français**: http://localhost:3000/fr  
- **Anglais**: http://localhost:3000/en

## 🏗️ Structure du projet

\`\`\`
my-reprise-client/
├── src/
│   ├── app/
│   │   ├── [locale]/           # Routes par langue
│   │   │   ├── layout.tsx      # Layout avec i18n
│   │   │   ├── page.tsx        # Page d'accueil
│   │   │   └── about/
│   │   │       └── page.tsx    # Page à propos
│   │   ├── layout.tsx          # Layout racine
│   │   ├── page.tsx            # Redirection vers /ar
│   │   └── globals.css         # Styles RTL/LTR
│   ├── components/
│   │   └── LanguageSwitcher.tsx # Sélecteur de langue
│   └── middleware.ts           # Middleware i18n
├── messages/                   # Fichiers de traduction
│   ├── ar.json                # العربية
│   ├── fr.json                # Français
│   └── en.json                # English
├── i18n.ts                    # Configuration i18n
└── tailwind.config.ts         # Config Tailwind + RTL
\`\`\`

## 🔧 Technologies utilisées

- **Framework**: Next.js 15 (App Router)
- **Internationalisation**: next-intl
- **Styling**: Tailwind CSS + tailwindcss-rtl
- **TypeScript**: Support complet
- **Fonts**: Geist Sans & Mono

## 🌍 Configuration i18n

### Langues supportées
\`\`\`typescript
const locales = ['ar', 'fr', 'en'];
const defaultLocale = 'ar'; // Arabe par défaut
\`\`\`

### Direction automatique
\`\`\`typescript
// Dans layout.tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
\`\`\`

## 🎨 Support RTL

### CSS personnalisé pour RTL
\`\`\`css
/* Inversion automatique pour l'arabe */
[dir="rtl"] .flex {
  flex-direction: row-reverse;
}

[dir="rtl"] .text-left {
  text-align: right;
}
\`\`\`

### Classes Tailwind adaptées
- Marges/paddings inversés automatiquement
- Alignements de texte adaptés
- Bordures et positionnements ajustés

## 📝 Ajouter une nouvelle traduction

1. **Modifier les fichiers de traduction**:
\`\`\`json
// messages/ar.json
{
  "NouvelleSection": {
    "titre": "عنوان جديد",
    "description": "وصف باللغة العربية"
  }
}
\`\`\`

2. **Utiliser dans un composant**:
\`\`\`typescript
import {useTranslations} from 'next-intl';

export default function MonComposant() {
  const t = useTranslations('NouvelleSection');
  
  return (
    <div>
      <h1>{t('titre')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
\`\`\`

## 🔄 Changement de langue

Le composant \`LanguageSwitcher\` permet de:
- Changer de langue dynamiquement
- Maintenir la même page dans la nouvelle langue
- Adapter automatiquement la direction (RTL/LTR)

## 🚀 Déploiement

\`\`\`bash
# Build de production
npm run build

# Démarrage en production
npm start
\`\`\`

## 📖 Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [next-intl](https://next-intl-docs.vercel.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [tailwindcss-rtl](https://github.com/20lives/tailwindcss-rtl)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (\`git checkout -b feature/nouvelle-fonctionnalite\`)
3. Commit les changes (\`git commit -am 'Ajouter nouvelle fonctionnalité'\`)
4. Push la branche (\`git push origin feature/nouvelle-fonctionnalite\`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ en utilisant Next.js, i18n et Tailwind CSS**