function WelcomeScreen({ onVisitRoyalOpera }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#2D1C42]">
      <div className="relative bg-white w-full h-full max-w-md mx-auto flex flex-col overflow-hidden">
        {/* Main Container */}
        <div className="flex-1 relative">
          {/* Image */}
          <img
            src={"../../images/welcome.svg"}
            alt="Welcome"
            className="w-full h-full object-contain"
          />

          <button
            onClick={onVisitRoyalOpera}
            className="absolute ml-4 mr-4 left-0 right-0 bottom-20 px-8 py-3 text-white rounded-2xl font-medium transition-all duration-200 hover:shadow-inner transform hover:scale-[1.05] active:scale-[0.95]"
            style={{
              background:
                "linear-gradient(115.29deg, #602081 15.07%, #3B1578 104.4%)",
            }}
            >

           Let's Visit Royal Opera House in Mumbai
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
