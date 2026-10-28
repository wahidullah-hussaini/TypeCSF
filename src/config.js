/* config.js - public site settings. Values here are visible to every visitor.
   The WhatsApp number and contact e-mail can be overridden with VITE_ variables
   (see .env.example). The e-mail RECIPIENT of the suggestion form is NOT here:
   it is fixed inside the EmailJS template, so nobody can redirect it. */
const env = import.meta.env || {};

export const APP = { name: 'TypeCSF', version: '3.0.0' };

export const DEVELOPER = {
  photo: 'images/profile.jpg',
  email: env.VITE_CONTACT_EMAIL || 'wahidullahhussaini1383@gmail.com',
  /* International format, digits only (wa.me needs no plus sign or spaces). */
  whatsapp: String(env.VITE_WHATSAPP_NUMBER || '93796883671').replace(/\D/g, ''),
  whatsappDisplay: '+93796883671',
};

export const EMAILJS = {
  serviceId: env.VITE_EMAILJS_SERVICE_ID || '',
  templateId: env.VITE_EMAILJS_TEMPLATE_ID || '',
  publicKey: env.VITE_EMAILJS_PUBLIC_KEY || '',
  endpoint: 'https://api.emailjs.com/api/v1.0/email/send',
};

export function whatsappLink(text) {
  const base = 'https://wa.me/' + DEVELOPER.whatsapp;
  return text ? base + '?text=' + encodeURIComponent(text) : base;
}
