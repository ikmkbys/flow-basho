'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthButton from '@/components/AuthButton';
import type { Shop } from '@/lib/types';

export default function MyShopsPage() {
  const { user, loading: authLoading } = useAuth();
  const [shops, setShops]   = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (shopId: string) => {
    if (!confirm('このお店を削除しますか？')) return;
    await deleteDoc(doc(db, 'shops', shopId));
    setShops(prev => prev.filter(s => s.id !== shopId));
  };

  return (
    <>
      <header>
        <div className="header-inner">
          <Link href="/" className="logo">🍻 FLOW BASHO</Link>
          <div style={{ marginLeft: 'auto' }}>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/" className="btn btn-ghost btn-sm">← 戻る</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>過去のお店</h1>
        </div>

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
              <div key={s.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>{s.name}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
                    <span>{s.useCount}回使用</span>
                    {s.tabelogUrl && <a href={s.tabelogUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--indigo)' }}>食べログ ↗</a>}
                    {s.mapsUrl    && <a href={s.mapsUrl}    target="_blank" rel="noopener noreferrer" style={{ color: 'var(--indigo)' }}>地図 ↗</a>}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(s.id)}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
