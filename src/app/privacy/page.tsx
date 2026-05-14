import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | FLOW BASHO',
};

export default function PrivacyPage() {
  return (
    <>
      <header>
        <div className="header-inner">
          <Link href="/" className="logo">FLOW BASHO<span>.</span></Link>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 680 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>プライバシーポリシー</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>最終更新: 2026年5月</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 14, lineHeight: 1.9 }}>
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>1. 収集する情報</h2>
            <p>本サービスでは以下の情報を収集します。</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>投票ページ作成時に入力したタイトル・幹事名・候補店舗情報</li>
              <li>投票時に入力した名前・投票内容</li>
              <li>Googleログイン時のアカウント名・メールアドレス・プロフィール画像（Firebase Authentication経由）</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>2. 情報の利用目的</h2>
            <p>収集した情報は以下の目的のみに使用します。</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>投票ページの表示・集計機能の提供</li>
              <li>Googleログインユーザーのお店ライブラリ機能の提供</li>
              <li>サービスの改善・分析（Vercel Analytics）</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>3. 第三者への提供</h2>
            <p>収集した情報を第三者に販売・提供することはありません。ただし以下のサービスを利用しています。</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Firebase（Google LLC）— データの保存・認証</li>
              <li>Vercel Inc. — ホスティング・アクセス解析</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>4. Cookieとローカルストレージ</h2>
            <p>本サービスはローカルストレージを使用して作成した投票の履歴を保存します。これはブラウザ内にのみ保存され、サーバーには送信されません。</p>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>5. お問い合わせ</h2>
            <p>プライバシーに関するご質問は <a href="mailto:stellarsbit@gmail.com" style={{ color: 'var(--indigo)' }}>stellarsbit@gmail.com</a> までご連絡ください。</p>
          </section>
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{ color: 'var(--indigo)', fontSize: 14 }}>← トップページに戻る</Link>
        </div>
      </main>
    </>
  );
}
