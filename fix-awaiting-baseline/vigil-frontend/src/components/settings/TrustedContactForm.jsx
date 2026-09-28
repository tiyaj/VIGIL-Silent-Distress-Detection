import React, { useState } from 'react';
import { useCall } from '../../context/CallContext';
import { UserCheck, Check, Pencil, Trash2, Plus, X } from 'lucide-react';

const EMPTY = {
  name: '',
  phone: '',
  relationship: 'Family Member',
  autoSms: true,
  pushNotification: true,
};

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition';
const labelCls = 'block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5';

export const TrustedContactForm = () => {
  const { contacts, primaryContactId, addContact, updateContact, removeContact, setPrimaryContact } = useCall();

  const [formData, setFormData] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [makePrimary, setMakePrimary] = useState(false);
  const [message, setMessage] = useState(null);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const resetForm = () => {
    setFormData(EMPTY);
    setEditingId(null);
    setMakePrimary(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = editingId ? await updateContact(editingId, formData) : await addContact(formData, makePrimary);
    if (!res.ok) {
      flash('error', res.error);
      return;
    }
    flash('ok', editingId ? 'Contact updated.' : 'Contact added. Your previous contacts are unchanged.');
    resetForm();
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      phone: c.phone,
      relationship: c.relationship,
      autoSms: c.autoSms,
      pushNotification: c.pushNotification,
    });
  };

  const handleRemove = (c) => {
    const res = removeContact(c.id);
    if (!res.ok) {
      flash('error', res.error);
      return;
    }
    if (editingId === c.id) resetForm();
    flash('ok', `${c.name} removed.`);
  };

  const handleMakePrimary = async (c) => {
    await setPrimaryContact(c);
    flash('ok', `${c.name} will now receive distress alerts.`);
  };

  return (
    <div className="vigil-form-sheet">
      <div className="flex items-center gap-2 mb-2">
        <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Contacts</h3>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
        Everyone you add stays in this list and appears on the Start page. One contact is the alert recipient and gets the silent distress notification; the rest are people you can call.
      </p>

      <ul className="vigil-contactbook">
        {contacts.map((c) => {
          const isPrimary = c.id === primaryContactId;
          return (
            <li key={c.id} className={`vigil-contactbook__row ${isPrimary ? 'is-primary' : ''}`}>
              <div className="vigil-contactbook__who">
                <strong>{c.name}</strong>
                <small>{c.phone} · {c.relationship}</small>
              </div>
              {isPrimary ? (
                <span className="vigil-contactbook__badge">ALERT RECIPIENT</span>
              ) : (
                <button type="button" className="vigil-contactbook__link" onClick={() => handleMakePrimary(c)}>
                  Make recipient
                </button>
              )}
              <div className="vigil-contactbook__actions">
                <button type="button" onClick={() => startEdit(c)} aria-label={`Edit ${c.name}`} title="Edit">
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => handleRemove(c)}
                  aria-label={`Remove ${c.name}`}
                  title={isPrimary ? 'Make another contact the recipient before removing' : 'Remove'}
                  disabled={isPrimary}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h4 className="vigil-contactbook__formtitle">
            {editingId ? <Pencil size={14} /> : <Plus size={14} />}
            {editingId ? 'Edit contact' : 'Add a contact'}
          </h4>
          {editingId && (
            <button type="button" className="vigil-contactbook__link" onClick={resetForm}>
              <X size={13} style={{ verticalAlign: '-2px' }} /> Cancel edit
            </button>
          )}
        </div>

        <div>
          <label className={labelCls}>Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputCls}
            placeholder="e.g. Rahul Verma"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Phone / SMS Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`${inputCls} font-mono`}
            placeholder="+91 98765 00000"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Relationship / Affiliation</label>
          <select
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            className={inputCls}
          >
            <option value="Family Member">Family Member</option>
            <option value="Colleague / Coworker">Colleague / Coworker</option>
            <option value="Designated Support Advocate">Designated Support Advocate</option>
            <option value="Campus Security Liaison">Campus Security Liaison</option>
          </select>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.autoSms}
              onChange={(e) => setFormData({ ...formData, autoSms: e.target.checked })}
              className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
            />
            <span>Send automated silent SMS alert upon critical distress</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.pushNotification}
              onChange={(e) => setFormData({ ...formData, pushNotification: e.target.checked })}
              className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
            />
            <span>Include encrypted link to live explainability dashboard</span>
          </label>

          {!editingId && contacts.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={makePrimary}
                onChange={(e) => setMakePrimary(e.target.checked)}
                className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
              />
              <span>Make this contact the alert recipient (replaces the current one)</span>
            </label>
          )}
        </div>

        <div className="pt-3 flex items-center justify-between">
          <button
            type="submit"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {editingId ? 'Save changes' : 'Add contact'}
          </button>

          {message && (
            <span
              role="status"
              className={`text-[11px] font-mono font-medium ${
                message.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};