'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import {
  doc, getDoc, collection, addDoc, onSnapshot, orderBy, query, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AuthButton from '@/components/AuthButton';
import type { BashoEvent, VoteResponse, VoteValue } from '@/lib/types';

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

  const [event, setEvent]           = useState<BashoEvent | null>(null);
  const [responses, setResponses]   = useState<VoteResponse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);

  const [respName, setRespName]     = useState('');
  const [votes, setVotes]           = useState<Record<string, VoteValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [attempted, setAttempted]   = useState(false);
  const [copied, setCopied]         = useState(false);

  // イベント取得
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'basho', id));
      if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
      setEvent({ id: snap.id, ...snap.data() } as BashoEvent);
      setLoading(false);
    })();
  }, [id]);

  // 回答リアルタイム購読
  useEffect(() => {
    const q = query(collection(db, 'basho', id, 'responses'), orderBy('answeredAt', 'asc'));
    return onSnapshot(q, snap => {
      setResponses(snap.docs.map(d => ({ id: d.id, ...d.data() }) as VoteResponse));
    });
  }, [id]);

  const setVote = useCallback((candidateId: string, value: VoteValue) => {
    setVotes(prev => ({ ...prev, [candidateId]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!respName.trim() || !event) return;

    // 全候補に投票があるか確認
    const allVoted = event.candidates.every(c => votes[c.id]);
    if (!allVoted) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'basho', id, 'responses'), {
        respondentName: respName.trim(),
        votes,
        answeredAt: Timestamp.now(),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 集計: 候補ごとの🙆/🤔/🙅件数
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
          <Link href="/" className="logo">🍻 FLOW BASHO</Link>
          <div style={{ marginLeft: 'auto' }}>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* イベント情報 */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{event.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            幹事: {event.creatorName}
            {event.deadline && (
              <>　·　締切: {new Date(event.deadline).toLocaleString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
            )}
          </p>
        </div>

        {/* URLシェア */}
        <div className="share-box" style={{ marginBottom: 28 }}>
          <input type="text" readOnly value={typeof window !== 'undefined' ? window.location.href : ''} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={copyUrl}>
            {copied ? '✓ コピー済み' : 'コピー'}
          </button>
        </div>

        {/* 候補一覧 */}
        <div className="card" style={{ marginBottom: 28 }}>
          <p className="section-title">候補のお店</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {event.candidates.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 600, flex: 1 }}>{c.name}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {c.tabelogUrl && (
                    <a href={c.tabelogUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                      食べログ ↗
                    </a>
                  )}
                  {c.mapsUrl && (
                    <a href={c.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                      地図 ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                    <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{c.name}</p>
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
                style={{ marginTop: 20, width: '100%' }}
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
            <p style={{ fontWeight: 700, marginBottom: 4 }}>投票ありがとうございます！</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>下の集計でみんなの結果を確認できます</p>
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

            {/* サマリ（候補ごとの🙆数） */}
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

            {/* 詳細テーブル */}
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
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>{r.respondentName}</td>
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
    </>
  );
}
