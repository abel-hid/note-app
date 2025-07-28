'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const handleAuthClick = () => {
    if (currentUser) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-3xl p-8 sm:p-12 space-y-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                NotesFlow
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Advanced collaborative note-taking platform with Markdown support, real-time sharing, and powerful search capabilities.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleAuthClick}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg
                       transition-all duration-200 ease-in-out transform
                       hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                       active:scale-95 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <span>{currentUser ? 'Go to Dashboard' : 'Start Taking Notes'}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                id: 1,
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: "Markdown Editor",
                description: "Rich text editing with full Markdown support for beautiful, formatted notes"
              },
              {
                id: 2,
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                ),
                title: "Smart Sharing",
                description: "Share notes privately with specific users or make them publicly accessible"
              },
              {
                id: 3,
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: "Advanced Search",
                description: "Find notes instantly by title, content, or tags with powerful filtering options"
              }
            ].map((feature) => (
              <div 
                key={feature.id} 
                className="group bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-6 text-center 
                         transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-lg hover:-translate-y-1
                         hover:border-indigo-200"
              >
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl 
                              flex items-center justify-center mb-4 group-hover:from-indigo-200 group-hover:to-purple-200
                              transition-all duration-300">
                  <div className="text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-indigo-700 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Everything you need to organize your thoughts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                { icon: "🏷️", text: "Organize with tags and categories" },
                { icon: "🔒", text: "Private, shared, or public visibility" },
                { icon: "📱", text: "Responsive design for all devices" },
                { icon: "⚡", text: "Real-time collaborative editing" },
                { icon: "🎯", text: "Advanced search and filtering" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-xl bg-white/40 backdrop-blur-sm">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-gray-700 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
              <span className="text-sm font-medium text-indigo-700">
                Built with Next.js • FastAPI • JWT Authentication
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}