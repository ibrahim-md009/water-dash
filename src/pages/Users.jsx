import { useMemo, useState } from "react";
import { Loader2, Save, Trash2, Users as UsersIcon } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { deleteUser, updateWeeklyLimit } from "../services/users";
import { toArabicError } from "../lib/errors";
import { formatDateTime } from "../lib/format";
import { weekIndex } from "../lib/week";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

/** عدد حجوزات المستخدم في الأسبوع الحالي — من العدّاد اللي الموقع بيحدّثه مع كل حجز */
function usedThisWeek(user, week) {
  return user.bookingWeek === week ? Number(user.bookingCount) || 0 : 0;
}

function isValidLimit(value) {
  if (value === "" || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 10;
}

function UserRow({ user, used, saving, draft, onDraft, onSave, onDelete }) {
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
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-danger-ghost"
          disabled={saving}
          onClick={onDelete}
          aria-label={`حذف المستخدم ${user.name || ""}`}
          title="حذف المستخدم"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

export default function Users() {
  const { users, loading, error } = useData();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({}); // { [userId]: string }
  const [savingId, setSavingId] = useState("");
  const [deleting, setDeleting] = useState(null); // المستخدم المطلوب حذفه
  const [deleteBusy, setDeleteBusy] = useState(false);

  // الأسبوع الحالي (يتحدّث مع كل تغيّر في بيانات المستخدمين)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const week = useMemo(() => weekIndex(), [users]);

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

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteUser(deleting.id);
      toast.success(`تم حذف ${deleting.name || "المستخدم"}.`);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
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
              used={usedThisWeek(u, week)}
              saving={savingId === u.id}
              draft={drafts[u.id] ?? String(u.weeklyBookingLimit ?? 1)}
              onDraft={(v) => setDraft(u.id, v)}
              onSave={() => save(u)}
              onDelete={() => setDeleting(u)}
            />
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!deleting}
        title="حذف المستخدم"
        message={
          deleting
            ? `هل أنت متأكد من حذف ${deleting.name || "هذا المستخدم"} (${deleting.phone || "—"})؟ حجوزاته السابقة لن تتأثر، وبإمكانه التسجيل من جديد بنفس الرقم.`
            : ""
        }
        confirmLabel="نعم، احذفه"
        danger
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
