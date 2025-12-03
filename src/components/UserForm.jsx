import { useState } from "react";

function UserForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [visitorCount] = useState(12319);

  const genderOptions = [
    { id: "male", label: "Male", icon: "../../images/male.svg" },
    { id: "female", label: "Female", icon: "../../images/female.svg" },
    { id: "other", label: "Other", icon: "../../images/blend.svg" },
  ];

  const avatarOptions = [
    {
      id: "avatar1",
      label: "Avatar 1",
      image: "../../images/avatar1.svg",
    },
    {
      id: "avatar2",
      label: "Avatar 2",
      image: "../../images/avatar2.svg",
    },
    {
      id: "avatar3",
      label: "Avatar 3",
      image: "../../images/avatar3.svg",
    },
  ];

  const isFormValid =
    name.trim() !== "" && selectedGender !== null && selectedAvatar !== null;

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D1C42]">
      <div className="relative bg-white w-full h-full max-w-md mx-auto flex flex-col overflow-hidden">
        {/* Main Scrollable Container */}
        <div className="flex-1 overflow-y-auto">
          {/* Background Image Container */}
          <div className="relative w-full flex-shrink-0">
            <img
              src={"../../images/formBG.svg"}
              alt="Form Background"
              className="w-full h-full object-cover"
            />

            {/* Lottie Animation with Visitor Count */}
            <div>
              <div className="bg-[#3B1578] backdrop-blur-sm px-4 py-3 flex items-centershadow-lg justify-center">
                <div className="w-10 h-8">
                  <img 
                  src="../../images/handWave.gif"
                  alt="hand wave"
                  className="w-full"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white text-xs font-medium">
                    Active visitors
                  </span>
                  <span className="text-[#FFFF68] font-bold text-lg">
                    {visitorCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 pt-8">
            {/* Name Input with Person Icon */}
            <div className="mb-8">
              <label className="block text-gray-900 text-sm font-medium mb-3">
                Your Name
              </label>
              <div className="relative">
                {/* Person Icon */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-gray-400"
                  >
                    <path
                      d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 3C11.66 3 13 4.34 13 6C13 7.66 11.66 9 10 9C8.34 9 7 7.66 7 6C7 4.34 8.34 3 10 3ZM10 17.2C7.5 17.2 5.29 15.92 4 14C4.03 12 8 10.9 10 10.9C11.99 10.9 15.97 12 16 14C14.71 15.92 12.5 17.2 10 17.2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                {/* Gradient Border Wrapper */}
                <div
                  className="relative rounded-2xl p-[1px]"
                  style={{
                    background:
                      "linear-gradient(116.58deg, #7B0AD1 24.28%, rgba(255, 83, 192, 0.5) 52.53%)",
                  }}
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-10 py-3.5 bg-white rounded-[15px] text-gray-900 placeholder-gray-400 focus:outline-none relative"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Tick Icon (only shows when name is entered) */}
                {name.trim() !== "" && (
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="relative w-4 h-4">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M8 0C3.582 0 0 3.582 0 8C0 12.418 3.582 16 8 16C12.418 16 16 12.418 16 8C16 3.582 12.418 0 8 0ZM11.707 6.707L7.707 10.707C7.512 10.902 7.256 11 7 11C6.744 11 6.488 10.902 6.293 10.707L4.293 8.707C3.902 8.316 3.902 7.684 4.293 7.293C4.684 6.902 5.316 6.902 5.707 7.293L7 8.586L10.293 5.293C10.684 4.902 11.316 4.902 11.707 5.293C12.098 5.684 12.098 6.316 11.707 6.707Z"
                          fill="#5EAA22"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gender Selection */}
            <div className="mb-8">
              <label className="block text-gray-900 text-sm font-medium mb-3">
                Your Gender
              </label>
              <div className="flex gap-3">
                {genderOptions.map((gender) => (
                  <div
                    key={gender.id}
                    className={`flex-1 rounded-2xl p-[1px] transition-all duration-200 ${
                      selectedGender === gender.id
                        ? "transform scale-[1.02]"
                        : "hover:scale-[1.01]"
                    }`}
                    style={
                      selectedGender === gender.id
                        ? {
                            background:
                              "linear-gradient(115.29deg, #B6116B 15.07%, #3B1578 104.4%)",
                          }
                        : {
                            background:
                              "linear-gradient(116.58deg, #7B0AD1 24.28%, rgba(255, 83, 192, 0.5) 52.53%)",
                          }
                    }
                  >
                    <button
                      onClick={() => setSelectedGender(gender.id)}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl transition-all duration-200 ${
                        selectedGender === gender.id
                          ? "bg-[#FFFF68]"
                          : "bg-white"
                      }`}
                    >
                      {/* Gender Icon from Image */}
                      <div className="w-6 h-6 flex items-center justify-center">
                        <img
                          src={gender.icon}
                          alt={gender.label}
                          className="w-5 h-5"
                        />
                      </div>
                      <span className="text-gray-900 text-sm font-medium">
                        {gender.label}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar Selection */}
            <div className="mb-6">
              <label className="block text-gray-900 text-sm font-medium mb-3">
                Your GCL Avatar
              </label>
              <div className="flex items-center justify-between gap-3">
                {avatarOptions.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`rounded-2xl p-[1px] transition-all duration-200 h-full w-full  group ${
                      selectedAvatar === avatar.id
                        ? "transform scale-[1.02]"
                        : "hover:scale-[1.01]"
                    }`}
                    style={
                      selectedAvatar === avatar.id
                        ? {
                            background:
                              "linear-gradient(115.29deg, #B6116B 15.07%, #3B1578 104.4%)",
                          }
                        : {
                            background:
                              "linear-gradient(116.58deg, #7B0AD1 24.28%, rgba(255, 83, 192, 0.5) 52.53%)",
                          }
                    }
                  >
                    <button
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`relative overflow-hidden rounded-2xl aspect-square w-full h-full transition-all duration-200 group ${
                        selectedAvatar === avatar.id
                          ? "bg-[#FFFF68]"
                          : "bg-white"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img
                          src={avatar.image}
                          alt={avatar.label}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full py-4 px-4 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 mb-4 ${
                isFormValid
                  ? "bg-gradient-to-r from-[#7B0AD1] via-[#FF53C0] to-[#7B0AD1] text-white hover:opacity-90 hover:shadow-lg transform hover:scale-[1.02]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isFormValid ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Enter Metaverse
                </>
              ) : (
                "Enter Metaverse"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserForm;
