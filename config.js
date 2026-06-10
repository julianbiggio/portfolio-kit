/* ============================================================================
 *  CONFIGURACIÓN — editá SOLO este archivo para hacer el sitio tuyo.
 *  (El contenido del CV —experiencia, skills, etc.— está en el objeto DATA
 *   dentro de CV-interactivo.html; ver la guía "Hacé tu propia versión" en el README.)
 * ========================================================================== */
window.SITE = {
  // --- Identidad ---
  firstName: "Alex",
  lastName:  "Doe",
  initials:  "AD",                       // se usa en el favicon/título (ver nota en el README)

  // --- Rol (subtítulo del landing), bilingüe ---
  roleES: "Desarrollador Full Stack · Producto · Web",
  roleEN: "Full Stack Developer · Product · Web",

  // --- "Ancla" cuantitativa bajo el nombre, bilingüe (dejá "" para ocultarla) ---
  anchorES: "+10 años construyendo software",
  anchorEN: "10+ years building software",

  // --- Contacto y links ---
  email:    "hola@tu-dominio.com",
  linkedin: "https://www.linkedin.com/in/tu-usuario",
  featured: "https://www.linkedin.com/in/tu-usuario",                      // botón "Referencias"
  siteUrl:  "https://tu-dominio.com",                                      // se usa para el QR y compartir

  // --- vCard (lo que se guarda en los contactos) ---
  vcardTitle: "Full Stack Developer",                                      // tu puesto

  // --- Saludo del mini-chat, bilingüe ---
  chatGreetES: "¡Hola! Soy Alex 👋 ¿Qué querés saber?",
  chatGreetEN: "Hi! I'm Alex 👋 What would you like to know?",

  // --- Nombre base para el archivo de CV descargable (sin espacios) ---
  fileBase: "CV-AlexDoe",

  // --- Crédito al template en el footer; podés ponerlo en false ---
  showCredit: true,

  get fullName(){ return this.firstName + " " + this.lastName; }
};
