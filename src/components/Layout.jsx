import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-shell min-h-screen bg-gray-50">
      <Navbar />
      <main className="app-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
