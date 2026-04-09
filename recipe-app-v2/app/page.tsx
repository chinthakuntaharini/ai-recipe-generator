'use client';

import RecipeForm from '@/components/RecipeForm';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <RecipeForm />
    </main>
  );
}
