function CoinCounter({ collected, total }) {
  return (
    <div className="absolute top-4 right-4 z-10 text-white bg-black bg-opacity-70 px-6 py-3 rounded-lg border-2 border-yellow-400 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🪙</div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">
            {collected} / {total}
          </div>
          <div className="text-xs text-gray-300 uppercase tracking-wide">
            Coins Collected
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoinCounter

