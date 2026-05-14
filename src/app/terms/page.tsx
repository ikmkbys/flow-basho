import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | FLOW BASHO',
};

export default function TermsPage() {
  return (
    <>
      <header>
        <div className="header-inner">
          <Link href="/" className="logo">FLOW BASHO<span>.</span></Link>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 680 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>利用規約</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>最終更新: 2026年5月</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 14, lineHeight: 1.9 }}>
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>1. サービスの利用</h2>
            <p>FLOW BASHO（以下「本サービス」）は、飲み会・食事会などの場所決めを目的とした投票ツールです。個人・グループでの非商用利用を想定しています。</p>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>2. 禁止事項</h2>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>法令に違反する行為</li>
              <li>他者への嫌がらせ・誹謗中傷</li>
              <li>スパム・大量の自動送信</li>
              <li>本サービスの運営を妨害する行為</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>3. 免責事項</h2>
            <p>本サービスは現状有姿で提供されます。サービスの継続性・正確性・完全性については保証しません。本サービスの利用により生じた損害について、運営者は責任を負いません。</p>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>4. サービスの変更・終了</h2>
            <p>運営者は予告なくサービスの内容変更・終了を行う場合があります。</p>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>5. お問い合わせ</h2>
            <p>ご不明な点は <a href="mailto:stellarsbit@gmail.com" style={{ color: 'var(--indigo)' }}>stellarsbit@gmail.com</a> までご連絡ください。</p>
          </section>
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{ color: 'var(--indigo)', fontSize: 14 }}>← トップページに戻る</Link>
        </div>
      </main>
    </>
  );
}
