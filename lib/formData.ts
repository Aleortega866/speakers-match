export interface MatchStep {
  id: number;
  question: string;
  options: string[];
  columns?: 1 | 2;
}

export const matchSteps: MatchStep[] = [
  {
    id: 1,
    question: "¿Cuál describe mejor la intención principal del evento?",
    options: [
      "Inspirar y motivar al equipo",
      "Alinear estrategia y cultura. Iniciar un proceso de cambio",
      "Desarrollar habilidades (liderazgo, innovación, etc.)",
      "Conectar emocionalmente al equipo. Crisis",
      "Cerrar un ciclo o celebrar resultados",
    ],
    columns: 1,
  },
  {
    id: 2,
    question: "¿Cómo describirías a tu audiencia principal?",
    options: [
      "Directivos / tomadores de decisión",
      "Mandos medios / líderes operativos",
      "Equipos jóvenes o multiculturales",
      "Áreas técnicas / ingeniería",
      "Equipos comerciales o de ventas",
      "Audiencia mezclada",
    ],
    columns: 1,
  },
  {
    id: 3,
    question: "¿Qué energía te gustaría que dejara el speaker?",
    options: [
      "Inspiración y actitud positiva",
      "Experiencia técnica y profunda",
      "Reflexión profunda",
      "Humor inteligente",
      "Conservador (seguro y corporativo)",
      "Disruptivo (provoca cambio inmediato e irreverente)",
    ],
    columns: 1,
  },
  {
    id: 4,
    question: "¿En qué tema quieres que el speaker haga énfasis?",
    options: [
      "Liderazgo",
      "Motivación y bienestar",
      "Innovación / tecnología",
      "Diversidad e inclusión",
      "Cultura organizacional",
      "Futuro, tendencias y disrupción",
      "Alta dirección y estrategia",
      "Ventas / performance",
    ],
    columns: 2,
  },
  {
    id: 5,
    question: "¿Tienes preferencia por alguna categoría en particular?",
    options: [
      "Negocios, Management y Ventas",
      "Innovación y Creatividad",
      "Celebridades, Arte y Cultura",
      "Motivación e Inspiración",
      "Medio Ambiente",
      "RRHH y Liderazgo",
      "Economía y Finanzas",
      "Sociedad y Educación",
      "Futuro y Tecnología",
      "Deportes",
      "Política y Gobierno",
      "Noticias y Medios",
    ],
    columns: 2,
  },
];

export const socialProofLogos = [
  { name: "BBVA" },
  { name: "Nissan" },
  { name: "Quálitas" },
  { name: "Ingredion" },
  { name: "KPMG" },
];
