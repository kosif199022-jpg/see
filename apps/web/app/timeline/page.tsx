export default function AuditTimeline(){
  const events = [
    'Data uploaded',
    'Validation completed',
    'Risk assessment started',
    'Evidence review pending'
  ];

  return (
    <main dir="rtl">
      <h1>Audit Timeline</h1>
      <ul>
        {events.map(event => <li key={event}>{event}</li>)}
      </ul>
    </main>
  );
}
