// src/app/hadmin/page.tsx
export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Panel administracyjny</h1>
      <ul className="space-y-4">
        <li><a href="/hadmin/users" className="text-blue-600">👤 Użytkownicy</a></li>
        <li><a href="/hadmin/organizations" className="text-blue-600">🏢 Organizacje</a></li>
        <li><a href="/hadmin/branding" className="text-blue-600">🎨 Branding</a></li>
        <li><a href="/hadmin/settings" className="text-blue-600">⚙️ Ustawienia</a></li>
      </ul>
    </div>
  );
}
