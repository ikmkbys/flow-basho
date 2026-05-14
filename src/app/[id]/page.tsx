'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import {
  doc, collection, addDoc, updateDoc, setDoc, arrayUnion, arrayRemove,
  onSnapshot, orderBy, query, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthButton from '@/components/AuthButton';
import ShopPicker from '@/components/ShopPicker';
import type { BashoEvent, Candidate, VoteResponse, VoteValue } from '@/lib/types';

function safeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith('https://') || url.startsWith('http://') ? url : undefined;
}

const VOTE_LABELS: Record<VoteValue, string> = {
  want: '🙆',
  ok:   '🤔',
  pass: '🙅',
};

const CELL_CLASS: Record<VoteValue, string> = {
  want: 'cell-want',
  ok:   'cell-ok',
  pass: 'cell-pass',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function BashoPage({ params }: Props) {
  const { id } = use(params);
  const { user } = useAuth();

  const [event, setEvent]         = useState<BashoEvent | null>(null);
  const [responses, setResponses] = useState<VoteResponse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  // 投票フォーム
  const [respName, setRespName]     = useState('');
  const [votes, setVotes]           = useState<Record<string, VoteValue>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [myResponseId, setMyResponseId] = useState<string | null>(null);
  const [attempted, setAttempted]     = useState(false);
  const [copied, setCopied]           = useState(false);
  const [submittedAsEdit, setSubmittedAsEdit] = useState(false);

  // 場所追加フォーム
  const [showAddForm, setShowAddForm]     = useState(false);
  const [showShopPicker, setShowShopPicker] = useState(false);

  // ライブラリ保存済みの候補ID（セッション内のフィードバック用）
  const [savedToLibrary, setSavedToLibrary] = useState<Set<string>>(new Set());
  const [newName, setNewName]             = useState('');
  const [newTabelog, setNewTabelog]       = useState('');
  const [newMaps, setNewMaps]             = useState('');
  const [newNote, setNewNote]             = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addAttempted, setAddAttempted]   = useState(false);

  // お店編集
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editName, setEditName]         = useState('');
  const [editTabelog, setEditTabelog]   = useState('');
  const [editMaps, setEditMaps]         = useState('');
  const [editNote, setEditNote]         = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // イベント編集
  const [showEventEdit, setShowEventEdit]     = useState(false);
  const [editTitle, setEditTitle]             = useState('');
  const [editDeadline, setEditDeadline]       = useState('');
  const [eventEditSubmitting, setEventEditSubmitting] = useState(false);

  // localStorage から前回の投票IDを復元
  useEffect(() => {
    const stored = localStorage.getItem(`basho_vote_${id}`);
    if (stored) {
      setMyResponseId(stored);
      setSubmitted(true);
    }
  }, [id]);

  // イベントリアルタイム購読
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'basho', id), snap => {
      if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
      setEvent({ id: snap.id, ...snap.data() } as BashoEvent);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  // 回答リアルタイム購読
  useEffect(() => {
    const q = query(collection(db, 'basho', id, 'responses'), orderBy('answeredAt', 'asc'));
    return onSnapshot(q, snap => {
      setResponses(snap.docs.map(d => ({ id: d.id, ...d.data() }) as VoteResponse));
    });
  }, [id]);

  // 名前入力時に既存の回答を探して自動リンク（localStorage未記録の場合の救済）
  useEffect(() => {
    if (!respName.trim() || myResponseId || submitted) return;
    const match = responses.find(r => r.respondentName === respName.trim());
    if (match) {
      setMyResponseId(match.id);
      setVotes(match.votes);
      localStorage.setItem(`basho_vote_${id}`, match.id);
    }
  }, [respName, responses, myResponseId, submitted, id]);

  // 自分の回答に含まれていない候補が増えたら自動で編集モードへ
  useEffect(() => {
    if (!submitted || !myResponseId || !event || responses.length === 0) return;
    const myResp = responses.find(r => r.id === myResponseId);
    if (!myResp) return;
    if (event.candidates.some(c => !myResp.votes[c.id])) {
      setRespName(myResp.respondentName);
      setVotes(myResp.votes);
      setSubmitted(false);
    }
  }, [submitted, myResponseId, event, responses]);

  const setVote = useCallback((candidateId: string, value: VoteValue) => {
    setVotes(prev => ({ ...prev, [candidateId]: value }));
  }, []);

  // 投票送信（新規 or 修正）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!respName.trim() || !event) return;
    if (!event.candidates.every(c => votes[c.id])) return;

    const isEdit = !!myResponseId;
    setSubmitting(true);
    try {
      if (myResponseId) {
        await updateDoc(doc(db, 'basho', id, 'responses', myResponseId), {
          respondentName: respName.trim(),
          votes,
          answeredAt: Timestamp.now(),
        });
      } else {
        const ref = await addDoc(collection(db, 'basho', id, 'responses'), {
          respondentName: respName.trim(),
          votes,
          answeredAt: Timestamp.now(),
        });
        setMyResponseId(ref.id);
        localStorage.setItem(`basho_vote_${id}`, ref.id);
      }
      setSubmittedAsEdit(isEdit);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMyVote = () => {
    if (myResponseId) {
      const myResp = responses.find(r => r.id === myResponseId);
      if (myResp) {
        setRespName(myResp.respondentName);
        setVotes(myResp.votes);
      }
    }
    setSubmitted(false);
    setAttempted(false);
  };

  // 候補をマイライブラリに保存
  const handleSaveToLibrary = async (c: Candidate) => {
    if (!user) return;
    const docId = `${user.uid}_${encodeURIComponent(c.name)}`;
    await setDoc(doc(db, 'shops', docId), {
      name: c.name,
      ...(c.tabelogUrl ? { tabelogUrl: c.tabelogUrl } : {}),
      ...(c.mapsUrl    ? { mapsUrl: c.mapsUrl }        : {}),
      ...(c.note       ? { note: c.note }              : {}),
      ownerUid:   user.uid,
      lastUsedAt: Timestamp.now(),
      useCount:   1,
    }, { merge: true });
    setSavedToLibrary(prev => new Set(prev).add(c.id));
  };

  // ライブラリからお店追加
  const handleAddFromLibrary = async (partial: Omit<Candidate, 'id'>) => {
    const newCandidate: Candidate = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...partial,
    };
    await updateDoc(doc(db, 'basho', id), { candidates: arrayUnion(newCandidate) });
  };

  // お店追加
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAttempted(true);
    if (!newName.trim()) return;
    setAddSubmitting(true);
    try {
      const newCandidate = {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: newName.trim(),
        ...(newTabelog.trim() ? { tabelogUrl: newTabelog.trim() } : {}),
        ...(newMaps.trim()    ? { mapsUrl: newMaps.trim() }        : {}),
        ...(newNote.trim()    ? { note: newNote.trim() }           : {}),
      };
      await updateDoc(doc(db, 'basho', id), { candidates: arrayUnion(newCandidate) });
      setNewName(''); setNewTabelog(''); setNewMaps(''); setNewNote('');
      setAddAttempted(false);
      setShowAddForm(false);
    } finally {
      setAddSubmitting(false);
    }
  };

  // お店削除
  const handleDeleteCandidate = async (candidate: Candidate) => {
    if (!confirm(`「${candidate.name}」を削除しますか？`)) return;
    await updateDoc(doc(db, 'basho', id), { candidates: arrayRemove(candidate) });
  };

  // 場所編集開始
  const startEditCandidate = (c: Candidate) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditTabelog(c.tabelogUrl ?? '');
    setEditMaps(c.mapsUrl ?? '');
    setEditNote(c.note ?? '');
  };

  // お店編集保存
  const handleEditCandidate = async (original: Candidate) => {
    if (!editName.trim()) return;
    setEditSubmitting(true);
    try {
      const updated: Candidate = {
        id: original.id,
        name: editName.trim(),
        ...(editTabelog.trim() ? { tabelogUrl: editTabelog.trim() } : {}),
        ...(editMaps.trim()    ? { mapsUrl: editMaps.trim() }        : {}),
        ...(editNote.trim()    ? { note: editNote.trim() }           : {}),
      };
      if (!event) return;
      const newCandidates = event.candidates.map(c => c.id === original.id ? updated : c);
      await updateDoc(doc(db, 'basho', id), { candidates: newCandidates });
      setEditingId(null);
    } finally {
      setEditSubmitting(false);
    }
  };

  // イベント編集開始
  const startEditEvent = () => {
    if (!event) return;
    setEditTitle(event.title);
    setEditDeadline(event.deadline ?? '');
    setShowEventEdit(true);
  };

  // イベント編集保存
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setEventEditSubmitting(true);
    try {
      await updateDoc(doc(db, 'basho', id), {
        title: editTitle.trim(),
        deadline: editDeadline || null,
      });
      setShowEventEdit(false);
    } finally {
      setEventEditSubmitting(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareEvent = () => {
    const url = window.location.href;
    const text = event ? `「${event.title}」の場所候補 - FLOW BASHO` : 'FLOW BASHO';
    if (navigator.share) {
      navigator.share({ title: event?.title ?? 'FLOW BASHO', text, url }).catch(() => {});
    } else {
      copyUrl();
    }
  };

  const tally = (candidateId: string): Record<VoteValue, number> => {
    return { want: 0, ok: 0, pass: 0, ...Object.fromEntries(
      (['want', 'ok', 'pass'] as VoteValue[]).map(v => [
        v, responses.filter(r => r.votes[candidateId] === v).length,
      ]),
    ) } as Record<VoteValue, number>;
  };

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--muted)' }}>読み込み中…</div>
  );
  if (notFound) return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <p style={{ marginBottom: 16, color: 'var(--muted)' }}>投票ページが見つかりませんでした</p>
      <Link href="/" className="btn btn-primary">トップへ戻る</Link>
    </div>
  );
  if (!event) return null;

  const isDeadlinePassed = event.deadline ? new Date(event.deadline) < new Date() : false;
  const nameError = attempted && !respName.trim();
  const voteError = attempted && !event.candidates.every(c => votes[c.id]);

  return (
    <>
      <header>
        <div className="header-inner">
          <Link href="/" className="logo">FLOW BASHO<span>.</span></Link>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <a href="https://flow-yotei.stellars-lab.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 13 }}>
              日程調整はYOTEI
            </a>
            <Link href="/my-shops" className="btn btn-ghost btn-sm" style={{ fontSize: 13 }}>📚 ライブラリ</Link>
            <Link href="/help" className="btn btn-ghost btn-sm" style={{ fontSize: 13 }}>？ 使い方</Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={shareEvent} style={{ fontSize: 13 }}>共有</button>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>

        {/* イベント情報 */}
        {!showEventEdit ? (
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{event.title}</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                幹事: {event.creatorName}
                {event.deadline && (
                  <>　·　締切: {new Date(event.deadline).toLocaleString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                )}
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={startEditEvent} style={{ flexShrink: 0 }}>
              ✏️ 編集
            </button>
          </div>
        ) : (
          <form onSubmit={handleEditEvent} noValidate style={{ marginBottom: 28 }} className="card">
            <p className="section-title">イベントを編集</p>
            <div style={{ marginBottom: 14 }}>
              <label>タイトル</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>締切（任意）</label>
              <input type="datetime-local" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={eventEditSubmitting} style={{ justifyContent: 'center' }}>
                {eventEditSubmitting ? '保存中…' : '保存'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEventEdit(false)}>
                キャンセル
              </button>
            </div>
          </form>
        )}

        {/* URLシェア */}
        <div className="share-box" style={{ marginBottom: 28 }}>
          <input type="text" readOnly value={typeof window !== 'undefined' ? window.location.href : ''} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={copyUrl}>
            {copied ? '✓ コピー済み' : 'コピー'}
          </button>
        </div>

        {/* 候補のお店 */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>候補の場所</p>
            {!isDeadlinePassed && (
              <div style={{ display: 'flex', gap: 6 }}>
                {user && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowShopPicker(true)}>
                    📚 ライブラリから追加
                  </button>
                )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(v => !v)}>
                  {showAddForm ? '✕ キャンセル' : '＋ 手入力で追加'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {event.candidates.map(c => (
              <div key={c.id}>
                {editingId === c.id ? (
                  /* 編集フォーム */
                  <div style={{ border: '1.5px solid var(--indigo)', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      <input type="text" placeholder="場所名" value={editName} onChange={e => setEditName(e.target.value)} />
                      <input type="url" placeholder="食べログURL（任意）" value={editTabelog} onChange={e => setEditTabelog(e.target.value)} />
                      <input type="url" placeholder="地図URL（任意）" value={editMaps} onChange={e => setEditMaps(e.target.value)} />
                      <input type="text" placeholder="備考（任意）" value={editNote} onChange={e => setEditNote(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleEditCandidate(c)} disabled={editSubmitting} style={{ justifyContent: 'center' }}>
                        {editSubmitting ? '保存中…' : '保存'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 通常表示 */
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {c.note && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.note}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                      {c.tabelogUrl && <a href={safeUrl(c.tabelogUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">食べログ ↗</a>}
                      {c.mapsUrl    && <a href={safeUrl(c.mapsUrl)}    target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">地図 ↗</a>}
                      {user && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleSaveToLibrary(c)}
                          disabled={savedToLibrary.has(c.id)}
                          title="マイライブラリに保存"
                          style={savedToLibrary.has(c.id) ? { color: 'var(--muted)' } : {}}
                        >
                          {savedToLibrary.has(c.id) ? '📚 保存済み' : '📚 保存'}
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEditCandidate(c)} title="編集">✏️</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDeleteCandidate(c)} title="削除" style={{ color: 'var(--red)' }}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* お店追加フォーム */}
          {showAddForm && (
            <form onSubmit={handleAddCandidate} noValidate style={{ marginTop: 16, borderTop: '1.5px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label>店名 <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="例：焼き鳥 鳥一"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className={addAttempted && !newName.trim() ? 'input-error' : ''}
                  />
                  {addAttempted && !newName.trim() && <p className="error-msg">店名を入力してください</p>}
                </div>
                <div>
                  <label>食べログURL（任意）</label>
                  <input type="url" placeholder="https://tabelog.com/..." value={newTabelog} onChange={e => setNewTabelog(e.target.value)} />
                </div>
                <div>
                  <label>地図URL（任意）</label>
                  <input type="url" placeholder="https://maps.google.com/..." value={newMaps} onChange={e => setNewMaps(e.target.value)} />
                </div>
                <div>
                  <label>備考（任意）</label>
                  <input type="text" placeholder="例：予算3,000円、駅から徒歩5分" value={newNote} onChange={e => setNewNote(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} disabled={addSubmitting}>
                {addSubmitting ? '追加中…' : '場所を追加する'}
              </button>
            </form>
          )}
        </div>

        {/* 投票フォーム */}
        {!isDeadlinePassed && !submitted && (
          <div className="card" style={{ marginBottom: 28 }}>
            <p className="section-title">投票する</p>
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="resp-name">あなたの名前</label>
                <input
                  id="resp-name"
                  type="text"
                  placeholder="名前を入力"
                  value={respName}
                  onChange={e => setRespName(e.target.value)}
                  className={nameError ? 'input-error' : ''}
                />
                {nameError && <p className="error-msg">名前を入力してください</p>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {event.candidates.map(c => (
                  <div key={c.id}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</p>
                        {c.note && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.note}</p>}
                      </div>
                      {c.tabelogUrl && <a href={safeUrl(c.tabelogUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">食べログ ↗</a>}
                      {c.mapsUrl    && <a href={safeUrl(c.mapsUrl)}    target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">地図 ↗</a>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['want', 'ok', 'pass'] as VoteValue[]).map(v => (
                        <button
                          key={v}
                          type="button"
                          className={`vote-btn vote-${v}${votes[c.id] === v ? ' active' : ''}`}
                          onClick={() => setVote(c.id, v)}
                          title={{ want: '行きたい', ok: '行けなくはない', pass: '遠慮したい' }[v]}
                        >
                          {VOTE_LABELS[v]}
                        </button>
                      ))}
                      <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', marginLeft: 4 }}>
                        {{ want: '行きたい', ok: '行けなくはない', pass: '遠慮したい' }[votes[c.id]] ?? '選んでください'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {voteError && <p className="error-msg" style={{ marginTop: 12 }}>全候補に投票してください</p>}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                disabled={submitting}
              >
                {submitting ? '送信中…' : '投票する'}
              </button>
            </form>
          </div>
        )}

        {submitted && (
          <div className="card" style={{ marginBottom: 28, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>
              {submittedAsEdit ? '投票を修正しました！' : '投票ありがとうございます！'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>下の集計でみんなの結果を確認できます</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleEditMyVote} style={{ margin: '0 auto' }}>
              ✏️ 投票を修正する
            </button>
          </div>
        )}

        {isDeadlinePassed && !submitted && (
          <div className="card" style={{ marginBottom: 28, textAlign: 'center', background: '#f8f8fc' }}>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>締切が過ぎたため投票は終了しました</p>
          </div>
        )}

        {/* 集計テーブル */}
        {responses.length > 0 && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 16 }}>集計結果 ({responses.length}人回答)</p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {event.candidates.map(c => {
                const t = tally(c.id);
                return (
                  <div key={c.id} style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 120 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{c.name}</p>
                    <div style={{ display: 'flex', gap: 6, fontSize: 13 }}>
                      <span>🙆 {t.want}</span>
                      <span>🤔 {t.ok}</span>
                      <span>🙅 {t.pass}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="result-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>名前</th>
                    {event.candidates.map(c => <th key={c.id}>{c.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {responses.map(r => (
                    <tr key={r.id}>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>
                        <span>{r.respondentName}</span>
                        {r.id === myResponseId && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={handleEditMyVote}
                            style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', color: 'var(--indigo)' }}
                          >
                            訂正
                          </button>
                        )}
                      </td>
                      {event.candidates.map(c => {
                        const v = r.votes[c.id] as VoteValue | undefined;
                        return (
                          <td key={c.id} className={v ? CELL_CLASS[v] : ''}>
                            {v ? VOTE_LABELS[v] : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showShopPicker && user && (
        <ShopPicker
          uid={user.uid}
          onSelect={handleAddFromLibrary}
          onClose={() => setShowShopPicker(false)}
        />
      )}
    </>
  );
}
