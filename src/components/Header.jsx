// components/Header.jsx
import logoLeft from "../../public/images/logo-left.svg"
import logoRight from "../../public/images/logo-right.svg"

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        {/* Left Logo */}
        <div className="flex items-center">
          <img 
            src={logoLeft} 
            alt="Left Logo" 
            className="h-full w-auto"
          />
        </div>
        {/* Right Logo */}
        <div className="flex items-center">
          <img 
            src={logoRight} 
            alt="Right Logo" 
            className="h-full w-auto"
          />
        </div>
      </div>
    </header>
  )
}

export default Header