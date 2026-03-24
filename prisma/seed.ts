import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import { matchSteps } from "../lib/formData";
import { randomBytes, scryptSync } from "crypto";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no esta definida para ejecutar seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashSeedPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const saltBuffer = Buffer.from(salt, "hex");
  const keyLen = 64;
  const cost = 16384;
  const blockSize = 8;
  const parallelization = 1;
  const derivedKey = scryptSync(password, saltBuffer, keyLen, {
    N: cost,
    r: blockSize,
    p: parallelization,
  }).toString("hex");

  // Formato portable para futuro verify:
  // scrypt$N$r$p$salt$hash
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt}$${derivedKey}`;
}

async function main() {
  // Idempotente: borra y recrea para poder correr seed múltiples veces
  await prisma.matchStepOption.deleteMany({});
  await prisma.matchStep.deleteMany({});

  for (const [i, step] of matchSteps.entries()) {
    const created = await prisma.matchStep.create({
      data: {
        orden: i + 1,
        question: step.question,
        columns: step.columns ?? 1,
        active: true,
      },
    });
    for (const [j, label] of step.options.entries()) {
      await prisma.matchStepOption.create({
        data: { stepId: created.id, label, orden: j + 1, active: true },
      });
    }
  }

  const speakers = await Promise.all([
    prisma.speaker.upsert({
      where: { id: 1 },
      update: {
        nombre: "Dra. Ana Lopez",
        especialidad: "Innovacion Disruptiva",
        bio_short: "Experta en cambio organizacional e innovacion aplicada.",
        active: true,
      },
      create: {
        id: 1,
        nombre: "Dra. Ana Lopez",
        especialidad: "Innovacion Disruptiva",
        bio_short: "Experta en cambio organizacional e innovacion aplicada.",
        active: true,
      },
    }),
    prisma.speaker.upsert({
      where: { id: 2 },
      update: {
        nombre: "Dr. Pedro Martinez",
        especialidad: "Estrategia y crecimiento",
        bio_short: "Especialista en liderazgo para equipos de alto rendimiento.",
        active: true,
      },
      create: {
        id: 2,
        nombre: "Dr. Pedro Martinez",
        especialidad: "Estrategia y crecimiento",
        bio_short: "Especialista en liderazgo para equipos de alto rendimiento.",
        active: true,
      },
    }),
    prisma.speaker.upsert({
      where: { id: 3 },
      update: {
        nombre: "Mtra. Carolina Ruiz",
        especialidad: "Ciencia aplicada y futuro",
        bio_short: "Conferencista sobre adopcion tecnologica y cultura de datos.",
        active: true,
      },
      create: {
        id: 3,
        nombre: "Mtra. Carolina Ruiz",
        especialidad: "Ciencia aplicada y futuro",
        bio_short: "Conferencista sobre adopcion tecnologica y cultura de datos.",
        active: true,
      },
    }),
  ]);

  // Cada contacto cubre un estado distinto del embudo para facilitar pruebas visuales:
  // Juan  → sin_ingresar     (token, sin timestamps)
  // Maria → en_proceso       (form_started_at, sin form_completed_at)
  // Carlos→ completo_sin_cita(ambos timestamps, sin calendly_booked_at)
  // Ana   → agendado         (ambos timestamps + calendly_booked_at)
  const now = new Date();

  const seededContacts = [
    {
      nombre: "Juan",
      apellido: "Perez",
      empresa: "InnovaCorp S.A. de C.V.",
      email: "juan.perez@innovacorp.mx",
      origen: "outreach",
      token: "abc12345",
      fecha_evento: "2026-04-18",
      form_started_at: null,
      form_completed_at: null,
      calendly_booked_at: null,
      match_answers: null,
    },
    {
      nombre: "Maria",
      apellido: "Lopez",
      empresa: "Logistica Integral",
      email: "mlopez@logistica.com",
      origen: "organico",
      token: null,
      fecha_evento: "2026-05-07",
      form_started_at: now,
      form_completed_at: null,
      calendly_booked_at: null,
      match_answers: null,
    },
    {
      nombre: "Carlos",
      apellido: "Ruiz",
      empresa: "Soluciones Estrategicas",
      email: "c.ruiz@soluciones.mx",
      origen: "outreach",
      token: null,
      fecha_evento: "2026-06-02",
      form_started_at: now,
      form_completed_at: now,
      calendly_booked_at: null,
      match_answers: [
        "Performance comercial",
        "300+ personas",
        "Cierre anual",
        "Ventas",
        "Si, experiencia previa",
        "Energetico",
      ],
    },
    {
      nombre: "Ana",
      apellido: "Garcia",
      empresa: "Tech Solutions",
      email: "a.garcia@tech.mx",
      origen: "organico",
      token: null,
      fecha_evento: "2026-04-28",
      form_started_at: now,
      form_completed_at: now,
      calendly_booked_at: now,
      match_answers: [
        "Tecnologia y disrupcion",
        "100-300 personas",
        "Impulsar cambio",
        "Innovacion",
        "Si, varias conferencias",
        "Inspirador",
      ],
    },
  ];

  const contacts = [];
  for (const c of seededContacts) {
    const existing = await prisma.contact.findFirst({
      where: { email: c.email },
      select: { id: true },
    });

    const contactData = {
      nombre: c.nombre,
      apellido: c.apellido,
      empresa: c.empresa,
      origen: c.origen,
      token: c.token ?? undefined,
      fecha_evento: c.fecha_evento,
      match_answers: c.match_answers ?? undefined,
      form_started_at: c.form_started_at,
      form_completed_at: c.form_completed_at,
      calendly_booked_at: c.calendly_booked_at,
    };

    const contact = existing
      ? await prisma.contact.update({
          where: { id: existing.id },
          data: contactData,
          select: { id: true },
        })
      : await prisma.contact.create({
          data: { ...contactData, email: c.email },
          select: { id: true },
        });

    contacts.push(contact);
  }

  if (contacts.length > 0) {
    for (const contact of contacts) {
      for (const [index, speaker] of speakers.entries()) {
        await prisma.clientMatch.upsert({
          where: {
            client_id_speaker_id: {
              client_id: contact.id,
              speaker_id: speaker.id,
            },
          },
          update: {
            match_score: 95 - index * 7,
            top_skill:
              index === 0 ? "Innovacion" : index === 1 ? "Estrategia" : "Ciencia",
            skills_breakdown: {
              liderazgo: 8 + (2 - index),
              innovacion: 10 - index,
              ejecucion: 7 + (index % 2),
            },
          },
          create: {
            client_id: contact.id,
            speaker_id: speaker.id,
            match_score: 95 - index * 7,
            top_skill:
              index === 0 ? "Innovacion" : index === 1 ? "Estrategia" : "Ciencia",
            skills_breakdown: {
              liderazgo: 8 + (2 - index),
              innovacion: 10 - index,
              ejecucion: 7 + (index % 2),
            },
          },
        });
      }
    }
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD?.trim();
  if (adminEmail && adminPassword) {
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        active: true,
        role: "admin",
        password_hash: hashSeedPassword(adminPassword),
      },
      create: {
        email: adminEmail,
        role: "admin",
        active: true,
        password_hash: hashSeedPassword(adminPassword),
      },
    });
  }

  console.log(`Seed completado:
- ${matchSteps.length} pasos cargados
- ${speakers.length} speakers cargados
- ${contacts.length > 0 ? `matches demo actualizados (${contacts.length} contactos)` : "sin contactos para crear matches"}
- ${adminEmail && adminPassword ? "admin semilla actualizado" : "admin semilla omitido"}
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
