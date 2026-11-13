const prisma = require("./prisma");

// Festival theme the admin picks in Admin → Festival Theme. The look of each theme
// (colours, emojis, default greeting) lives in the frontend
// (src/constants/festivalThemes.js); the backend only stores which one is active.
const SETTINGS_ID = 1;
const FESTIVAL_THEMES = [
  "none",
  "diwali",
  "sankranti",
  "ugadi",
  "holi",
  "ganesh",
  "dussehra",
  "christmas",
  "newyear",
  "national",
  "eid"
];
const MAX_MESSAGE_LENGTH = 120;

const toPublic = settings => {
  const theme = settings?.festivalTheme || "none";
  const endsAt = settings?.festivalEndsAt || null;
  const expired = Boolean(endsAt && new Date(endsAt) <= new Date());
  return {
    theme, // what the admin saved
    active: theme !== "none" && !expired, // what the storefront should show right now
    message: settings?.festivalMessage || "",
    endsAt,
    recolor: settings?.festivalRecolor ?? true,
    decorations: settings?.festivalDecorations ?? true
  };
};

const getFestivalTheme = async () =>
  toPublic(await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } }));

// Validates the admin's input. Returns { data } for Prisma or { error } for a 400.
const parseFestivalInput = body => {
  const theme = String(body?.theme ?? "none").trim().toLowerCase();
  if (!FESTIVAL_THEMES.includes(theme)) return { error: "Unknown festival theme" };

  const message = String(body?.message ?? "").trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Greeting must be ${MAX_MESSAGE_LENGTH} characters or fewer` };
  }

  let endsAt = null;
  if (body?.endsAt) {
    endsAt = new Date(body.endsAt);
    if (Number.isNaN(endsAt.getTime())) return { error: "Invalid end date" };
    if (endsAt <= new Date()) return { error: "End date must be in the future" };
  }

  return {
    data: {
      festivalTheme: theme,
      festivalMessage: message,
      festivalEndsAt: theme === "none" ? null : endsAt,
      festivalRecolor: body?.recolor !== false,
      festivalDecorations: body?.decorations !== false
    }
  };
};

const saveFestivalTheme = async data =>
  toPublic(
    await prisma.storeSettings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data }
    })
  );

module.exports = { FESTIVAL_THEMES, getFestivalTheme, parseFestivalInput, saveFestivalTheme };
