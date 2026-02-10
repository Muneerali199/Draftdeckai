'use client';
import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Sparkles, Mail, FileText, Presentation, BookOpen, Heart, Shield, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20 border-t-2 border-gray-200/50 dark:border-gray-800/50 mt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3ccircle cx='30' cy='30' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                DocMagic
              </h3>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto sm:mx-0">
              AI-powered document creation platform. Create professional resumes, presentations, CVs, and letters in seconds.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
              <Link
                href="https://github.com/Muneerali199/DocMagic"
                className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <FaGithub className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/muneer-ali/"
                className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Link>
              <Link
                href="https://twitter.com"
                className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <FaTwitter className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Link>
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-4 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              Products
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/resume" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center justify-center sm:justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link href="/presentation" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center justify-center sm:justify-start gap-2">
                  <Presentation className="h-4 w-4" />
                  Presentations
                </Link>
              </li>
              <li>
                <Link href="/cv" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center justify-center sm:justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  CV Generator
                </Link>
              </li>
              <li>
                <Link href="/letter" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  Letter Composer
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center justify-center sm:justify-start gap-2">
                  <BookOpen className="h-4 w-4" />
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-4 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              Resources
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="https://github.com/Muneerali199/DocMagic/tree/main/docs" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="https://github.com/Muneerali199/DocMagic/discussions" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Community
                </Link>
              </li>
              <li>
                <Link href="https://github.com/Muneerali199/DocMagic/issues" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Report Issues
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div className="space-y-4 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              Company
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/contact" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="https://github.com/Muneerali199/DocMagic/graphs/contributors" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Contributors
                </Link>
              </li>
              <li>
                <Link href="https://github.com/Muneerali199/DocMagic/blob/main/LICENSE" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center justify-center sm:justify-start gap-2">
                  <Shield className="h-4 w-4" />
                  MIT License
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200/50 dark:border-gray-800/50 mb-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="text-sm sm:text-base text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} <span className="font-bold text-gray-900 dark:text-white">DraftDeckAI</span>. All rights reserved.
          </div>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />
            <span>by the DraftDeckAI Team</span>
          </div>
        </div>

        {/* Optional: Back to Top Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-4 w-4" />
            Back to Top
          </button>
        </div>
      </div>
    </footer>
  );
}
