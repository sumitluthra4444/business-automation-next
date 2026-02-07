export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0b0b0b',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Business Automation
        </h1>
        <p style={{ color: '#4da3ff', fontSize: '1.2rem' }}>
          Prototype is live 🚀
        </p>
        <p style={{ opacity: 0.7, marginTop: '1rem' }}>
          Blacktown Barber demo coming next
        </p>
      </div>
    </main>
  );
}
