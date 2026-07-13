import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Gift, Check, X, ChevronLeft, ChevronRight, Copy, Search, SlidersHorizontal } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// --- PIX helper ---
function generatePixPayload(key: string, amount: number, senderName: string, productNames: string): string {
  const format = (id: string, value: string) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  const sanitizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");

  const keyClean = key.replace(/[^0-9]/g, '');
  const senderClean = sanitizeStr(senderName) || 'Presente';
  const desc = `${senderClean} - ${sanitizeStr(productNames)}`.substring(0, 30);
  
  let accountInfo = format('00', 'br.gov.bcb.pix') + format('01', keyClean);
  if (desc) {
     accountInfo += format('02', desc);
  }

  let payload = format('00', '01') +
                format('26', accountInfo) +
                format('52', '0000') +
                format('53', '986') +
                format('54', amount.toFixed(2)) +
                format('58', 'BR') +
                format('59', 'Gabriel e Sara') +
                format('60', 'Brasil') +
                format('62', format('05', '***'));

  payload += '6304';

  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) > 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  const crcStr = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return payload + crcStr;
}

// --- DATA ---
type Product = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  imageFallback: string; // Used for placeholder
  imageUrl: string;
  category: string;
};

const PRODUCTS: Product[] = [
  { id: '1', name: 'Jogo de Xícaras de Âmbar', price: 195.00, available: true, imageFallback: 'JX', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGU9xdf_CNWDwmd5hQfak05QpwUIQxE_kHYzTR_LYk3m-QejF_mexIxHY&s=10', category: 'Cozinha' },
  { id: '2', name: 'Aspirador de Pó e Água Vertical PAS3000 Philco', price: 325.00, available: true, imageFallback: 'AP', imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600&auto=format&fit=crop', category: 'Eletrodomésticos' },
  { id: '3', name: 'Fondue Romântico nas Montanhas', price: 325.00, available: true, imageFallback: 'FR', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQY2qWjTug6o8ubI-yuYcM-FQ9zbZvD_8S-F7RVyutuFM6PGpCYcoY6DQc&s=10', category: 'Gastronomia & Experiências' },
  { id: '4', name: 'Degustação de Vinhos e Espumantes', price: 260.00, available: true, imageFallback: 'DV', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600&auto=format&fit=crop', category: 'Gastronomia & Experiências' },
  { id: '5', name: 'Café Colonial Completo', price: 234.00, available: true, imageFallback: 'CC', imageUrl: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/20/05/b7/7f/siga-nosso-instagram.jpg?w=500&h=-1&s=1', category: 'Gastronomia & Experiências' },
  { id: '6', name: 'Chá da Tarde no Palácio', price: 195.00, available: true, imageFallback: 'CT', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQla66fmKotVM62OampjFFdppWo29Rz5Qcl0W9Rqchz0w&s=10', category: 'Gastronomia & Experiências' },
  { id: '7', name: 'Noite Italiana', price: 325.00, available: true, imageFallback: 'NI', imageUrl: 'https://noiteitaliana.tur.br/wp-content/uploads/2019/03/IMG_3730_menor234.jpg', category: 'Gastronomia & Experiências' },
  { id: '8', name: 'Massagem Relaxante para o Casal', price: 390.00, available: true, imageFallback: 'MR', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop', category: 'Aconchego & Bem-Estar' },
  { id: '9', name: 'Banho de Imersão e Hidratação', price: 234.00, available: true, imageFallback: 'BI', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3OsRRt467dj-MM3Jmmqb7TAAXq0TqpaN0wSUpwwxY6os0cFDezKjskjHb&s=10', category: 'Aconchego & Bem-Estar' },
  { id: '10', name: 'Ingresso para o Snowland', price: 390.00, available: true, imageFallback: 'IS', imageUrl: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/06/79/71/7a/snowland.jpg?w=900&h=500&s=1', category: 'Passeios & Aventura' },
  { id: '11', name: 'Passeio de Maria Fumaça', price: 364.00, available: true, imageFallback: 'MF', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4wLUCzuWKplVX76tnI10m6z4EhxdsmTH-qTvhmU5trpWdtjv5mHb7aXI&s=10', category: 'Passeios & Aventura' },
  { id: '12', name: 'Visita ao Mundo a Vapor / Mini Mundo', price: 208.00, available: true, imageFallback: 'MM', imageUrl: 'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnAlnGcwQj5jCkXAd10n0WtI-JaBwm8rbNOwrPnzDpxtE0wOU9YZF-obOY_mKNthXJa0VtqSpWGh--lASoQDZqCf84egkpUVvFwXPQUP6gQJPDzVFyu8NeY9_g0hYI9zc0afxI_=s1370-w768-h1370-rw', category: 'Passeios & Aventura' },
  { id: '13', name: 'Passeio Privativo pelos Cânions', price: 390.00, available: true, imageFallback: 'PC', imageUrl: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/5a/ba/09/caption.jpg?w=1200&h=-1&s=1', category: 'Passeios & Aventura' },
  { id: '14', name: 'Foto Profissional de Casal', price: 364.00, available: true, imageFallback: 'FP', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop', category: 'Gestos de Carinho' },
  { id: '15', name: 'Buquê de Flores no Quarto', price: 156.00, available: true, imageFallback: 'BF', imageUrl: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=600&auto=format&fit=crop', category: 'Gestos de Carinho' },
  { id: '16', name: 'Transporte Confortável', price: 260.00, available: true, imageFallback: 'TC', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=600&auto=format&fit=crop', category: 'Gestos de Carinho' },
  { id: '17', name: 'Caixa de Chocolates Artesanais', price: 99.00, available: true, imageFallback: 'CH', imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=600&auto=format&fit=crop', category: 'Gestos de Carinho' },
  { id: '18', name: 'Jogo De Pratos Fundos Em Porcelana Ryo Com 6 Peças', price: 199.00, available: true, imageFallback: 'JP', imageUrl: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcScxP3_hg2eiUV5EuZwJuHY2ktM3_8PbVp3XvaNkZC6L4-4YbvjaPUXRrXrgr-0iOkOK7XaADA2WmLsUv6iWdPbT7ns6_Kz__4KOFT985EBs0I6V_JRX7itXEI', category: 'Cozinha' },
  { id: '19', name: 'Bebedouro de Água Esmaltec', price: 696.00, available: true, imageFallback: 'BA', imageUrl: 'https://m.magazineluiza.com.br/a-static/420x420/bebedouro-de-agua-esmaltec-de-coluna-refrigerado-por-compressor-egc35b/magazineluiza/010300601/a576ff560c4150012e9d9215562ddf09.jpg', category: 'Eletrodomésticos' }
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'cart' | 'name' | 'pix' | 'thanks'>('cart');
  const [senderName, setSenderName] = useState('');
  const [pixPayload, setPixPayload] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc'>('name');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [visibleCount, setVisibleCount] = useState(12);
  const [isCopied, setIsCopied] = useState(false);
  
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const categories = ['Todos', ...Array.from(new Set(PRODUCTS.map(p => p.category))).sort()];

  const totalAmount = selectedItems.reduce((acc, id) => {
    const product = PRODUCTS.find(p => p.id === id);
    return acc + (product?.price || 0);
  }, 0);

  const handleOpenCart = () => {
    setModalStep('cart');
    setIsModalOpen(true);
  };

  const handleCheckoutName = () => {
    setModalStep('name');
  };

  const handleGeneratePix = () => {
    if (!senderName.trim()) return;
    const productNames = selectedItems.map(id => PRODUCTS.find(p => p.id === id)?.name).filter(Boolean).join(', ');
    const pixKey = import.meta.env.VITE_PIX_KEY || '70516665413';
    const payload = generatePixPayload(pixKey, totalAmount, senderName, productNames);
    setPixPayload(payload);
    setModalStep('pix');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      categoriesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Simulate loading for the splash screen
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Both the header background and the title now trigger at the same scroll point (350px)
      setIsScrolled(scrollY > 350);
      setIsTitleVisible(scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handlePresentear = (id: string, available: boolean) => {
    if (!available) return;
    setSelectedItems((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const filteredProducts = PRODUCTS
    .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      return 0;
    });

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-off-white"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="text-olive-green flex flex-col items-center gap-4"
            >
              <svg 
                className="w-24 md:w-32 h-auto text-olive-green drop-shadow-sm"
                viewBox="0 0 233 277" 
                preserveAspectRatio="xMidYMid meet"
              >
                <g transform="translate(0,277) scale(0.1,-0.1)" fill="currentColor" stroke="none">
                  <path d="M1046 2744 c-135 -33 -258 -134 -319 -261 -29 -63 -32 -78 -35 -186 -3 -88 0 -129 12 -164 19 -56 20 -63 3 -63 -28 0 -176 -81 -253 -138 -449 -337 -555 -968 -243 -1442 171 -261 424 -425 733 -475 271 -44 567 24 771 178 70 53 183 168 210 215 11 17 23 32 27 32 4 0 8 -62 8 -138 0 -158 -1 -155 89 -225 l61 -48 0 481 c0 425 2 486 16 516 19 39 53 60 113 70 102 16 34 24 -209 24 -172 0 -259 -3 -255 -10 3 -5 16 -10 28 -10 36 0 93 -19 114 -38 12 -9 26 -35 32 -57 12 -44 14 -350 2 -431 -10 -74 -62 -155 -161 -254 -155 -155 -319 -226 -546 -237 -572 -29 -1121 552 -1080 1144 21 304 168 568 401 716 64 40 157 87 175 87 3 0 22 -23 40 -52 51 -79 151 -179 279 -281 294 -233 407 -361 452 -509 32 -103 24 -230 -19 -322 -96 -206 -352 -284 -571 -175 -115 58 -196 151 -241 277 -13 34 -27 62 -32 62 -5 0 -8 -62 -7 -145 l2 -146 28 -20 c39 -28 131 -67 214 -92 58 -18 95 -21 220 -21 129 0 158 4 209 22 153 56 265 171 316 323 19 55 22 81 18 189 l-4 125 -47 98 c-42 86 -61 111 -150 201 -56 56 -153 143 -216 192 -208 162 -345 293 -327 311 12 12 215 4 286 -13 193 -43 375 -148 530 -304 64 -66 115 -135 194 -262 16 -27 19 -28 101 -28 52 0 85 4 85 10 0 6 -14 39 -31 73 -127 251 -362 459 -616 547 -181 62 -407 75 -579 34 -18 -5 -25 4 -47 55 -95 218 17 470 232 522 80 20 185 15 252 -10 105 -40 198 -145 235 -266 10 -33 22 -64 26 -70 5 -5 7 58 6 140 l-3 150 -70 37 c-133 70 -320 96 -459 62z"/>
                </g>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="min-h-screen relative pb-24 flex flex-col"
        >
          {/* Header */}
          <header className={`h-[80px] w-full flex items-center justify-center fixed top-0 z-30 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-[#556B2F1A] shadow-sm' : 'bg-gradient-to-b from-black/50 to-transparent border-transparent'}`}>
            <div className={`transition-all duration-500 ${isTitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center justify-center h-[50px] relative">
                <svg 
                  className="h-full w-auto drop-shadow-sm text-olive-green"
                  viewBox="0 0 233 277" 
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g transform="translate(0,277) scale(0.1,-0.1)" fill="currentColor" stroke="none">
                    <path d="M1046 2744 c-135 -33 -258 -134 -319 -261 -29 -63 -32 -78 -35 -186 -3 -88 0 -129 12 -164 19 -56 20 -63 3 -63 -28 0 -176 -81 -253 -138 -449 -337 -555 -968 -243 -1442 171 -261 424 -425 733 -475 271 -44 567 24 771 178 70 53 183 168 210 215 11 17 23 32 27 32 4 0 8 -62 8 -138 0 -158 -1 -155 89 -225 l61 -48 0 481 c0 425 2 486 16 516 19 39 53 60 113 70 102 16 34 24 -209 24 -172 0 -259 -3 -255 -10 3 -5 16 -10 28 -10 36 0 93 -19 114 -38 12 -9 26 -35 32 -57 12 -44 14 -350 2 -431 -10 -74 -62 -155 -161 -254 -155 -155 -319 -226 -546 -237 -572 -29 -1121 552 -1080 1144 21 304 168 568 401 716 64 40 157 87 175 87 3 0 22 -23 40 -52 51 -79 151 -179 279 -281 294 -233 407 -361 452 -509 32 -103 24 -230 -19 -322 -96 -206 -352 -284 -571 -175 -115 58 -196 151 -241 277 -13 34 -27 62 -32 62 -5 0 -8 -62 -7 -145 l2 -146 28 -20 c39 -28 131 -67 214 -92 58 -18 95 -21 220 -21 129 0 158 4 209 22 153 56 265 171 316 323 19 55 22 81 18 189 l-4 125 -47 98 c-42 86 -61 111 -150 201 -56 56 -153 143 -216 192 -208 162 -345 293 -327 311 12 12 215 4 286 -13 193 -43 375 -148 530 -304 64 -66 115 -135 194 -262 16 -27 19 -28 101 -28 52 0 85 4 85 10 0 6 -14 39 -31 73 -127 251 -362 459 -616 547 -181 62 -407 75 -579 34 -18 -5 -25 4 -47 55 -95 218 17 470 232 522 80 20 185 15 252 -10 105 -40 198 -145 235 -266 10 -33 22 -64 26 -70 5 -5 7 58 6 140 l-3 150 -70 37 c-133 70 -320 96 -459 62z"/>
                  </g>
                </svg>
              </div>
            </div>
          </header>

          {/* Hero Image */}
          <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/30 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-off-white via-transparent to-transparent z-10"></div>
            <img 
              src="https://casamentogabrielesara.com.br/assets/IMG-20260711-WA0006.jpg" 
              alt="Sara e Gabriel"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className={`relative z-20 text-center text-white px-4 flex flex-col items-center transition-all duration-700 ${isTitleVisible ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1.2 }}
              >
                <div className="font-serif text-[48px] md:text-[64px] italic font-light drop-shadow-lg mb-2">
                  Sara & Gabriel
                </div>
                <div className="font-sans text-[14px] md:text-[16px] uppercase tracking-[6px] font-light mt-4 drop-shadow-md">
                  12 de Setembro de 2026
                </div>
              </motion.div>
            </div>
          </section>

          {/* Dedication Section */}
          <section className="pt-[60px] pb-[40px] px-4 text-center max-w-[800px] mx-auto flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="flex justify-center items-center mb-[24px]">
                <div className="relative flex items-center justify-center">
                  <div className="w-[100px] h-[100px] rounded-full border-[3px] border-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] overflow-hidden z-20 translate-x-[15px] bg-sage-soft">
                    <img 
                      src="https://casamentogabrielesara.com.br/assets/file-00000000033c71f5ad4dbc8b6e1042c8.png" 
                      alt="Sara" 
                      className="w-full h-full object-cover transition-all duration-500 hover:scale-110" 
                    />
                  </div>
                  <div className="w-[100px] h-[100px] rounded-full border-[3px] border-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] overflow-hidden z-10 -translate-x-[15px] bg-sage-soft">
                    <img 
                      src="https://casamentogabrielesara.com.br/assets/IMG-20260711-WA0004-2.jpg" 
                      alt="Gabriel" 
                      className="w-full h-full object-cover transition-all duration-500 hover:scale-110" 
                    />
                  </div>
                </div>
              </div>

              <h2 className="font-serif text-[24px] md:text-[28px] text-olive-green italic mb-[20px]">
                Aos Nossos Amados Familiares e Amigos 💖,
              </h2>
              <p className="text-[#666] text-[15px] md:text-[16px] font-light leading-[1.8] mb-[20px] text-justify md:text-center">
                Se vocês estão aqui, é porque de alguma forma entrelaçaram suas histórias com a nossa. Celebrar nosso amor sem a presença, as risadas e as bênçãos de vocês não teria o mesmo sentido. Cada sorriso compartilhado nos trouxe até esse momento mágico. Preparamos este espaço com todo o nosso coração, para que possam sonhar nossos sonhos junto conosco.
              </p>
              <div className="w-full flex justify-end mb-[30px] pr-4 md:pr-10">
                <div className="font-serif text-[20px] md:text-[24px] text-olive-green italic">— Sara & Gabriel</div>
              </div>
              <div className="divider-floral mb-[20px]"></div>
            </motion.div>
          </section>

          {/* RSVP Section */}
          <section className="pt-[20px] pb-[40px] px-4 text-center max-w-[800px] mx-auto flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="bg-[#F8FAF6] w-full rounded-[16px] p-8 md:p-12 border border-[#EAEFE4] shadow-sm flex flex-col items-center"
            >
              <h2 className="font-serif text-[28px] md:text-[32px] text-olive-green mb-[16px]">
                Sua Presença é Muito Importante
              </h2>
              <p className="text-[#666] text-[15px] md:text-[16px] font-light leading-[1.6] mb-[28px] max-w-[500px]">
                Saber que estarão ao nosso lado no dia mais feliz de nossas vidas é o que torna esse sonho completo. Por favor, nos ajudem a preparar uma noite inesquecível confirmando sua presença abaixo.
              </p>
              <a
                href={import.meta.env.VITE_RSVP_URL || 'https://forms.google.com/'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-[14px] px-[36px] rounded-[8px] bg-olive-green text-white font-semibold uppercase tracking-[2px] text-[14px] hover:bg-olive-dark shadow-[0_4px_14px_rgba(85,107,47,0.3)] transition-all cursor-pointer"
              >
                Confirmar Presença 💌
              </a>
            </motion.div>
          </section>

          <div className="divider-floral my-[40px]"></div>

          {/* Intro Section */}
          <section className="pt-[10px] pb-[40px] px-4 text-center max-w-[700px] mx-auto flex flex-col items-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="font-serif text-[36px] text-olive-green mb-[12px]"
            >
              Ajudem a Construir Nosso Sonho
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[#666] text-[15px] md:text-[16px] font-light leading-[1.6]"
            >
              Ter vocês dividindo essa emoção já é o maior presente que poderíamos receber! Porém, aos que desejarem nos abençoar com um presente, separamos com carinho algumas opções abaixo: 🎁
            </motion.p>
          </section>

          {/* Filters & Product Grid */}
          <section className="px-4 md:px-10 flex-grow pb-20">
            <div className="flex flex-col mb-8 max-w-[1200px] mx-auto bg-white p-[6px] md:p-3 rounded-[24px] xl:rounded-[36px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#EAEFE4] overflow-hidden">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0">
                {/* Search */}
                <div className="w-full md:flex-1 relative flex items-center bg-[#FAFBF9] rounded-[18px] xl:rounded-l-[28px] xl:rounded-r-none px-5 py-[14px] transition-all border border-transparent focus-within:border-olive-green focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(85,107,47,0.1)]">
                  <Search size={18} strokeWidth={2.5} className="text-[#A0B090] mr-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar presente... 🔍"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleCount(12);
                    }}
                    className="w-full bg-transparent border-none focus:outline-none text-[15px] text-anthracite placeholder:text-[#A0B090] placeholder:font-light font-medium"
                  />
                </div>
                
                {/* Divider for desktop */}
                <div className="hidden md:block w-px h-[24px] bg-[#EAEFE4] mx-2 self-center shrink-0"></div>
                
                {/* Sort */}
                <div className="w-full md:w-auto relative flex items-center bg-[#FAFBF9] md:bg-transparent rounded-[18px] xl:rounded-r-[28px] xl:rounded-l-none px-5 py-[14px] hover:bg-[#F2F5F0] transition-colors cursor-pointer group">
                  <SlidersHorizontal size={18} strokeWidth={2.5} className="text-[#A0B090] mr-3 shrink-0 group-hover:text-olive-green transition-colors" />
                  <span className="text-[14px] text-[#A0B090] whitespace-nowrap mr-2 select-none group-hover:text-olive-green transition-colors">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full md:w-auto md:min-w-[150px] bg-transparent border-none focus:outline-none text-[15px] text-anthracite font-medium cursor-pointer appearance-none outline-none pr-6 mix-blend-multiply"
                  >
                    <option value="name">Alfabética (A-Z)</option>
                    <option value="priceAsc">Menor Preço ⬇️</option>
                    <option value="priceDesc">Maior Preço ⬆️</option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-5 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity text-olive-green flex items-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Divider between search and categories */}
              <div className="hidden md:block w-[96%] h-px bg-[#EAEFE4] mx-auto mt-4 mb-3"></div>

              {/* Categories */}
              <div className="relative pt-3 md:pt-2 pb-1 group">
                <div 
                  ref={categoriesRef}
                  onScroll={handleScroll}
                  className="flex overflow-x-auto pb-3 md:pb-1 px-4 md:px-6 md:flex-wrap md:justify-center gap-2 md:gap-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-12 md:pr-4 relative z-10"
                >
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={(e) => {
                        setSelectedCategory(cat);
                        setVisibleCount(12);
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                      }}
                      className={`whitespace-nowrap px-4 py-[8px] rounded-full text-[13px] font-medium tracking-[0.5px] transition-all duration-300 border shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-olive-green text-white border-olive-green shadow-[0_4px_10px_rgba(85,107,47,0.2)]'
                          : 'bg-[#FAFBF9] text-[#666] border-[#EAEFE4] hover:border-olive-green hover:text-olive-green shadow-sm'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {/* Fade edges for mobile scroll indication */}
                {showRightArrow && (
                  <div className="absolute right-0 top-0 bottom-1 w-20 bg-gradient-to-l from-white via-white/80 to-transparent md:hidden pointer-events-none flex items-center justify-end pr-3 text-olive-green pb-2 z-20">
                    <button 
                      onClick={() => scrollCategories('right')}
                      className="pointer-events-auto bg-white/90 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center justify-center w-8 h-8 border border-[#EAEFE4] ml-auto hover:bg-[#F8FAF6] transition-colors"
                    >
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
                {showLeftArrow && (
                  <div className="absolute left-0 top-0 bottom-1 w-20 bg-gradient-to-r from-white via-white/80 to-transparent md:hidden pointer-events-none flex items-center justify-start pl-3 text-olive-green pb-2 z-20">
                    <button 
                      onClick={() => scrollCategories('left')}
                      className="pointer-events-auto bg-white/90 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center justify-center w-8 h-8 border border-[#EAEFE4] mr-auto hover:bg-[#F8FAF6] transition-colors"
                    >
                      <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 max-w-[1200px] mx-auto pb-2">
                {filteredProducts
                  .slice(0, visibleCount)
                  .map((product, index) => {
                  const isSelected = selectedItems.includes(product.id);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05, duration: 0.6 }}
                      className={`bg-white rounded-[12px] p-3 md:p-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col h-full border transition-all duration-300 ${isSelected ? 'border-olive-green' : 'border-transparent'}`}
                    >
                      <div className={`w-full h-[100px] md:h-[150px] rounded-[8px] mb-2 md:mb-[12px] flex items-center justify-center text-[24px] text-sage-soft overflow-hidden relative shrink-0 ${isSelected ? 'bg-[#F8FAF6]' : 'bg-[#F0F2ED]'}`}>
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                      </div>
                      <div className="flex flex-col flex-grow text-left">
                        <h3 className="text-xs md:text-[14px] font-semibold mb-1 md:mb-[4px] text-anthracite line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-[#888] text-[11px] md:text-[13px] mb-2 md:mb-[12px]">
                          {formatPrice(product.price)}
                        </p>
                        <div className="flex flex-col mt-auto pt-2 md:pt-4">
                          <button
                            onClick={() => handlePresentear(product.id, product.available)}
                            className={`w-full py-2 md:py-[10px] rounded-[6px] text-[10px] md:text-[12px] font-semibold uppercase tracking-[1px] cursor-pointer transition-all flex items-center justify-center gap-1 md:gap-[6px]
                              ${
                                isSelected
                                  ? 'bg-transparent border border-olive-green text-olive-green'
                                  : 'bg-olive-green text-white border border-transparent hover:opacity-90'
                              }
                            `}
                          >
                            {isSelected ? (
                              <>
                                <Check size={14} strokeWidth={3} /> Selecionado ✅
                              </>
                            ) : (
                              'Presentear 🎁'
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <AnimatePresence>
                {filteredProducts.length > visibleCount && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-4 z-10 pointer-events-none"
                  >
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="pointer-events-auto py-[14px] px-[36px] rounded-[8px] bg-white border border-[#EAEFE4] text-olive-green font-semibold uppercase tracking-[1px] text-[13px] hover:bg-[#F8FAF6] shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition-all cursor-pointer mb-2"
                    >
                      Exibir Mais Presentes 💝
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col items-center justify-center text-[12px] text-[#999] font-light pb-[30px] pt-[20px] mt-auto">
            <svg 
              className="w-10 h-auto text-olive-green mb-4 drop-shadow-sm opacity-80"
              viewBox="0 0 233 277" 
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform="translate(0,277) scale(0.1,-0.1)" fill="currentColor" stroke="none">
                <path d="M1046 2744 c-135 -33 -258 -134 -319 -261 -29 -63 -32 -78 -35 -186 -3 -88 0 -129 12 -164 19 -56 20 -63 3 -63 -28 0 -176 -81 -253 -138 -449 -337 -555 -968 -243 -1442 171 -261 424 -425 733 -475 271 -44 567 24 771 178 70 53 183 168 210 215 11 17 23 32 27 32 4 0 8 -62 8 -138 0 -158 -1 -155 89 -225 l61 -48 0 481 c0 425 2 486 16 516 19 39 53 60 113 70 102 16 34 24 -209 24 -172 0 -259 -3 -255 -10 3 -5 16 -10 28 -10 36 0 93 -19 114 -38 12 -9 26 -35 32 -57 12 -44 14 -350 2 -431 -10 -74 -62 -155 -161 -254 -155 -155 -319 -226 -546 -237 -572 -29 -1121 552 -1080 1144 21 304 168 568 401 716 64 40 157 87 175 87 3 0 22 -23 40 -52 51 -79 151 -179 279 -281 294 -233 407 -361 452 -509 32 -103 24 -230 -19 -322 -96 -206 -352 -284 -571 -175 -115 58 -196 151 -241 277 -13 34 -27 62 -32 62 -5 0 -8 -62 -7 -145 l2 -146 28 -20 c39 -28 131 -67 214 -92 58 -18 95 -21 220 -21 129 0 158 4 209 22 153 56 265 171 316 323 19 55 22 81 18 189 l-4 125 -47 98 c-42 86 -61 111 -150 201 -56 56 -153 143 -216 192 -208 162 -345 293 -327 311 12 12 215 4 286 -13 193 -43 375 -148 530 -304 64 -66 115 -135 194 -262 16 -27 19 -28 101 -28 52 0 85 4 85 10 0 6 -14 39 -31 73 -127 251 -362 459 -616 547 -181 62 -407 75 -579 34 -18 -5 -25 4 -47 55 -95 218 17 470 232 522 80 20 185 15 252 -10 105 -40 198 -145 235 -266 10 -33 22 -64 26 -70 5 -5 7 58 6 140 l-3 150 -70 37 c-133 70 -320 96 -459 62z"/>
              </g>
            </svg>
            <div className="font-serif text-olive-green italic mb-[2px] text-[18px]">Com carinho, Sara e Gabriel ❤️</div>
          </footer>

          {/* Floating Cart */}
          <AnimatePresence>
            {selectedItems.length > 0 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={handleOpenCart}
                className="fixed bottom-[40px] right-[40px] w-[64px] h-[64px] bg-olive-green rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(85,107,47,0.3)] cursor-pointer z-40 border-none outline-none"
              >
                <div className="relative">
                  <Gift color="white" size={24} strokeWidth={2} />
                  <span className="absolute -top-[6px] -right-[10px] bg-sage-soft text-white w-[22px] h-[22px] rounded-full text-[11px] font-bold flex items-center justify-center border-2 border-white">
                    {selectedItems.length}
                  </span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-anthracite"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[16px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                {modalStep !== 'cart' ? (
                  <button onClick={() => setModalStep(modalStep === 'pix' ? 'name' : 'cart')} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <ChevronLeft size={24} />
                  </button>
                ) : (
                  <div className="w-6"></div>
                )}
                <h2 className="font-serif text-[20px] text-olive-green text-center flex-grow">
                  {modalStep === 'cart' ? 'Itens Selecionados 🎁' : modalStep === 'name' ? 'Identificação 📝' : 'Pagamento PIX 💸'}
                </h2>
                <button onClick={() => {
                  setIsModalOpen(false);
                  if (modalStep === 'pix') {
                    setSelectedItems([]);
                    setSenderName('');
                    setTimeout(() => setModalStep('cart'), 300);
                  }
                }} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow max-h-[50vh]">
                {modalStep === 'cart' && (
                  <div className="flex flex-col gap-4">
                    {selectedItems.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-[14px]">Sua sacolinha de carinho está vazia.</p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3">
                          {selectedItems.map(id => {
                            const item = PRODUCTS.find(p => p.id === id);
                            if (!item) return null;
                            return (
                              <div key={id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <span className="text-[14px] font-medium text-anthracite">{item.name}</span>
                                <span className="text-[14px] font-semibold text-olive-green whitespace-nowrap ml-4">{formatPrice(item.price)}</span>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-[16px] font-semibold text-anthracite uppercase tracking-wide">Total</span>
                          <span className="text-[20px] font-bold text-olive-green">{formatPrice(totalAmount)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {modalStep === 'name' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[14px] text-gray-500 mb-2 text-center leading-relaxed">
                      Por favor, nos diga quem está enviando este mimo para podermos agradecer de coração. 🥰
                    </p>
                    <input 
                      type="text" 
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      maxLength={20}
                      placeholder="Ex: João e Maria"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-olive-green focus:ring-1 focus:ring-olive-green transition-all text-[14px]"
                      autoFocus
                    />
                  </div>
                )}

                {modalStep === 'pix' && (
                  <div className="flex flex-col items-center gap-6">
                    <div className="text-center mb-2">
                      <h3 className="font-serif text-[24px] text-olive-green italic mb-2">Obrigado(a), {senderName.split(' ')[0]}! ❤️</h3>
                      <p className="text-[14px] text-gray-500 leading-relaxed">
                        Recebemos seu presente com muita alegria. Utilize o QR Code ou copie a chave PIX abaixo para nos presentear com <strong className="text-olive-green">{formatPrice(totalAmount)}</strong>.
                      </p>
                    </div>

                    <div className="w-full bg-[#FAFBF9] p-4 rounded-xl border border-[#EAEFE4] relative">
                      <p className="text-[11px] text-gray-400 mb-2 font-bold uppercase tracking-[1.5px] text-center">PIX Copia e Cola 📋</p>
                      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-[#F0F2ED] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <input 
                          type="text" 
                          readOnly 
                          value={pixPayload}
                          className="w-full bg-transparent px-2 text-[12px] text-gray-600 outline-none font-mono truncate"
                        />
                        <button 
                          onClick={handleCopyPix}
                          className={`${isCopied ? 'bg-[#EAEFE4] text-olive-green' : 'bg-olive-green text-white hover:bg-[#4A5E3F]'} px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer flex-shrink-0 flex items-center gap-2 shadow-sm`}
                        >
                          {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          <span className="hidden sm:inline">{isCopied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[1.5px] text-center">Ou Escaneie o QR Code</p>
                      <div className="bg-white p-5 border border-[#EAEFE4] rounded-[24px] shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-transform hover:scale-105 duration-300">
                        <QRCodeSVG value={pixPayload} size={180} />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {modalStep !== 'pix' && (
              <div className="p-6 border-t border-gray-100 bg-white">
                {modalStep === 'cart' && (
                  <button 
                    onClick={handleCheckoutName}
                    disabled={selectedItems.length === 0}
                    className={`w-full py-[12px] rounded-[8px] font-semibold uppercase tracking-[1px] text-[13px] transition-all
                      ${selectedItems.length === 0 ? 'bg-[#EEE] text-[#AAA] cursor-not-allowed' : 'bg-olive-green text-white hover:bg-olive-dark shadow-[0_4px_14px_rgba(85,107,47,0.3)] cursor-pointer'}
                    `}
                  >
                    Concluir Presente ✨
                  </button>
                )}

                {modalStep === 'name' && (
                  <button 
                    onClick={handleGeneratePix}
                    disabled={senderName.trim().length < 3}
                    className={`w-full py-[12px] rounded-[8px] font-semibold uppercase tracking-[1px] text-[13px] transition-all
                      ${senderName.trim().length < 3 ? 'bg-[#EEE] text-[#AAA] cursor-not-allowed' : 'bg-olive-green text-white hover:bg-olive-dark shadow-[0_4px_14px_rgba(85,107,47,0.3)] cursor-pointer'}
                    `}
                  >
                    Gerar PIX ✨
                  </button>
                )}

              </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
