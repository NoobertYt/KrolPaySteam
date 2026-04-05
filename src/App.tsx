import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, doc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { 
  Users, 
  Wallet, 
  Bolt, 
  Percent, 
  ShieldCheck, 
  Gift, 
  ChevronDown, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ClipboardList,
  Headset,
  Gamepad2,
  Star,
  Send,
  Mail,
  MessageSquare,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

// --- Types ---
interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  initial: string;
  gradient: string;
}

interface FAQData {
  id: number;
  question: string;
  answer: string;
}

interface Order {
  id: string;
  user: string;
  amount: number;
  time: string;
}

// --- Constants ---
const CONFIG = {
  rate: 1.7,
  initialClientsCount: 1000,
  initialTotalAmount: 542800,
  webhookUrl: "https://discord.com/api/webhooks/1337126107543113730/1JgKSZi4fKDYZnRXq9Dy60mHFMumh2gjPr48T02uvu9113WfHyzbU6CJf2dDei5Uy6gL",
  discountRate: 0.05,
  promoCode: "kotokrol"
};

const REVIEWS: Review[] = [
  {
    id: 1,
    name: "Иван",
    rating: 5,
    text: "Пополнил за 2 минуты, всё быстро и удобно! Менеджер ответил моментально, деньги пришли на счет сразу после оплаты.",
    initial: "И",
    gradient: "from-[#ffd57a] to-[#ff9bd6]"
  },
  {
    id: 2,
    name: "Алина",
    rating: 5,
    text: "Менеджер сразу написал в телеграм, всё супер! Объяснил каждый шаг, помог с выбором суммы. Обязательно воспользуюсь ещё.",
    initial: "А",
    gradient: "from-[#9be6ff] to-[#647eff]"
  },
  {
    id: 3,
    name: "Дмитрий",
    rating: 5,
    text: "С промокодом KotoKrol ещё и скидка, топ! Сэкономил прилично, по сравнению с официальными способами пополнения.",
    initial: "Д",
    gradient: "from-[#ff9bd6] to-[#9be6ff]"
  }
];

const FAQ_LIST: FAQData[] = [
  {
    id: 1,
    question: "Как быстро придут средства?",
    answer: "Обычно пополнение происходит в течение 5-15 минут после подтверждения оплаты. В редких случаях, при высокой нагрузке на сервера Steam, это может занять до 1 часа."
  },
  {
    id: 2,
    question: "Это безопасно?",
    answer: "Да, наш сервис полностью безопасен. Мы не запрашиваем пароль от вашего аккаунта Steam, только логин. Все операции проводятся в соответствии с правилами платформы."
  },
  {
    id: 3,
    question: "Какие способы оплаты вы принимаете?",
    answer: "Мы принимаем оплату через банковские карты (Visa, Mastercard, Мир), Qiwi, ЮMoney, а также криптовалюту (Bitcoin, USDT). После оформления заказа менеджер предложит доступные варианты."
  }
];

const RECENT_ORDERS: Order[] = [
  { id: '1', user: 'Alex***', amount: 500, time: '2 мин. назад' },
  { id: '2', user: 'Dmit***', amount: 1200, time: '5 мин. назад' },
  { id: '3', user: 'Svet***', amount: 300, time: '8 мин. назад' },
  { id: '4', user: 'Ivan***', amount: 2500, time: '12 мин. назад' },
];

// --- Components ---

const Background = () => (
  <div className="bg-glow">
    <div className="glow-orb w-[500px] h-[500px] bg-[#ffd57a] top-[-10%] left-[-10%]" />
    <div className="glow-orb w-[400px] h-[400px] bg-[#ff9bd6] bottom-[-5%] right-[-5%] [animation-delay:2s]" />
    <div className="glow-orb w-[300px] h-[300px] bg-[#9be6ff] top-[40%] right-[10%] [animation-delay:4s]" />
    <div className="glow-orb w-[350px] h-[350px] bg-[#647eff] bottom-[20%] left-[5%] [animation-delay:6s]" />
  </div>
);

const Notification = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-400" />,
    error: <AlertCircle className="text-rose-400" />,
    info: <Info className="text-cyan-400" />
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-4 right-4 z-50 glass rounded-xl p-4 shadow-xl flex items-center gap-3 min-w-[250px]"
    >
      {icons[type]}
      <p className="text-sm text-slate-100">{message}</p>
      <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white">
        <X size={16} />
      </button>
    </motion.div>
  );
};

const Modal = ({ title, content, isOpen, onClose }: { title: string, content: ReactNode, isOpen: boolean, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-2xl p-6 max-w-md w-full relative z-10"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X />
              </button>
            </div>
            <div className="text-slate-300 mb-6 space-y-2">
              {content}
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn-primary px-6 py-2 rounded-xl">Понятно</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface FAQItemProps {
  item: FAQData;
}

const FAQItemComponent: React.FC<FAQItemProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 transition-colors text-left"
      >
        <span className="font-semibold text-slate-200">{item.question}</span>
        <ChevronDown 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          size={20} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-800/30 text-slate-400 text-sm leading-relaxed border-t border-slate-800">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RecentOrdersTicker = () => {
  return (
    <div className="w-full overflow-hidden bg-slate-900/50 border-y border-slate-800 py-3 mb-10">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="flex gap-10 whitespace-nowrap px-10"
      >
        {[...RECENT_ORDERS, ...RECENT_ORDERS, ...RECENT_ORDERS].map((order, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">{order.user}</span>
            <span className="text-slate-500">пополнил на</span>
            <span className="text-[#ffd57a] font-bold">{order.amount} ₽</span>
            <span className="text-slate-600 text-xs flex items-center gap-1">
              <Clock size={12} /> {order.time}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const Confetti = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            top: "-10%", 
            left: `${Math.random() * 100}%`,
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            top: "110%", 
            left: `${Math.random() * 100}%`,
            rotate: 360,
          }}
          transition={{ 
            duration: Math.random() * 2 + 2, 
            ease: "easeOut",
            delay: Math.random() * 0.5
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ 
            backgroundColor: ['#ffd57a', '#ff9bd6', '#9be6ff', '#647eff'][Math.floor(Math.random() * 4)] 
          }}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [amount, setAmount] = useState(500);
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [steamLogin, setSteamLogin] = useState("");
  const [tgNick, setTgNick] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [modal, setModal] = useState<{ title: string, content: ReactNode } | null>(null);
  
  const [clientsCount, setClientsCount] = useState(CONFIG.initialClientsCount);
  const [totalAmount, setTotalAmount] = useState(CONFIG.initialTotalAmount);
  
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderData, setActiveOrderData] = useState<DocumentData | null>(null);

  useEffect(() => {
    if (!activeOrderId) return;

    const unsub = onSnapshot(doc(db, 'orders', activeOrderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActiveOrderData(data);
        
        if (data.paid) {
          setShowConfetti(true);
          setNotification({ message: `Успешно! Пополнение на ${data.amount} ₽ выполнено.`, type: 'success' });
          setTimeout(() => {
            setShowConfetti(false);
            setActiveOrderId(null);
            setActiveOrderData(null);
          }, 5000);
        }
      }
    });

    return () => unsub();
  }, [activeOrderId]);

  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  const finalCost = useMemo(() => {
    const base = amount * CONFIG.rate;
    return promoApplied ? base * (1 - CONFIG.discountRate) : base;
  }, [amount, promoApplied]);

  const handlePromo = () => {
    if (promo.trim().toLowerCase() === CONFIG.promoCode) {
      setPromoApplied(true);
      setNotification({ message: 'Промокод успешно применен! Скидка 5%', type: 'success' });
    } else {
      setPromoApplied(false);
      setNotification({ message: 'Неверный промокод', type: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!steamLogin || !tgNick) {
      setNotification({ message: 'Заполните все поля!', type: 'error' });
      return;
    }
    if (!agreed) {
      setNotification({ message: 'Необходимо согласие с условиями!', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        steamLogin,
        tgNick,
        amount,
        finalCost: Math.round(finalCost),
        promoCode: promoApplied ? CONFIG.promoCode : null,
        qrCodeUrl: null,
        paid: false,
        createdAt: serverTimestamp()
      });

      setActiveOrderId(docRef.id);
      
      // Also send to Discord for backup
      const discordData = {
        content: "**Новый заказ KrolPay (Firebase)**",
        embeds: [{
          title: "Детали заказа",
          color: 16761035,
          fields: [
            { name: "ID Заказа", value: docRef.id, inline: false },
            { name: "Логин Steam", value: steamLogin, inline: true },
            { name: "Telegram", value: tgNick, inline: true },
            { name: "Сумма внутр.", value: amount + " ₽", inline: true },
            { name: "Итого к оплате", value: Math.round(finalCost) + " ₽", inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(CONFIG.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordData)
      });
      
      setClientsCount(prev => prev + 1);
      setTotalAmount(prev => prev + amount);
      
      // Reset form
      setSteamLogin("");
      setTgNick("");
      setAgreed(false);
    } catch (e) {
      console.error(e);
      setNotification({ message: 'Ошибка при создании заказа', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen py-8 px-4 relative">
      <Background />
      <Confetti active={showConfetti} />
      
      <AnimatePresence>
        {notification && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        )}
      </AnimatePresence>

      <Modal 
        isOpen={!!modal} 
        title={modal?.title || ""} 
        content={modal?.content} 
        onClose={() => setModal(null)} 
      />

      {/* Payment Modal */}
      <AnimatePresence>
        {activeOrderId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass rounded-3xl p-8 max-w-md w-full relative z-10 border border-white/10 shadow-2xl text-center"
            >
              <div className="mb-6">
                <div className="w-20 h-20 rounded-2xl bg-[#ffd57a]/10 flex items-center justify-center mx-auto mb-4">
                  <Wallet size={40} className="text-[#ffd57a]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Оплата заказа</h3>
                <p className="text-slate-400 text-sm">Сумма к оплате: <span className="text-white font-bold">{activeOrderData?.finalCost} ₽</span></p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">ID: {activeOrderId}</p>
              </div>

              <div className="glass-light rounded-2xl p-6 mb-6 min-h-[200px] flex flex-col items-center justify-center border border-white/5">
                {activeOrderData?.paid ? (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={40} className="text-emerald-400" />
                    </div>
                    <h4 className="text-xl font-bold text-emerald-400 mb-2">Оплачено!</h4>
                    <p className="text-slate-300 text-sm">Средства будут зачислены в ближайшее время.</p>
                  </motion.div>
                ) : activeOrderData?.qrCodeUrl ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-slate-300 mb-4">Отсканируйте QR-код для оплаты через СБП:</p>
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
                      <img 
                        src={activeOrderData.qrCodeUrl} 
                        alt="QR Code" 
                        className="w-48 h-48 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-xs text-slate-500 animate-pulse mt-4">Ожидание подтверждения оплаты...</p>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="spinner w-12 h-12 border-4 border-t-[#ffd57a]" />
                    <p className="text-slate-300 font-medium">Генерация QR-кода...</p>
                    <p className="text-xs text-slate-500">Подождите, менеджер подготавливает реквизиты для оплаты.</p>
                  </div>
                )}
              </div>

              {!activeOrderData?.paid && (
                <button 
                  onClick={() => setActiveOrderId(null)}
                  className="text-slate-500 hover:text-rose-400 text-sm transition-colors"
                >
                  Отменить заказ
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              animate={{ 
                boxShadow: ["0 0 0 0 rgba(255, 213, 122, 0.4)", "0 0 0 15px rgba(255, 213, 122, 0)"],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                boxShadow: { repeat: Infinity, duration: 2 },
                rotate: { repeat: Infinity, duration: 5, ease: "easeInOut" }
              }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ffd57a] to-[#ff9bd6] flex items-center justify-center shadow-xl cursor-pointer"
            >
              <span className="text-2xl font-extrabold text-[#071033]">KP</span>
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">KrolPay</h1>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <Zap size={14} className="text-[#ffd57a]" /> Быстрое пополнение Steam
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} className="glass-light px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
              <Users size={18} className="text-cyan-400" />
              <span className="text-sm">Клиентов: <span className="font-bold text-white">{clientsCount}+</span></span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="glass-light px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
              <Wallet size={18} className="text-purple-400" />
              <span className="text-sm">Пополнено: <span className="font-bold text-white">{totalAmount.toLocaleString('ru-RU')}</span> ₽</span>
            </motion.div>
          </div>
        </motion.header>

        <RecentOrdersTicker />

        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 mb-10 relative overflow-hidden group"
        >
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="relative z-10">
            <motion.h2 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4"
            >
              Пополнение Steam
            </motion.h2>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed"
            >
              Быстро, выгодно и безопасно. Получите игровую валюту в пару кликов! Мы работаем 24/7, чтобы вы не отвлекались от игры.
            </motion.p>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-3 gap-4 mb-6"
            >
              {[
                { icon: <Bolt className="text-cyan-400" />, title: "Мгновенно", text: "Зачисление в течение 5 минут после оплаты", bg: "bg-cyan-900/30" },
                { icon: <Percent className="text-purple-400" />, title: "Выгодно", text: "Лучшие цены и регулярные акции", bg: "bg-purple-900/30" },
                { icon: <ShieldCheck className="text-emerald-400" />, title: "Безопасно", text: "Гарантия возврата при проблемах", bg: "bg-emerald-900/30" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  whileHover={{ y: -5, borderColor: 'rgba(255,255,255,0.2)' }}
                  className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 rounded-2xl border border-slate-800 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shadow-inner`}>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Order Form */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl shadow-2xl mb-10 border border-white/10"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <TrendingUp className="text-[#ffd57a]" />
            <h3 className="text-2xl font-bold text-center">Оформление заказа</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-slate-300">Сумма пополнения</label>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Мин. 50 ₽</span>
                </div>
                <div className="glass-light p-8 rounded-2xl mb-6 relative group">
                  <input 
                    type="range" 
                    min="50" 
                    max="5000" 
                    step="50" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full mb-6 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    <span>50 ₽</span>
                    <span>2500 ₽</span>
                    <span>5000 ₽</span>
                  </div>
                  {/* Floating Tooltip */}
                  <motion.div 
                    className="absolute -top-4 bg-[#ffd57a] text-[#071033] px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none"
                    style={{ left: `${(amount - 50) / 4950 * 100}%`, transform: 'translateX(-50%)' }}
                  >
                    {amount} ₽
                  </motion.div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-inner">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Сумма Steam</p>
                    <p className="text-3xl font-black text-white">{amount} <span className="text-sm font-normal text-slate-500">₽</span></p>
                  </div>
                  <div className="p-5 bg-[#ffd57a]/5 rounded-2xl border border-[#ffd57a]/20 shadow-inner">
                    <p className="text-[10px] text-[#ffd57a] uppercase tracking-wider mb-2">К оплате</p>
                    <p className="text-3xl font-black text-[#ffd57a]">{Math.round(finalCost)} <span className="text-sm font-normal text-[#ffd57a]/60">₽</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-300 block">Промокод</label>
                <div className="flex gap-3">
                  <input 
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-4 focus:border-[#ffd57a] focus:ring-1 focus:ring-[#ffd57a] outline-none transition-all placeholder:text-slate-600" 
                    placeholder="Введите промокод"
                  />
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePromo}
                    className="px-8 py-4 bg-gradient-to-r from-[#9be6ff] to-[#647eff] text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all"
                  >
                    ОК
                  </motion.button>
                </div>
                <AnimatePresence mode="wait">
                  {promoApplied ? (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <CheckCircle2 size={16} /> Промокод применён! Скидка 5%
                    </motion.p>
                  ) : (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-slate-500 flex items-center gap-2"
                    >
                      <Gift size={16} className="text-cyan-400" /> Используйте <span className="text-cyan-400 font-bold">KotoKrol</span> для скидки
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="peer w-5 h-5 rounded-lg border-slate-700 bg-slate-900 text-[#ffd57a] focus:ring-[#ffd57a] transition-all"
                    />
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                    Я подтверждаю, что ознакомлен и согласен с <button onClick={() => setModal({
                      title: "Условия обслуживания",
                      content: (
                        <div className="space-y-4">
                          <p>1. Вы должны быть старше 18 лет или иметь разрешение от родителей.</p>
                          <p>2. Мы не несем ответственности за блокировки аккаунта, вызванные нарушением правил Steam.</p>
                          <p>3. Средства возврату не подлежат, за исключением технических сбоев на стороне сервиса.</p>
                          <p>4. Мы не несем ответственности за сохранность средств после их зачисления на ваш аккаунт Steam.</p>
                          <p>5. Мы не гарантируем абсолютную реальность и актуальность всех отзывов и статистики покупок, представленных на сайте в ознакомительных целях.</p>
                          <p>6. Администрация оставляет за собой право отказать в обслуживании без объяснения причин.</p>
                        </div>
                      )
                    })} className="text-[#ffd57a] font-bold hover:underline">условиями обслуживания</button>
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block ml-1">Логин Steam</label>
              <div className="relative">
                <input 
                  value={steamLogin}
                  onChange={(e) => setSteamLogin(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-4 focus:border-[#ffd57a] outline-none transition-all" 
                  placeholder="Например: gaben_official"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <Gamepad2 size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest ml-1">Тот, который вы используете для входа</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block ml-1">Telegram-никнейм</label>
              <div className="relative">
                <input 
                  value={tgNick}
                  onChange={(e) => setTgNick(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-4 focus:border-[#ffd57a] outline-none transition-all" 
                  placeholder="@nickname"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <MessageSquare size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest ml-1">Для связи с менеджером</p>
            </div>
          </div>

          <motion.button 
            disabled={isSubmitting}
            onClick={handleSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 rounded-2xl btn-primary text-xl font-black flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                Обработка...
              </>
            ) : (
              <>
                <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Оформить заказ
              </>
            )}
          </motion.button>
        </motion.main>

        {/* How it works */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-10 mb-10 relative overflow-hidden"
        >
          <h3 className="text-2xl font-bold mb-12 text-center">Как это работает?</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 relative">
            {/* Connector Lines (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 z-0" />
            
            {[
              { icon: <ClipboardList className="text-cyan-400" />, title: "1. Форма", text: "Укажите логин Steam и сумму", bg: "bg-cyan-900/30" },
              { icon: <Wallet className="text-purple-400" />, title: "2. Оплата", text: "Выберите удобный способ", bg: "bg-purple-900/30" },
              { icon: <Headset className="text-amber-400" />, title: "3. Связь", text: "Менеджер напишет в Telegram", bg: "bg-amber-900/30" },
              { icon: <Gamepad2 className="text-emerald-400" />, title: "4. Готово", text: "Средства уже на аккаунте", bg: "bg-emerald-900/30" }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center group relative z-10"
              >
                <div className={`w-20 h-20 rounded-3xl ${step.bg} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl border border-white/5`}>
                  {React.cloneElement(step.icon as React.ReactElement, { size: 32 })}
                </div>
                <h4 className="font-bold mb-3 text-white text-lg">{step.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed px-2">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Reviews */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold mb-10 text-center">Отзывы наших клиентов</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {REVIEWS.map((review, i) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="glass p-8 rounded-3xl flex flex-col h-full border border-white/5 relative group"
              >
                <div className="absolute top-4 right-6 text-slate-800 group-hover:text-slate-700 transition-colors">
                  <Star size={40} fill="currentColor" />
                </div>
                <div className="flex items-center mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${review.gradient} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                    {review.initial}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-white text-lg">{review.name}</h4>
                    <div className="flex text-amber-400 gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic relative z-10">"{review.text}"</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-10 mb-10"
        >
          <h3 className="text-2xl font-bold mb-10 text-center">Частые вопросы</h3>
          
          <div className="space-y-6 max-w-2xl mx-auto">
            {FAQ_LIST.map((item) => (
              <FAQItemComponent key={item.id} item={item} />
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="text-center text-slate-500 text-sm pt-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-10 mb-6 border border-white/5"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffd57a] to-[#ff9bd6] flex items-center justify-center shadow-2xl">
                  <span className="text-xl font-black text-[#071033]">KP</span>
                </div>
                <div className="text-left">
                  <h4 className="font-black text-white text-xl tracking-tight">KrolPay</h4>
                  <p className="text-slate-400 font-medium">Пополнение Steam от доверенного партнера</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                {[
                  { icon: <MessageSquare size={24} />, color: "hover:bg-cyan-500/20 hover:text-cyan-400", text: "Telegram", link: "https://t.me/krol_support" },
                  { icon: <Mail size={24} />, color: "hover:bg-slate-700/50 hover:text-white", text: "Email", link: "mailto:support@krolpay.ru" }
                ].map((social, i) => (
                  <motion.a 
                    key={i}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-14 h-14 rounded-2xl glass-light flex items-center justify-center transition-all duration-300 ${social.color} border border-white/5 shadow-lg`}
                    title={social.text}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
            
            <div className="border-t border-slate-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 font-medium">
              <p>KrolPay © 2026 | Контакты: @krol_support</p>
              <div className="flex gap-8">
                <button 
                  onClick={() => setModal({
                    title: "Политика конфиденциальности",
                    content: (
                      <div className="space-y-4">
                        <p>1. Мы собираем только необходимые данные для обработки вашего заказа</p>
                        <p>2. Ваши данные не передаются третьим лицам</p>
                        <p>3. Мы используем cookies для улучшения работы сервиса</p>
                        <p>4. Вы можете запросить удаление ваших данных, написав в поддержку</p>
                      </div>
                    )
                  })}
                  className="hover:text-[#ffd57a] transition-colors"
                >
                  Политика конфиденциальности
                </button>
              </div>
            </div>
          </motion.div>
        </footer>
      </div>
    </div>
  );
}
