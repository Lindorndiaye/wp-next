import { Column } from "@once-ui-system/core";
import { getWordPressTemoignages } from "@/utils/wordpress";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";

const SECTION_TITLE = "Témoignages";

export async function TemoignagesSection() {
  const temoignages = await getWordPressTemoignages();

  if (!temoignages.length) {
    return null;
  }

  const testimonials = temoignages.map((t) => ({
    name: t.name,
    content: t.content,
    role: t.poste,
    image: t.image,
    avatar: t.image,
  }));

  return (
    <Column fillWidth gap="24" marginBottom="l">
      <TestimonialsSlider title={SECTION_TITLE} testimonials={testimonials} />
    </Column>
  );
}
