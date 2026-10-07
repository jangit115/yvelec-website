# Yvelec website

Site vitrine de Yvelec SRL (Fernelmont), entreprise générale d'électricité tertiaire et industrielle.

## Stack
- HTML/CSS statique, styles inline et dans `<style>`. Pas de framework, pas de build.
- Positionnement : spécialiste de l'électricité tertiaire et industrielle (section `#specialiste`, hero, meta, JSON-LD `slogan`, FAQ).
- Pages : `index.html` (accueil), `services/<slug>.html` (une page par service), `confidentialite.html`, `mentions-legales.html`. Même header/footer et menu mobile (`.mnav`) partout : toute modification du header/footer se fait dans tous les fichiers.
- Hébergement prévu : Vercel (`vercel.json`, `cleanUrls` : `/services/photovoltaique` sert `services/photovoltaique.html`). Liens internes absolus (`/services/...`, `/assets/...`) : ne fonctionnent pas en ouvrant le fichier directement.
- Preview locale : `py dev/serve.py` puis http://localhost:4321. Imite `cleanUrls` et simule `/api/contact` sans Supabase (demandes écrites dans `dev/submissions.jsonl`, ignoré par git).
- Formulaire de contact : `index.html` POST vers `api/contact.js` (fonction Vercel) qui insère dans la table Supabase `contact_requests` (`supabase/migrations/`). Variables d'environnement Vercel : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, et optionnellement `RESEND_API_KEY`, `CONTACT_NOTIFY_TO`, `CONTACT_NOTIFY_FROM` pour la notification e-mail. La clé secrète ne doit jamais apparaître dans le HTML.
- `.vercelignore` exclut `CLAUDE.md`, `supabase/`, `dev/` et `.env.example` de la publication.
- Les pages confidentialité et mentions légales sont des projets : les `[À COMPLÉTER]` doivent être remplis et validés avant la mise en ligne.
- Ne rien publier en ligne sans accord explicite de Jan.

## Charte graphique 2026 (à respecter strictement)
- Navy principal `#15152C`, navy secondaire `#1E1F3C`, orange-rouge `#E44224` (accent uniquement : boutons, titres de section, icônes).
- Police officielle : Sofia Pro (licence payante, à installer). Fallback actuel : Sora via Google Fonts.
- Logos dans `assets/` : `logo.png` (fond clair), `logo-white.png` (fond navy), `mark.png` (symbole seul). Ne jamais déformer, recolorer ni mettre d'effet sur le logo. Zone de dégagement = largeur du E de YVELEC.

## Contenu
- Langue : français. Ton : professionnel, direct, B2B.
- Tout texte entre crochets `[…]` est un placeholder à remplacer (photos, logos clients, projets, agréation).
- Coordonnées : Rue Léopold Genicot 3, 5380 Noville-les-Bois (Fernelmont), 081 51 25 15, info@yvelec.be, TVA BE 0451.783.240.

## SEO / AEO
- Domaine supposé : `https://www.yvelec.be/` (canonical, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt`). À adapter si le domaine change.
- Le JSON-LD dans `<head>` (Electrician + WebSite + FAQPage) doit rester aligné avec le contenu visible : toute modification des services, coordonnées ou de la FAQ se fait aux deux endroits, et dans `llms.txt`.
- Un seul `<h1>`, titres de cartes en `<h3>`. Mettre à jour `<lastmod>` dans `sitemap.xml` à chaque publication.

## Règles
- Ne pas inventer de chiffres, de clients ou de projets : laisser des placeholders.
- Garder le site responsive (testé à 390px, 768px, 1440px).
- Accessibilité : contrastes 4.5:1, labels sur les champs de formulaire, cibles tactiles 44px minimum.
