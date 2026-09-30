/** خطأ متوقع برسالة عربية جاهزة للعرض */
export class AppError extends Error {
  constructor(message, code = 'app-error') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

const CODE_MESSAGES = {
  // Firestore
  'permission-denied': 'ليست لديك صلاحية لتنفيذ هذه العملية.',
  unavailable: 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مجددًا.',
  'deadline-exceeded': 'استغرقت العملية وقتًا طويلًا. حاول مرة أخرى.',
  aborted: 'تعارضت العملية مع عملية أخرى. حاول مرة أخرى.',
  'resource-exhausted': 'تم تجاوز حد الاستخدام مؤقتًا. حاول لاحقًا.',
  'failed-precondition': 'تعذر تنفيذ العملية في الوضع الحالي.',
  // Auth
  'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/wrong-password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/user-not-found': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
  'auth/user-disabled': 'هذا الحساب معطّل.',
  'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.',
  'auth/network-request-failed': 'تعذر الاتصال بالإنترنت. حاول مجددًا.',
};

/** يحوّل أي خطأ إلى رسالة عربية مفهومة */
export function toArabicError(err) {
  if (err instanceof AppError) return err.message;
  const code = err?.code;
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  if (code && typeof code === 'string' && code.includes('/')) {
    const short = code.split('/')[1];
    if (CODE_MESSAGES[short]) return CODE_MESSAGES[short];
  }
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}
