'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import AuthButton from '@/components/AuthButton';
import ShopPicker from '@/components/ShopPicker';
import type { Candidate } from '@/lib/types';

type CandidateForm = Omit<Candidate, 'id'> & { _id: string };

let _idCounter = 0;
function newId() { return `c_${++_idCounter}_${Date.now()}`; }

function emptyCandidate(): CandidateForm {
  return { _id: newId(), name: '', tabelogUrl: '', mapsUrl: '' };
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle]           = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [deadline, setDeadline]     = useState('');
  const [candidates, setCandidates] = useState<CandidateForm[]>([emptyCandidate(), emptyCandidate()]);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted]   = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const updateCandidate = useCallback((id: string, field: keyof Omit<Candidate, 'id'>, value: string) => {
    setCandidates(prev => prev.map(c => c._id === id ? { ...c, [field]: value } : c));
  }, []);

  const addCandidate = useCallback(() => {
    setCandidates(prev => [...prev, emptyCandidate()]);
  }, []);

  const removeCandidate = useCallback((id: string) => {
    setCandidates(prev => prev.filter(c => c._id !== id));
  }, []);

  const handlePickerSelect = useCallback((partial: Omit<Candidate, 'id'>) => {
    setCandidates(prev => [...prev, { _id: newId(), ...partial }]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    const validCandidates = candidates.filter(c => c.name.trim());
    if (!title.trim() || !creatorName.trim() || validCandidates.length < 1) return;

    setSubmitting(true);
    try {
      const candidatesData: Candidate[] = validCandidates.map(c => ({
        id: c._id,
        name: c.name.trim(),
        ...(c.tabelogUrl?.trim() ? { tabelogUrl: c.tabelogUrl.trim() } : {}),
        ...(c.mapsUrl?.trim()    ? { mapsUrl: c.mapsUrl.trim() }        : {}),
      }));

      const ref = await addDoc(collection(db, 'basho'), {
        title: title.trim(),
        creatorName: creatorName.trim(),
        ...(user ? { creatorUid: user.uid } : {}),
        ...(deadline ? { deadline } : {}),
        createdAt: Timestamp.now(),
        candidates: candidatesData,
      });

      // 幹事ログイン時：使ったお店をshopsコレクションに保存・更新
      if (user) {
        await Promise.all(
          candidatesData.map(c =>
            setDoc(
              doc(db, 'shops', `${user.uid}_${encodeURIComponent(c.name)}`),
              {
                name: c.name,
                ...(c.tabelogUrl ? { tabelogUrl: c.tabelogUrl } : {}),
                ...(c.mapsUrl    ? { mapsUrl: c.mapsUrl }        : {}),
                ownerUid:    user.uid,
                lastUsedAt:  Timestamp.now(),
                useCount:    1,
              },
              { merge: true },
            ),
          ),
        );
      }

      // 作成履歴をlocalStorageに保存
      const history = storage.getHistory();
      storage.setHistory([{ id: ref.id, title: title.trim(), createdAt: Date.now() }, ...history.slice(0, 19)]);

      router.push(`/${ref.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const titleError    = attempted && !title.trim();
  const nameError     = attempted && !creatorName.trim();
  const noShopsError  = attempted && candidates.filter(c => c.name.trim()).length < 1;

  return (
    <>
      <header>
        <div className="header-inner">
          <span className="logo">🍻 FLOW BASHO</span>
          <div style={{ marginLeft: 'auto' }}>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>飲み会の場所を投票で決めよう</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>候補のお店を登録してURLをシェア。みんなの「行きたい」を集めます。</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card" style={{ marginBottom: 24 }}>
            <p className="section-title">基本情報</p>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="title">タイトル</label>
              <input
                id="title"
                type="text"
                placeholder="例：6月の飲み会、場所どこにする？"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={titleError ? 'input-error' : ''}
              />
              {titleError && <p className="error-msg">タイトルを入力してください</p>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="creator">幹事の名前</label>
              <input
                id="creator"
                type="text"
                placeholder="あなたの名前"
                value={creatorName}
                onChange={e => setCreatorName(e.target.value)}
                className={nameError ? 'input-error' : ''}
              />
              {nameError && <p className="error-msg">名前を入力してください</p>}
            </div>

            <div>
              <label htmlFor="deadline">締切（任意）</label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="section-title" style={{ marginBottom: 0 }}>候補のお店</p>
              {user && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPicker(true)}
                >
                  📚 過去のお店から追加
                </button>
              )}
            </div>

            {noShopsError && <p className="error-msg" style={{ marginBottom: 12 }}>お店を1件以上追加してください</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {candidates.map((c, i) => (
                <div key={c._id} style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>候補 {i + 1}</span>
                    {candidates.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeCandidate(c._id)} style={{ color: 'var(--red)', padding: '2px 8px' }}>
                        削除
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label>店名 <span style={{ color: 'var(--red)' }}>*</span></label>
                      <input
                        type="text"
                        placeholder="例：焼き鳥 鳥一"
                        value={c.name}
                        onChange={e => updateCandidate(c._id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>食べログURL（任意）</label>
                      <input
                        type="url"
                        placeholder="https://tabelog.com/..."
                        value={c.tabelogUrl ?? ''}
                        onChange={e => updateCandidate(c._id, 'tabelogUrl', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Google MapsなどのURL（任意）</label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/..."
                        value={c.mapsUrl ?? ''}
                        onChange={e => updateCandidate(c._id, 'mapsUrl', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 16, width: '100%' }}
              onClick={addCandidate}
            >
              ＋ お店を追加
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: 28, width: '100%', padding: '14px 0', fontSize: 16, justifyContent: 'center' }}
            disabled={submitting}
          >
            {submitting ? '作成中…' : '投票ページを作成する'}
          </button>
        </form>
      </main>

      {showPicker && user && (
        <ShopPicker
          uid={user.uid}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
