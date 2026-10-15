import { useState } from 'react';
import { User, MenuPermissionItem } from '../types';
import { ALL_MENU_PERMISSIONS, ALL_MENU_IDS, CASHIER_DEFAULT_MENU_IDS } from '../data/defaultData';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Shield,
  UserCheck,
  CheckSquare,
  Square,
  Lock,
  Layers,
  Sparkles,
  ShoppingBag,
  Package,
  FileText
} from 'lucide-react';

interface UsersViewProps {
  users: User[];
  currentUser: User;
  onSaveUser: (user: User) => void;
  onDeleteUser: (username: string) => void;
}

export function UsersView({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser
}: UsersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'kasir'>('kasir');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(CASHIER_DEFAULT_MENU_IDS);

  const handleOpenAdd = () => {
    setEditingUsername(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('kasir');
    setSelectedPermissions(CASHIER_DEFAULT_MENU_IDS);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUsername(u.username);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password);
    setRole(u.role);
    setSelectedPermissions(
      u.permissions && u.permissions.length > 0
        ? u.permissions
        : u.role === 'admin'
        ? ALL_MENU_IDS
        : CASHIER_DEFAULT_MENU_IDS
    );
    setIsModalOpen(true);
  };

  const handleTogglePermission = (menuId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleRoleChange = (newRole: 'admin' | 'kasir') => {
    setRole(newRole);
    if (newRole === 'admin') {
      setSelectedPermissions(ALL_MENU_IDS);
    } else if (newRole === 'kasir' && selectedPermissions.length === ALL_MENU_IDS.length) {
      setSelectedPermissions(CASHIER_DEFAULT_MENU_IDS);
    }
  };

  // Presets
  const applyPresetAll = () => setSelectedPermissions(ALL_MENU_IDS);
  const applyPresetCashier = () => setSelectedPermissions(CASHIER_DEFAULT_MENU_IDS);
  const applyPresetInventory = () => setSelectedPermissions(['dashboard', 'pos', 'products', 'purchases', 'suppliers']);
  const applyPresetReports = () => setSelectedPermissions(['dashboard', 'pos', 'reports', 'modal']);
  const applyPresetClear = () => setSelectedPermissions([]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      alert('Username tidak boleh kosong.');
      return;
    }

    if (!editingUsername && users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      alert('Username sudah terpakai oleh pengguna lain.');
      return;
    }

    if (selectedPermissions.length === 0) {
      alert('Harap pilih minimal 1 menu yang diizinkan untuk pengguna ini.');
      return;
    }

    onSaveUser({
      name: name.trim() || username.trim(),
      username: cleanUsername,
      password: password.trim() || '123456',
      role,
      permissions: selectedPermissions
    });

    setIsModalOpen(false);
  };

  // Group permissions by category
  const categories: { key: MenuPermissionItem['category']; title: string }[] = [
    { key: 'operasional', title: '1. Menu Operasional Toko' },
    { key: 'manajemen', title: '2. Menu Manajemen & Persediaan Barang' },
    { key: 'pengaturan', title: '3. Menu Pengaturan & Sistem' }
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            Manajemen Pengguna &amp; Batasan Hak Akses Menu
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Admin bebas menentukan menu apa saja yang boleh dibuka oleh kasir atau staf toko.
            Setiap pengguna dapat diberikan kombinasi hak akses menu yang berbeda-beda sesuai tanggung jawabnya.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          + Tambah Pengguna &amp; Atur Akses
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Nama Lengkap</th>
                <th className="py-3 px-3 font-semibold">Username</th>
                <th className="py-3 px-3 font-semibold">Role</th>
                <th className="py-3 px-3 font-semibold">Hak Akses Menu yang Diizinkan</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => {
                const userPerms =
                  u.permissions && u.permissions.length > 0
                    ? u.permissions
                    : u.role === 'admin'
                    ? ALL_MENU_IDS
                    : CASHIER_DEFAULT_MENU_IDS;

                const isFullAccess = userPerms.length === ALL_MENU_IDS.length;
                const isCurrent = currentUser.username === u.username;

                // Labels of permitted menus
                const permLabels = ALL_MENU_PERMISSIONS.filter((m) =>
                  userPerms.includes(m.id)
                ).map((m) => m.label);

                return (
                  <tr key={u.username} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-bold">
                            (Anda)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{u.username}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-400/15 text-amber-300'
                            : 'bg-sky-400/15 text-sky-300'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                              isFullAccess
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-slate-800 text-amber-300 border border-slate-700'
                            }`}
                          >
                            {isFullAccess
                              ? 'Akses Penuh (13 Menu)'
                              : `${userPerms.length} Menu Diizinkan`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 max-w-md truncate">
                          {permLabels.join(', ')}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Edit Pengguna & Batasan Akses"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {u.username !== 'admin' && !isCurrent ? (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus pengguna "${u.name}" (${u.username})?`)) {
                                onDeleteUser(u.username);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="p-1.5 text-slate-700" title="Akun utama tidak dapat dihapus">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengguna & Custom Menu Permissions */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                {editingUsername ? `Edit Hak Akses: ${username}` : 'Tambah Pengguna & Konfigurasi Hak Akses'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
              {/* Account Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Kasir Rahma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUsername}
                    placeholder="rahma123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipe Akun (Role Dasar)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'kasir')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-medium"
                  >
                    <option value="kasir">Kasir / Karyawan (Akses Sesuai Pilihan di Bawah)</option>
                    <option value="admin">Administrator (Pemilik Toko)</option>
                  </select>
                </div>
              </div>

              {/* SECTION: GRANULAR MENU PERMISSIONS SELECTION */}
              <div className="rounded-xl border border-amber-500/30 bg-slate-950/70 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-amber-400" />
                      Atur Batasan Akses Menu ({selectedPermissions.length} dari {ALL_MENU_IDS.length} Menu Dipilih)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Centang menu apa saja yang diizinkan untuk dibuka oleh akun ini saat login.
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={applyPresetAll}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10.5px] font-semibold text-emerald-400 transition-colors"
                      title="Berikan semua menu"
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={applyPresetCashier}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10.5px] font-semibold text-sky-300 transition-colors"
                      title="Hanya Kasir POS & Dashboard"
                    >
                      Kasir Standar
                    </button>
                    <button
                      type="button"
                      onClick={applyPresetInventory}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10.5px] font-semibold text-amber-300 transition-colors"
                      title="Kasir + Manajemen Stok & Restock"
                    >
                      Kasir + Stok
                    </button>
                    <button
                      type="button"
                      onClick={applyPresetReports}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10.5px] font-semibold text-purple-300 transition-colors"
                      title="Kasir + Laporan Penjualan"
                    >
                      Kasir + Laporan
                    </button>
                    <button
                      type="button"
                      onClick={applyPresetClear}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10.5px] font-semibold text-red-400 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Categorized Checkbox Matrix */}
                <div className="space-y-3 pt-1">
                  {categories.map((cat) => {
                    const catItems = ALL_MENU_PERMISSIONS.filter((m) => m.category === cat.key);
                    return (
                      <div key={cat.key} className="space-y-1.5">
                        <div className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">
                          {cat.title}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catItems.map((menu) => {
                            const isChecked = selectedPermissions.includes(menu.id);
                            return (
                              <label
                                key={menu.id}
                                onClick={() => handleTogglePermission(menu.id)}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none text-xs ${
                                  isChecked
                                    ? 'bg-amber-400/10 border-amber-500/40 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                                }`}
                              >
                                <span className="mt-0.5 text-amber-400 shrink-0">
                                  {isChecked ? (
                                    <CheckSquare className="h-4 w-4" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-600" />
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-xs leading-tight">
                                    {menu.label}
                                  </div>
                                  <div className="text-[10px] text-slate-400 leading-normal mt-0.5 truncate">
                                    {menu.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95"
                >
                  {editingUsername ? 'Simpan Perubahan Hak Akses' : 'Buat Pengguna Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
