'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Shop, Candidate } from '@/lib/types';

interface Props {
  uid: string;
  onSelect: (candidate: Omit<Candidate, 'id'>) => void;
  onClose: () => void;
}

export default function ShopPicker({ uid, onSelect, onClose }: Props) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, 'shops'),
        where('ownerUid', '==', uid),
        orderBy('lastUsedAt', 'desc'),
      );
      const snap = await getDocs(q);
      setShops(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Shop));
      setLoading(false);
    })();
  }, [uid]);

  const filtered = search.trim()
    ? shops.filter(s => s.name.includes(search.trim()))
    : shops;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column', margin: '0 20px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontWeight: 700 }}>お店ライブラリから選ぶ</p>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>
        <input
          type="text"
          placeholder="店名で検索…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 12 }}
          autoFocus
        />
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && <p style={{ color: 'var(--muted)', fontSize: 14 }}>読み込み中…</p>}
          {!loading && filtered.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {search.trim() ? '一致するお店がありません' : 'まだ履歴がありません'}
            </p>
          )}
          {filtered.map(shop => (
            <button
              key={shop.id}
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '10px 14px' }}
              onClick={() => { onSelect({ name: shop.name, tabelogUrl: shop.tabelogUrl, mapsUrl: shop.mapsUrl, note: shop.note }); onClose(); }}
            >
              <span style={{ fontWeight: 600 }}>{shop.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{shop.useCount}回使用</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
