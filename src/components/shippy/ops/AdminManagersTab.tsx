import { useCallback, useEffect, useState } from "react";
import { Copy, Mail, Pencil, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { MANAGER_ROLES, type ManagerRole, type ManagerStatus } from "@/data/admin";
import {
  opsDeleteManager,
  opsManagers,
  opsResetManagerPassword,
  opsSaveManager,
  opsSendBroadcast,
} from "@/lib/shippy-admin.functions";
import {
  AdminCard,
  AdminField,
  AdminModal,
  AdminNotice,
  EmptyState,
  LoadingBlock,
  StatusPill,
  adminBtn,
  adminBtnDanger,
  adminBtnGhost,
  adminInput,
} from "./admin-ui";

type Managers = Awaited<ReturnType<typeof opsManagers>>;
type Manager = Managers[number];

type ManagerForm = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: ManagerRole;
  status: ManagerStatus;
  password: string;
};

const emptyForm = (): ManagerForm => ({
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "Admin",
  status: "active",
  password: "",
});

export function AdminManagersTab({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [managers, setManagers] = useState<Managers | null>(null);
  const [form, setForm] = useState<ManagerForm | null>(null);
  const [resetTarget, setResetTarget] = useState<Manager | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);
  const [emailTarget, setEmailTarget] = useState<Manager | null>(null);
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });
  const [tempPassword, setTempPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await opsManagers({ data: { token } });
      setManagers(data);
    } catch {
      onExpired();
    }
  }, [token, onExpired]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!managers) return <LoadingBlock label="Loading administrators…" />;

  const openAdd = () => {
    setForm(emptyForm());
    setNotice("");
    setError("");
  };

  const openEdit = (manager: Manager) => {
    setForm({
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      phone: manager.phone,
      role: manager.role,
      status: manager.status,
      password: "",
    });
    setNotice("");
    setError("");
  };

  const saveManager = async () => {
    if (!form) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await opsSaveManager({
        data: {
          token,
          id: form.id || undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          status: form.status,
          password: form.password || undefined,
        },
      });
      setManagers(result.managers);
      setNotice(form.id ? "Manager updated." : "Manager added.");
      setForm(null);
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (manager: Manager) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await opsSaveManager({
        data: {
          token,
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
          phone: manager.phone,
          role: manager.role,
          status: manager.status === "active" ? "blocked" : "active",
        },
      });
      setManagers(result.managers);
      setNotice(manager.status === "active" ? "Manager blocked." : "Manager reactivated.");
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await opsResetManagerPassword({ data: { token, id: resetTarget.id } });
      setTempPassword(result.password);
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const removeManager = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await opsDeleteManager({ data: { token, id: deleteTarget.id } });
      setManagers(result.managers);
      setNotice("Manager deleted.");
      setDeleteTarget(null);
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const sendEmail = async () => {
    if (!emailTarget) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await opsSendBroadcast({
        data: {
          token,
          recipients: [emailTarget.email],
          subject: emailForm.subject,
          greeting: `Hello ${emailTarget.firstName},`,
          message: emailForm.message,
        },
      });
      setNotice(
        `Email queued for ${emailTarget.email}: ${result.sent} sent, ${result.queued} queued, ${result.failed} failed.`,
      );
      setEmailTarget(null);
      setEmailForm({ subject: "", message: "" });
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Managers list</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add administrators, control access and reset passwords.
          </p>
        </div>
        <button type="button" onClick={openAdd} className={adminBtn}>
          <Plus className="h-4 w-4" /> Add manager
        </button>
      </div>

      {notice && <AdminNotice tone="success">{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}
      {tempPassword && (
        <AdminNotice tone="info">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Temporary password: <strong className="font-mono">{tempPassword}</strong>
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(tempPassword)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        </AdminNotice>
      )}

      <AdminCard>
        {managers.length === 0 ? (
          <EmptyState title="No administrators yet" description="Add your first manager." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">User ID</th>
                  <th className="pb-2">Firstname</th>
                  <th className="pb-2">Lastname</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {managers.map((manager, index) => (
                  <tr key={manager.id}>
                    <td className="py-3 pr-3 text-slate-500">{index + 1}</td>
                    <td className="py-3 pr-3 font-semibold text-slate-900">{manager.firstName}</td>
                    <td className="py-3 pr-3 text-slate-700">{manager.lastName}</td>
                    <td className="py-3 pr-3 text-slate-600">{manager.email}</td>
                    <td className="py-3 pr-3 text-slate-600">{manager.phone || "—"}</td>
                    <td className="py-3 pr-3 text-slate-600">{manager.role}</td>
                    <td className="py-3 pr-3">
                      <StatusPill status={manager.status} />
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(manager)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(manager)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {manager.status === "active" ? "Block" : "Unblock"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTarget(manager);
                            setTempPassword("");
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailTarget(manager);
                            setEmailForm({ subject: "", message: "" });
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(manager)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminModal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit manager" : "Add manager"}
        description="Managers can sign in to this console with their email and password."
        wide
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Firstname">
              <input
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Lastname">
              <input
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Phone number">
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Type">
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value as ManagerRole })}
                className={adminInput}
              >
                {MANAGER_ROLES.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Status">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as ManagerStatus })
                }
                className={adminInput}
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </AdminField>
            <AdminField
              label={form.id ? "New password (optional)" : "Password"}
              hint="At least 6 characters."
              className="sm:col-span-2"
            >
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder={form.id ? "Leave blank to keep current password" : "Password"}
                className={adminInput}
              />
            </AdminField>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setForm(null)} className={adminBtnGhost}>
                Cancel
              </button>
              <button type="button" onClick={saveManager} disabled={busy} className={adminBtn}>
                {busy ? "Saving…" : "Save manager"}
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(resetTarget)}
        onClose={() => {
          setResetTarget(null);
          setTempPassword("");
        }}
        title="Reset password"
        description={
          resetTarget
            ? `Reset the password for ${resetTarget.firstName} ${resetTarget.lastName}?`
            : undefined
        }
      >
        <div className="space-y-4">
          {tempPassword ? (
            <AdminNotice tone="info">
              Temporary password: <strong className="font-mono">{tempPassword}</strong>
            </AdminNotice>
          ) : (
            <p className="text-sm text-slate-600">
              A new temporary password will be generated. Share it with the manager and ask them to
              change it after signing in.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setTempPassword("");
              }}
              className={adminBtnGhost}
            >
              Close
            </button>
            {!tempPassword && (
              <button type="button" onClick={resetPassword} disabled={busy} className={adminBtn}>
                <RotateCcw className="h-4 w-4" /> {busy ? "Resetting…" : "Reset password"}
              </button>
            )}
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete manager"
        description="This removes the manager's access to the console."
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Delete{" "}
              <span className="font-semibold text-slate-900">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>{" "}
              ({deleteTarget.email})?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className={adminBtnGhost}>
                Cancel
              </button>
              <button
                type="button"
                onClick={removeManager}
                disabled={busy}
                className={adminBtnDanger}
              >
                <Trash2 className="h-4 w-4" /> {busy ? "Deleting…" : "Delete manager"}
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(emailTarget)}
        onClose={() => setEmailTarget(null)}
        title="Send email message"
        description={emailTarget ? `This message will be sent to ${emailTarget.email}.` : undefined}
      >
        {emailTarget && (
          <div className="space-y-4">
            <AdminField label="Subject">
              <input
                value={emailForm.subject}
                onChange={(event) => setEmailForm({ ...emailForm, subject: event.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Message">
              <textarea
                value={emailForm.message}
                onChange={(event) => setEmailForm({ ...emailForm, message: event.target.value })}
                rows={5}
                className={adminInput}
              />
            </AdminField>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEmailTarget(null)} className={adminBtnGhost}>
                Cancel
              </button>
              <button type="button" onClick={sendEmail} disabled={busy} className={adminBtn}>
                <Mail className="h-4 w-4" /> {busy ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
