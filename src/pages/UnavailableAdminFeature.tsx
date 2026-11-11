export function UnavailableAdminFeature({ title }: { title: string }) {
  return (
    <main className="admin-content">
      <section className="admin-card">
        <div className="admin-card-heading">
          <h2>{title}</h2>
          <p>
            This section is not connected to a page or backend endpoint in this
            repository yet. No changes can be made here.
          </p>
        </div>
      </section>
    </main>
  );
}
