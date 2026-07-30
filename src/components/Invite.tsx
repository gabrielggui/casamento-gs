import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, RotateCcw } from 'lucide-react';
const closedInvite = 'assets/1000141698.jpg';
const openInvite = 'http://163.176.240.65/assets/f114d751-5333-4f23-bf43-5a8ea7bdc392.png';

export default function Invite() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const currentImage = isOpen ? openInvite : closedInvite;

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f5f0] text-stone-800 flex flex-col items-center justify-between overflow-hidden h-screen w-screen select-none">
      {/* Dynamic Ambient Blur Background based on current image - Light Mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-[#f7f5f0]">
        <motion.img 
          key={isOpen ? 'bg-open' : 'bg-closed'}
          src={currentImage} 
          alt="" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full object-cover scale-[1.8] blur-[60px] filter brightness-110 saturate-[1.2] origin-center"
        />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[10px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/20 to-white/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/60" />
      </div>

      {/* Top Bar Navigation */}
      <header className="w-full max-w-6xl px-4 py-4 md:px-8 flex items-center justify-between z-20">
        <button 
          onClick={() => navigate('/')}
          className="bg-white/80 hover:bg-white text-olive-green backdrop-blur-md px-4 py-2 rounded-full border border-olive-green/20 text-xs md:text-sm font-medium transition-all shadow-md flex items-center gap-2 cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Ir para o site</span>
        </button>

        <div className="text-center hidden sm:block">
          <span className="font-serif italic text-olive-green text-sm md:text-base tracking-wider font-semibold">Sara & Gabriel</span>
        </div>

        {isOpen && (
          <button 
            onClick={() => setIsOpen(false)}
            className="bg-white/80 hover:bg-white text-olive-green backdrop-blur-md px-3.5 py-2 rounded-full border border-olive-green/20 text-xs md:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Fechar convite</span>
          </button>
        )}
        {!isOpen && <div className="w-[100px] sm:w-[120px]" />}
      </header>

      {/* Main Container - Optimized for 2:3 Aspect Ratio Cards */}
      <main className="flex-1 w-full flex items-center justify-center px-4 py-2 relative z-10">
        <div className="relative flex items-center justify-center w-full h-full">
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div
                key="closed-card"
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setIsOpen(true)}
                className="group relative cursor-pointer flex flex-col items-center justify-center gap-4"
              >
                {/* 2:3 Aspect Ratio Card Wrapper */}
                <div className="relative aspect-[2/3] max-h-[68vh] md:max-h-[72vh] w-auto max-w-[calc(68vh*2/3)] md:max-w-[calc(72vh*2/3)] rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(85,107,47,0.3)] border border-white/60 ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-[1.015]">
                  <img 
                    src={closedInvite} 
                    alt="Convite Fechado - Sara & Gabriel" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Subtle Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20 opacity-30 group-hover:opacity-10 transition-opacity" />
                </div>

                {/* Interactive Call-to-action Button BELOW the photo */}
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="bg-olive-green group-hover:bg-[#435525] text-white backdrop-blur-md px-6 py-2.5 rounded-full font-serif text-sm md:text-base italic font-semibold shadow-xl border border-olive-green/30 flex items-center gap-2 transition-all group-hover:scale-105"
                >
                  <Sparkles size={16} className="text-amber-200 animate-pulse" />
                  <span>Clique para abrir o convite</span>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="open-card"
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => navigate('/')}
                className="group relative cursor-pointer flex flex-col items-center justify-center gap-4"
              >
                {/* 2:3 Aspect Ratio Open Card Wrapper */}
                <div className="relative aspect-[2/3] max-h-[76vh] md:max-h-[80vh] w-auto max-w-[calc(76vh*2/3)] md:max-w-[calc(80vh*2/3)] rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_25px_60px_-10px_rgba(85,107,47,0.35)] border border-white/60 ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-[1.015]">
                  <img 
                    src={openInvite} 
                    alt="Convite de Casamento - Sara & Gabriel" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Subtle Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom spacing */}
      <div className="pb-4 z-20" />
    </div>
  );
}
