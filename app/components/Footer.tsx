export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-8">
      <div className="container mx-auto px-4 text-center">
       <p>&copy; {new Date().getFullYear()} Enbal Sigorta. Tüm hakları saklıdır.</p>

      </div>
    </footer>
  );
}