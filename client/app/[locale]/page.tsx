import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

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
    <div className="min-h-screen bg-red-500 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('description')}
          </p>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            {t('welcome')}
          </button>
        </div>
        
        {/* Section de test pour vérifier Tailwind */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-xl shadow-md border border-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Rapide</h3>
            <p className="text-muted-foreground">Performance optimisée avec Next.js</p>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-md border border-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-secondary rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Multilingue</h3>
            <p className="text-muted-foreground">Support complet i18n avec next-intl</p>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-md border border-border hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-accent rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Moderne</h3>
            <p className="text-muted-foreground">Interface élégante avec Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
