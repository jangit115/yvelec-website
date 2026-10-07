// Fonction Vercel : reçoit le formulaire de contact et l'enregistre dans Supabase.
// Variables d'environnement (Vercel > Settings > Environment Variables) :
//   SUPABASE_URL                 ex. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    clé secrète (jamais côté navigateur)

const FIELDS = {
  nom: 120,
  societe: 160,
  email: 200,
  telephone: 40,
  type_projet: 120,
  message: 5000,
  page: 200,
};

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function reply(req, res, status, body) {
  const wantsJson = (req.headers.accept || '').includes('application/json');
  if (!wantsJson && status === 200) {
    // Envoi sans JavaScript : retour sur la page avec un message de confirmation.
    res.writeHead(303, { Location: '/?envoye=1#contact' });
    return res.end();
  }
  return res.status(status).json(body);
}

// Notification e-mail via Resend, uniquement si RESEND_API_KEY, CONTACT_NOTIFY_TO et
// CONTACT_NOTIFY_FROM sont définis. Un échec n'empêche pas l'enregistrement de la demande.
async function notify(row) {
  const { RESEND_API_KEY, CONTACT_NOTIFY_TO, CONTACT_NOTIFY_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_NOTIFY_TO || !CONTACT_NOTIFY_FROM) return;
  const text = [
    `Nom : ${row.nom}`,
    `Société : ${row.societe || '-'}`,
    `E-mail : ${row.email}`,
    `Téléphone : ${row.telephone || '-'}`,
    `Type de projet : ${row.type_projet || '-'}`,
    `Page : ${row.page || '-'}`,
    '',
    row.message,
  ].join('\n');
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_NOTIFY_FROM,
        to: CONTACT_NOTIFY_TO.split(',').map((s) => s.trim()),
        reply_to: row.email,
        subject: `Nouvelle demande via yvelec.be : ${row.nom}${row.societe ? ` (${row.societe})` : ''}`,
        text,
      }),
    });
    if (!r.ok) console.error('Resend failed', r.status, await r.text());
  } catch (err) {
    console.error('Resend error', err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};

  // Champ piège : rempli uniquement par les robots. On fait semblant que tout va bien.
  if (clean(body.site_web, 200)) return reply(req, res, 200, { ok: true });

  const row = {};
  for (const [key, max] of Object.entries(FIELDS)) row[key] = clean(body[key], max);

  if (!row.nom || !row.email || !row.message) {
    return reply(req, res, 400, { error: 'Merci de compléter votre nom, votre e-mail et votre projet.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return reply(req, res, 400, { error: "L'adresse e-mail ne semble pas valide." });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant');
    return reply(req, res, 500, { error: "L'envoi a échoué. Appelez-nous au 081 51 25 15 ou écrivez à info@yvelec.be." });
  }

  row.user_agent = clean(req.headers['user-agent'], 300);

  const headers = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  // Les anciennes clés service_role sont des JWT et vont aussi dans Authorization.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/contact_requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(row),
  });

  if (!r.ok) {
    console.error('Supabase insert failed', r.status, await r.text());
    return reply(req, res, 502, { error: "L'envoi a échoué. Appelez-nous au 081 51 25 15 ou écrivez à info@yvelec.be." });
  }

  await notify(row);
  return reply(req, res, 200, { ok: true });
};
