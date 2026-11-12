-- Backfill: a banner saved before the cards became customisable would otherwise
-- show no trust badges / "why us" cards / sign-up banner. Give it the original content.
UPDATE "HomeBanner" SET
  "trustItems" = '[{"icon":"🌿","title":"100% Organic","text":"Certified by APEDA"},{"icon":"🚚","title":"Free Delivery","text":"On orders above ₹499"},{"icon":"🔄","title":"Easy Returns","text":"No questions asked"},{"icon":"🛡️","title":"Safe Payments","text":"100% secure checkout"}]',
  "whyTitle" = 'Why EchOrganics?',
  "whySubtitle" = 'We''re not just a store — we''re a movement for healthier living',
  "whyCards" = '[{"icon":"🌾","title":"Direct from Farm","text":"We partner directly with certified organic farmers, cutting out middlemen to deliver the freshest produce."},{"icon":"🔬","title":"Lab Tested","text":"Every batch is tested for pesticides and chemicals. We guarantee what''s on the label is what''s in the pack."},{"icon":"♻️","title":"Eco Packaging","text":"100% biodegradable packaging. We care about your health and the planet equally."},{"icon":"💚","title":"Community First","text":"Every purchase supports local organic farmers and sustainable farming practices in India."}]',
  "ctaTitle" = 'Ready to eat healthier?',
  "ctaText" = 'Join 10,000+ families who switched to organic with EchOrganics',
  "ctaButtonText" = 'Create Free Account →',
  "ctaButtonLink" = '/register'
WHERE "whyTitle" = '' AND "ctaTitle" = '' AND "trustItems" = '[]'::jsonb AND "whyCards" = '[]'::jsonb;
