import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ヘルプ | FLOW BASHO',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid var(--indigo-soft)' }}>
      {title}
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {children}
    </div>
  </section>
);

const Q = ({ q, children }: { q: string; children: React.ReactNode }) => (
  <div>
    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--indigo)' }}>Q. {q}</p>
    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>{children}</p>
  </div>
);

export default function HelpPage() {
  return (
    <>
      <header>
        <div className="header-inner">
          <Link href="/" className="logo">FLOW BASHO<span>.</span></Link>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 680 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>ヘルプ</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>よくある質問と使い方ガイド</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="🍻 基本的な使い方">
            <Q q="FLOW BASHOとは何ですか？">
              URLを共有するだけで飲み会や食事会のお店候補を投票で決められる無料ツールです。登録不要で、幹事も参加者もすぐに使えます。
            </Q>
            <Q q="投票ページを作るにはどうすればいいですか？">
              トップページでタイトル・幹事名・候補のお店を入力して「投票ページを作成する」ボタンを押してください。作成後に表示されるURLを参加者に共有します。
            </Q>
            <Q q="参加者はどうやって投票しますか？">
              共有されたURLを開き、名前を入力して各候補に🙆（行きたい）🤔（行けなくはない）🙅（遠慮したい）を選んで送信するだけです。アカウント登録は不要です。
            </Q>
            <Q q="食べログや地図のリンクはどこで入力しますか？">
              お店登録時に「食べログURL」「地図URL」を任意で入力できます。投票ページでリンクボタンとして表示されるので、参加者がお店の情報を確認してから投票できます。
            </Q>
          </Section>

          <Section title="➕ お店の追加・編集">
            <Q q="投票ページに後からお店を追加できますか？">
              できます。投票ページの「候補のお店」セクション右上の「＋ お店を追加」ボタンから誰でも追加できます。
            </Q>
            <Q q="登録したお店の情報を修正できますか？">
              できます。各候補の右にある ✏️ ボタンで店名・食べログURL・地図URLを編集できます。
            </Q>
            <Q q="お店を削除できますか？">
              できます。各候補の右にある 🗑️ ボタンから削除できます（確認あり）。
            </Q>
            <Q q="タイトルや締切を変更できますか？">
              できます。投票ページのタイトル横の「✏️ 編集」ボタンからタイトルと締切を変更できます。
            </Q>
          </Section>

          <Section title="🔑 Googleログインについて">
            <Q q="Googleログインは必須ですか？">
              いいえ、任意です。ログインしなくても全機能を利用できます。ログインすると過去に登録したお店をライブラリから再利用できます。
            </Q>
            <Q q="Googleログインすると何が変わりますか？">
              投票ページ作成時に追加したお店が自動的にライブラリに保存されます。次回の投票作成時に「📚 過去のお店から追加」ボタンで素早く再利用できます。
            </Q>
          </Section>

          <Section title="📚 過去のお店ライブラリ">
            <Q q="ライブラリに保存されたお店はどこで確認できますか？">
              ヘッダーのアカウント名をクリックしてログアウト、または直接 /my-shops にアクセスすると確認できます。使用回数・最終使用日順で表示されます。
            </Q>
            <Q q="ライブラリからお店を削除できますか？">
              できます。/my-shops ページで各お店の「削除」ボタンから削除できます。
            </Q>
          </Section>

        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--indigo)', fontSize: 14 }}>← トップページに戻る</Link>
          <Link href="/privacy" style={{ color: 'var(--muted)', fontSize: 14 }}>プライバシーポリシー</Link>
          <a href="mailto:stellarsbit@gmail.com" style={{ color: 'var(--muted)', fontSize: 14 }}>お問い合わせ</a>
        </div>
      </main>
    </>
  );
}
