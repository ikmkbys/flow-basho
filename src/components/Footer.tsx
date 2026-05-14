import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', padding: '24px 0' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>© 2026 <a href="https://stellars-lab.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)' }}>Stellars Lab</a></span>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/help"    style={{ fontSize: 13, color: 'var(--muted)' }}>ヘルプ</Link>
          <Link href="/privacy" style={{ fontSize: 13, color: 'var(--muted)' }}>プライバシーポリシー</Link>
          <Link href="/terms"   style={{ fontSize: 13, color: 'var(--muted)' }}>利用規約</Link>
          <a href="https://flow-yotei.stellars-lab.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--muted)' }}>📅 FLOW YOTEI</a>
        </div>
      </div>
    </footer>
  );
}
