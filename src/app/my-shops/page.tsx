'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthButton from '@/components/AuthButton';
import type { Shop } from '@/lib/types';

function safeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith('https://') || url.startsWith('http://') ? url : undefined;
}

export default function MyShopsPage() {
  const { user, loading: authLoading } = useAuth();
  const [shops, setShops]   = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // 新規登録フォーム
  const [showForm, setShowForm]     = useState(false);
  const [newName, setNewName]       = useState('');
  const [newTabelog, setNewTabelog] = useState('');
  const [newMaps, setNewMaps]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [attempted, setAttempted]   = useState(false);

  // 編集
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editName, setEditName]         = useState('');
  const [editTabelog, setEditTabelog]   = useState('');
  const [editMaps, setEditMaps]         = useState('');
  const [editSaving, setEditSaving]     = useState(false);

  const fetchShops = async (uid: string) => {
    const q = query(
      collection(db, 'shops'),
      where('ownerUid', '==', uid),
      orderBy('lastUsedAt', 'desc'),
    );
    const snap = await getDocs(q);
    setShops(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Shop));
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetchShops(user.uid);
  }, [user, authLoading]);

  const startEdit = (s: Shop) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditTabelog(s.tabelogUrl ?? '');
    setEditMaps(s.mapsUrl ?? '');
  };

  const handleEdit = async (original: Shop) => {
    if (!editName.trim() || !user) return;
    setEditSaving(true);
    try {
      const newDocId = `${user.uid}_${encodeURIComponent(editName.trim())}`;
      const nameChanged = editName.trim() !== original.name;

      await setDoc(doc(db, 'shops', newDocId), {
        name: editName.trim(),
        ...(editTabelog.trim() ? { tabelogUrl: editTabelog.trim() } : {}),
        ...(editMaps.trim()    ? { mapsUrl: editMaps.trim() }        : {}),
        ownerUid:   user.uid,
        lastUsedAt: original.lastUsedAt,
        useCount:   original.useCount,
      });

      if (nameChanged) {
        await deleteDoc(doc(db, 'shops', original.id));
      }

      setEditingId(null);
      await fetchShops(user.uid);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm('このお店を削除しますか？')) return;
    await deleteDoc(doc(db, 'shops', shopId));
    setShops(prev => prev.filter(s => s.id !== shopId));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!newName.trim() || !user) return;
    setSaving(true);
    try {
      const docId = `${user.uid}_${encodeURIComponent(newName.trim())}`;
      await setDoc(doc(db, 'shops', docId), {
        name: newName.trim(),
        ...(newTabelog.trim() ? { tabelogUrl: newTabelog.trim() } : {}),
        ...(newMaps.trim()    ? { mapsUrl: newMaps.trim() }        : {}),
        ownerUid: user.uid,
        lastUsedAt: Timestamp.now(),
        useCount: 1,
      }, { merge: true });
      setNewName(''); setNewTabelog(''); setNewMaps('');
      setAttempted(false);
      setShowForm(false);
      await fetchShops(user.uid);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header>
        <div className="header-inner">
          <Link href="/" className="logo">FLOW BASHO<span>.</span></Link>
          <div style={{ marginLeft: 'auto' }}>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/" className="btn btn-ghost btn-sm">← 戻る</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>お店ライブラリ</h1>
          {user && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowForm(v => !v)}
            >
              {showForm ? '✕ キャンセル' : '＋ 新規登録'}
            </button>
          )}
        </div>

        {showForm && user && (
          <form onSubmit={handleRegister} noValidate className="card" style={{ marginBottom: 24 }}>
            <p className="section-title">お店を登録</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label>店名 <span style={{ color: 'var(--red)' }}>*</span></label>
                <input
                  type="text"
                  placeholder="例：焼き鳥 鳥一"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className={attempted && !newName.trim() ? 'input-error' : ''}
                />
                {attempted && !newName.trim() && <p className="error-msg">店名を入力してください</p>}
              </div>
              <div>
                <label>食べログURL（任意）</label>
                <input type="url" placeholder="https://tabelog.com/..." value={newTabelog} onChange={e => setNewTabelog(e.target.value)} />
              </div>
              <div>
                <label>Google MapsなどのURL（任意）</label>
                <input type="url" placeholder="https://maps.google.com/..." value={newMaps} onChange={e => setNewMaps(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} disabled={saving}>
              {saving ? '登録中…' : '登録する'}
            </button>
          </form>
        )}

        {authLoading || loading ? (
          <p style={{ color: 'var(--muted)' }}>読み込み中…</p>
        ) : !user ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16, color: 'var(--muted)' }}>Googleアカウントでログインするとお店の履歴が保存されます</p>
            <AuthButton />
          </div>
        ) : shops.length === 0 ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>まだお店の履歴がありません。</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>投票ページを作成するとここに自動で保存されます。</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shops.map(s => (
              <div key={s.id} className="card" style={{ padding: '16px 20px' }}>
                {editingId === s.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label>店名 <span style={{ color: 'var(--red)' }}>*</span></label>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <label>食べログURL（任意）</label>
                      <input type="url" placeholder="https://tabelog.com/..." value={editTabelog} onChange={e => setEditTabelog(e.target.value)} />
                    </div>
                    <div>
                      <label>Google MapsなどのURL（任意）</label>
                      <input type="url" placeholder="https://maps.google.com/..." value={editMaps} onChange={e => setEditMaps(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleEdit(s)} disabled={editSaving} style={{ justifyContent: 'center' }}>
                        {editSaving ? '保存中…' : '保存'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{s.name}</p>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
                        <span>{s.useCount}回使用</span>
                        {s.tabelogUrl && <a href={safeUrl(s.tabelogUrl)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--indigo)' }}>食べログ ↗</a>}
                        {s.mapsUrl    && <a href={safeUrl(s.mapsUrl)}    target="_blank" rel="noopener noreferrer" style={{ color: 'var(--indigo)' }}>地図 ↗</a>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}>編集</button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>削除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
