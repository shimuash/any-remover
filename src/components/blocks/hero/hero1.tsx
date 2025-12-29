import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import ImageUploader from './image-uploader';

export default async function HeroSection() {
  const t = await getTranslations('HomePage.remover');

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 lg:pt-24 2xl:pt-28 md:pb-24">
      <Container className="px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-end mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-title leading-tight">
            {t('title')}
          </h1>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {t('description')}
          </p>
        </div>

        <Button
          size="lg"
          className="rounded-full text-base cursor-pointer h-12"
        >
          {t('cta')}
        </Button>

        <ImageUploader />
      </Container>
    </section>
  );
}
