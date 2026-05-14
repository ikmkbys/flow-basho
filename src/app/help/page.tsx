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

          <Section title="🗺️ 基本的な使い方">
            <Q q="FLOW BASHOとは何ですか？">
              URLを共有するだけで行き先・場所の候補を投票で決められる無料ツールです。飲み会・旅行・イベント会場など、みんなで場所を決めたいシーンで使えます。登録不要で、幹事も参加者もすぐに使えます。
            </Q>
            <Q q="投票ページを作るにはどうすればいいですか？">
              トップページでタイトル・幹事名・候補の場所を入力して「投票ページを作成する」ボタンを押してください。作成後に表示されるURLを参加者に共有します。
            </Q>
            <Q q="参加者はどうやって投票しますか？">
              共有されたURLを開き、名前を入力して各候補に🙆（行きたい）🤔（行けなくはない）🙅（遠慮したい）を選んで送信するだけです。アカウント登録は不要です。
            </Q>
            <Q q="候補に食べログや地図のリンク・備考を入れられますか？">
              はい。候補の登録時に「食べログURL」「地図URL」「備考」を任意で入力できます。投票ページでリンクボタンや備考として表示されるので、参加者が詳細を確認してから投票できます。
            </Q>
          </Section>

          <Section title="➕ 候補の追加・編集">
            <Q q="投票ページに後から候補を追加できますか？">
              できます。投票ページの「候補の場所」セクション右上の「＋ 手入力で追加」ボタンから誰でも追加できます。Googleログイン済みの場合は「📚 ライブラリから追加」でお店ライブラリから選んで追加することもできます。
            </Q>
            <Q q="登録した候補の情報を修正できますか？">
              できます。各候補の右にある ✏️ ボタンで場所名・食べログURL・地図URL・備考を編集できます。
            </Q>
            <Q q="候補を削除できますか？">
              できます。各候補の右にある 🗑️ ボタンから削除できます（確認あり）。
            </Q>
            <Q q="タイトルや締切を変更できますか？">
              できます。投票ページのタイトル横の「✏️ 編集」ボタンからタイトルと締切を変更できます。
            </Q>
          </Section>

          <Section title="🔑 Googleログインについて">
            <Q q="Googleログインは必須ですか？">
              いいえ、任意です。ログインしなくても投票・候補の追加・編集など全基本機能を利用できます。ログインするとお店ライブラリ機能が使えます。
            </Q>
            <Q q="Googleログインすると何が変わりますか？">
              以下のライブラリ機能が使えるようになります：投票ページ作成時に使ったお店の自動保存、ライブラリからの候補追加、他の人のイベントの候補を自分のライブラリへの保存。
            </Q>
          </Section>

          <Section title="📚 お店ライブラリ">
            <Q q="お店ライブラリとは何ですか？">
              Googleログイン時に使えるお店の保存リストです。一度登録したお店を次回以降すぐに候補として追加できます。ヘッダーの「📚 ライブラリ」リンクから管理画面にアクセスできます。
            </Q>
            <Q q="ライブラリにお店を登録するにはどうすればいいですか？">
              3つの方法があります。①投票ページ作成時に候補として追加すると自動保存されます。②ライブラリ管理画面（/my-shops）の「＋ 新規登録」から直接登録できます。③投票ページで他の人が追加した候補の「📚 保存」ボタンで自分のライブラリに保存できます。
            </Q>
            <Q q="ライブラリのお店を編集・削除できますか？">
              できます。ライブラリ管理画面（/my-shops）で各お店の「編集」「削除」ボタンから操作できます。
            </Q>
            <Q q="他の人が作ったイベントにライブラリから候補を追加できますか？">
              できます。Googleログイン済みであれば、どのイベントページでも「📚 ライブラリから追加」ボタンが表示され、自分のライブラリからお店を候補として追加できます。
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
