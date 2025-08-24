import React from "react";
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
        {/* Left side: copyright & developer */}
        <div className="mb-3 md:mb-0">
          © {new Date().getFullYear()} Smart Attendance System | Designed & Developed by{" "}
          <strong>Vinod Nangare</strong>
        </div>

        {/* Right side: social icons */}
        <div className="flex gap-4">
          <a
            href="https://www.linkedin.com/in/vinod-nangare-7ab09626a/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-black transition-colors"
          >
            <FaLinkedin size={20} />
          </a>
          <a
            href="https://github.com/vinodnangare"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-black transition-colors"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="mailto:vinodnangare01@gmail.com"
            className="text-gray-500 hover:text-black transition-colors"
          >
            <FaEnvelope size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
