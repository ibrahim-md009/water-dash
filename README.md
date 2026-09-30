# لوحة تحكم حجوزات تعبئة المياه

React + Vite + Firebase (Auth + Firestore). الواجهة عربية RTL مع وضع نهاري/ليلي.
اسم المشروع يُعدَّل من مكان واحد: `src/config/app.js` (`APP_NAME`).

## التشغيل

```bash
npm install
npm run dev      # تطوير
npm run build    # بناء للنشر (مجلد dist)
```

## الإعداد لمرة واحدة في Firebase Console (مشروع `water-retention`)

1. **Firestore Database**: أنشئ قاعدة بيانات (Native mode) إن لم تكن موجودة.
2. **Authentication → Sign-in method**: فعّل *Email/Password*.
3. **Authentication → Users**: أضف مستخدمًا (بريدك + كلمة مرور) وانسخ الـ **UID** الخاص به.
4. **Firestore**: أنشئ collection باسم `admins` ووثيقة **رقمها = الـ UID** (أي حقل داخلها، مثل `role: "admin"`).
   بدون هذه الوثيقة لن يستطيع أي حساب دخول اللوحة.
5. انشر قواعد الأمان:
   ```bash
   npm i -g firebase-tools && firebase login
   firebase use water-retention
   firebase deploy --only firestore:rules
   ```
6. (اختياري) النشر: `npm run build && firebase deploy --only hosting`.

عند أول دخول تُنشأ تلقائيًا `settings/general` (20 دقيقة = 10 ₪) وطرق الدفع الثلاث.

## هيكل البيانات

| Collection | الوصف |
|---|---|
| `availability` | كل دفعة دقائق سجل مستقل: `number, totalMinutes, availableMinutes, reservedMinutes, completedMinutes, dateText, notes, status, origin` |
| `reservations` | `name, phone, minutes, price, availabilityId, dateText, receiptUrl, status` + `confirmedAt / completedAt / cancelledAt / rejectedAt` |
| `paymentMethods` | `name, logoUrl, accountName, accountNumber, enabled, order` |
| `settings/general` | `minutesPerCup, pricePerCup` |
| `settings/counters` | عدّاد ترقيم الدفعات (#001…) — للمسؤول فقط |
| `admins/{uid}` | من يحق له دخول اللوحة |

حالات الحجز: `pending → confirmed → completed` أو `rejected` (من pending) أو `cancelled` (من confirmed).

## منطق الدقائق (كله داخل Firestore Transactions في `src/services/reservations.js`)

- **طلب جديد** (`createReservation`): يخصم من `availableMinutes` ويزيد `reservedMinutes` بعد التحقق من الكفاية — طلبان متزامنان على نفس الدقائق: ينجح واحد فقط ولا يصبح الرصيد سالبًا.
- **تأكيد**: تتغير الحالة فقط، والدقائق تبقى محجوزة.
- **منجز**: تنتقل الدقائق من محجوزة إلى منجزة في نفس الدفعة، ويدخل الحجز في الإحصائيات.
- **رفض / إلغاء**: تُنقص الدقائق من الدفعة الأصلية وتُنشأ **دفعة جديدة مستقلة** بنفس العدد (لا دمج).
- السعر يُحسب دائمًا: `minutes × pricePerCup ÷ minutesPerCup`.

## للموقع الأساسي لاحقًا

- استخدم الدالة `createReservation` نفسها (أو انسخ منطقها) لإنشاء الطلبات.
- اقرأ `availability` و`paymentMethods` و`settings/general` (قراءتها مسموحة للعموم في القواعد).
- قواعد الأمان تسمح للزبون بإنشاء طلب `pending` فقط مع خصم الدقائق المطابق، ولا تسمح له بقراءة الحجوزات.
