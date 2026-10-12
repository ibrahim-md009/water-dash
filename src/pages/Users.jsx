import { useMemo, useState } from "react";
import { Loader2, Save, Users as UsersIcon } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { updateWeeklyLimit } from "../services/users";
import { toArabicError } from "../lib/errors";
import { formatDateTime, toDate } from "../lib/format";
import { WEEK_START_DAY } from "../config/app";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

/** بداية الأسبوع الحالي (حسب WEEK_START_DAY من الإعدادات) */
function startOfWeek(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = (d.getDay() - WEEK_START_DAY + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/** أرقام فقط، وآخر 9 أرقام عشان نتجاوز اختلاف كود الدولة (+20 / 0 ...) */
function phoneKey(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}

/** عدد حجوزات المستخدم في الأسبوع الحالي — المطابقة برقم الهاتف */
function weeklyCount(user, reservations, weekStart) {
  const key = phoneKey(user.phone);
  if (!key) return 0;
  return reservations.filter((r) => {
    if (phoneKey(r.phone) !== key) return false;
    const d = toDate(r.createdAt);
    return d && d >= weekStart;
  }).length;
}

function isValidLimit(value) {
  if (value === "" || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 10;
}

function UserRow({ user, used, saving, draft, onDraft, onSave }) {
  const savedLimit = user.weeklyBookingLimit ?? 1;
  const valid = isValidLimit(draft);
  const unchanged = valid && Number(draft) === savedLimit;

  return (
    <li>
      <div className="row-main">
        <strong>{user.name || "بدون اسم"}</strong>
        <small dir="ltr">{user.phone || "—"}</small>
        <small>مسجل: {formatDateTime(user.createdAt)}</small>
      </div>
      <div className="row-side">
        {/* الشارة بتعتمد على الحد المحفوظ فعلًا مش على القيمة اللي بتتكتب */}
        <span className={`badge ${savedLimit > 0 && used >= savedLimit ? "badge-warning" : "badge-success"}`}>
          {used} / {savedLimit} هذا الأسبوع
        </span>
        <div className="field" style={{ margin: 0 }}>
          <input
            type="number"
            className="input"
            min={0}
            max={10}
            step={1}
            value={draft}
            disabled={saving}
            onChange={(e) => onDraft(e.target.value)}
            aria-label={`الحد الأسبوعي لـ ${user.name || "المستخدم"}`}
            aria-invalid={!valid}
            style={{ width: "5.5rem", textAlign: "center" }}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={saving || !valid || unchanged}
          onClick={onSave}
        >
          {saving ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          حفظ
        </button>
      </div>
    </li>
  );
}

export default function Users() {
  const { users, reservations, loading, error } = useData();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({}); // { [userId]: string }
  const [savingId, setSavingId] = useState("");

  // بيتحسب من جديد لما قائمة الحجوزات تتغير، فما يفضلش قديم لو الصفحة مفتوحة من أسبوع
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const weekStart = useMemo(() => startOfWeek(), [reservations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    const qDigits = q.replace(/\D/g, "");
    return users.filter((u) => {
      const nameMatch = (u.name || "").toLowerCase().includes(q);
      const phoneMatch =
        qDigits &&
        String(u.phone || "")
          .replace(/\D/g, "")
          .includes(qDigits);
      return nameMatch || phoneMatch;
    });
  }, [users, query]);

  const setDraft = (id, value) => setDrafts((d) => ({ ...d, [id]: value }));

  const save = async (user) => {
    setSavingId(user.id);
    try {
      await updateWeeklyLimit(user.id, drafts[user.id]);
      // نمسح المسودة عشان الحقل يرجع يعرض القيمة المحفوظة الجاية من Firestore
      setDrafts((d) => {
        const { [user.id]: _removed, ...rest } = d;
        return rest;
      });
      toast.success(`تم تحديث حد ${user.name || "المستخدم"} الأسبوعي.`);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setSavingId("");
    }
  };

  if (loading) return <LoadingState fullscreen />;
  if (error) return <ErrorState message={error} />;

  return (
    <section className="stack">
      <div className="panel-head">
        <h2>
          <UsersIcon size={20} aria-hidden="true" /> المستخدمون ({users.length})
        </h2>
        <div className="toolbar-actions">
          <div className="field" style={{ margin: 0 }}>
            <input
              type="search"
              className="input"
              placeholder="بحث بالاسم أو الهاتف..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="بحث في المستخدمين"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={query ? "لا نتائج مطابقة للبحث" : "لا يوجد مستخدمون مسجلون بعد"}
          text={query ? "جرّب كلمة بحث مختلفة." : "سيظهر هنا كل من يسجل من الموقع فورًا."}
        />
      ) : (
        <ul className="row-list">
          {filtered.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              used={weeklyCount(u, reservations, weekStart)}
              saving={savingId === u.id}
              draft={drafts[u.id] ?? String(u.weeklyBookingLimit ?? 1)}
              onDraft={(v) => setDraft(u.id, v)}
              onSave={() => save(u)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
