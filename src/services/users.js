import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS } from "../config/app";
import { AppError } from "../lib/errors";

/**
 * تحديث الحد الأسبوعي للحجوزات لمستخدم معين.
 * الحقل: users/{uid}.weeklyBookingLimit (0 = لا يسمح له بالحجز إطلاقًا).
 *
 * شكل وثيقة المستخدم: { name, phone, role, weeklyBookingLimit, createdAt }
 * (لا توجد كلمة مرور هنا — هي محفوظة في Firebase Auth فقط).
 */
export async function updateWeeklyLimit(userId, limit) {
  if (!userId) {
    throw new AppError("مستخدم غير معروف.");
  }
  // نرفض القيمة الفاضية صراحةً، لأن Number('') = 0 وكانت هتقفل الحجز على المستخدم بالغلط
  if (limit === "" || limit === null || limit === undefined) {
    throw new AppError("اكتب الحد الأسبوعي أولًا.");
  }
  const n = Number(limit);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    throw new AppError("الحد الأسبوعي يجب أن يكون رقمًا صحيحًا بين 0 و 10.");
  }
  await updateDoc(doc(db, COLLECTIONS.users, userId), { weeklyBookingLimit: n });
}

/**
 * حذف وثيقة المستخدم من Firestore (يختفي من القائمة).
 * ملاحظة: حساب الدخول نفسه في Firebase Authentication لا يمكن حذفه من المتصفح،
 * فلو المستخدم سجّل بنفس الرقم مرة تانية بيرجع للقائمة كمستخدم جديد.
 * الحجوزات السابقة لا تُمس.
 */
export async function deleteUser(userId) {
  if (!userId) {
    throw new AppError("مستخدم غير معروف.");
  }
  await deleteDoc(doc(db, COLLECTIONS.users, userId));
}
