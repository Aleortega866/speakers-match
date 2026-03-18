export default function Footer() {
  return (
    <footer className="bg-[#f5f5f5] pt-section pb-section border-t border-gray-200">
      <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-body text-xs text-gray-400">
          © 2026 Speakers México
        </p>
        <div className="flex gap-6">
          <a
            href="#"
            className="font-body text-xs text-gray-400 hover:text-black transition-colors"
          >
            Términos y Condiciones
          </a>
          <a
            href="#"
            className="font-body text-xs text-gray-400 hover:text-black transition-colors"
          >
            Política de Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
