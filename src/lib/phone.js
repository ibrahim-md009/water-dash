const ARABIC_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };

/** يوحّد الرقم: أرقام لاتينية، بدون مسافات أو شرطات أو أقواس (يبقي + في البداية) */
export function normalizePhone(value) {
  const latin = String(value || '').replace(/[٠-٩۰-۹]/g, (d) => ARABIC_DIGITS[d]);
  return latin.replace(/[\s\-().]/g, '');
}

/** تحقق مرن: من 7 إلى 15 رقمًا، مع + اختيارية في البداية. يعيد رسالة الخطأ أو '' */
export function validatePhone(value) {
  const phone = normalizePhone(value);
  if (!phone) return 'أدخل رقم الهاتف.';
  if (!/^\+?\d+$/.test(phone)) return 'رقم الهاتف يجب أن يحتوي على أرقام فقط.';
  const digits = phone.replace('+', '').length;
  if (digits < 7) return 'رقم الهاتف ناقص، تأكد من إدخاله كاملًا.';
  if (digits > 15) return 'رقم الهاتف طويل جدًا، تأكد من صحته.';
  return '';
}

/**
 * الصيغة الموحّدة للرقم (أرقام فقط) — هي معرّف سجل العميل في Firestore.
 * أمثلة: +970 595-947-068 ، 00970595947068 ، 595947068  →  0595947068
 * حتى لا يتحايل أحد على الحد الأسبوعي بتغيير صيغة نفس الرقم.
 */
export function canonicalPhone(value) {
  let d = normalizePhone(value).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if ((d.startsWith('970') || d.startsWith('972')) && d.length >= 11) d = `0${d.slice(3)}`;
  else if (d.length === 9 && d.startsWith('5')) d = `0${d}`;
  return d;
}
