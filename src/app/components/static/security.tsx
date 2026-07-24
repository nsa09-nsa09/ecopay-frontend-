import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Headphones,
  KeyRound,
  Lock,
  RefreshCcw,
  Server,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Card } from "../ds-primitives";
import { useI18n } from "../i18n-provider";

type L = "ru" | "kz" | "en";

const tx = (language: L, ru: string, kz: string, en: string) =>
  language === "ru" ? ru : language === "kz" ? kz : en;

type SecurityBlock = {
  icon: LucideIcon;
  title: { ru: string; kz: string; en: string };
  items: Array<{ icon: LucideIcon; ru: string; kz: string; en: string }>;
};

const blocks: SecurityBlock[] = [
  {
    icon: ShieldCheck,
    title: { ru: "Данные защищены", kz: "Деректер қорғалған", en: "Data protected" },
    items: [
      {
        icon: KeyRound,
        ru: "Шифрование AES-256 для чувствительных данных, включая идентификаторы подключения.",
        kz: "Құпия деректер, соның ішінде қосылу идентификаторлары AES-256 арқылы шифрланады.",
        en: "AES-256 encryption for sensitive data, including connection identifiers.",
      },
      {
        icon: Lock,
        ru: "SSL/TLS-сертификат: весь трафик между вами и EcoPay зашифрован.",
        kz: "SSL/TLS сертификаты: сіз бен EcoPay арасындағы барлық трафик шифрланған.",
        en: "SSL/TLS certificate: all traffic between you and EcoPay is encrypted.",
      },
      {
        icon: Server,
        ru: "Соответствие требованиям DSP2 и минимизация хранимых персональных данных.",
        kz: "DSP2 талаптарына сәйкестік және сақталатын жеке деректерді азайту.",
        en: "DSP2 compliance and minimal retention of personal data.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: { ru: "Платежи безопасны", kz: "Төлемдер қауіпсіз", en: "Payments secure" },
    items: [
      {
        icon: BadgeCheck,
        ru: "PCI DSS compliance: данные карт обрабатывают только сертифицированные провайдеры.",
        kz: "PCI DSS сәйкестігі: карта деректерін тек сертификатталған провайдерлер өңдейді.",
        en: "PCI DSS compliance: card data is handled only by certified providers.",
      },
      {
        icon: Lock,
        ru: "3D Secure: каждый платёж подтверждается банком-эмитентом вашей карты.",
        kz: "3D Secure: әр төлемді картаңыздың банкі растайды.",
        en: "3D Secure: every payment is confirmed by your card's issuing bank.",
      },
      {
        icon: RefreshCcw,
        ru: "30-дневный hold: деньги не уходят владельцу, пока вы не получите доступ.",
        kz: "30 күндік hold: қолжетімділік алғанша ақша иесіне жіберілмейді.",
        en: "30-day hold: funds are not released to the owner until you get access.",
      },
    ],
  },
  {
    icon: BadgeCheck,
    title: { ru: "Программа защиты покупателей", kz: "Сатып алушыларды қорғау бағдарламасы", en: "Buyer protection program" },
    items: [
      {
        icon: RefreshCcw,
        ru: "Гарантия возврата: если доступ не выдали или он не работает, откройте спор — выплату заморозят.",
        kz: "Қайтару кепілдігі: қолжетімділік берілмесе немесе жұмыс істемесе, дау ашыңыз — төлем тоқтатылады.",
        en: "Money-back guarantee: if access is missing or broken, open a dispute — the payout is frozen.",
      },
      {
        icon: Headphones,
        ru: "Поддержка 24/7: заявки и споры встроены в продукт и рассматриваются модерацией.",
        kz: "24/7 қолдау: өтініштер мен даулар өнімге енгізілген және модерация қарайды.",
        en: "24/7 support: tickets and disputes are built into the product and reviewed by moderation.",
      },
      {
        icon: ShieldCheck,
        ru: "Ваши права защищены: владельцы проходят проверку, рискованные операции уходят на модерацию.",
        kz: "Құқықтарыңыз қорғалған: иелер тексеруден өтеді, тәуекелді операциялар модерацияға жіберіледі.",
        en: "Your rights are protected: owners are vetted and risky operations go to moderation.",
      },
    ],
  },
];

export function SecurityPage() {
  const { language } = useI18n();
  const lang = language as L;

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-center mb-12 animate-eco-fade-in">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] mb-5"
          style={{ background: "var(--eco-brand-50)", color: "var(--eco-brand-700)", fontWeight: 500 }}
        >
          <ShieldCheck size={15} />
          {tx(lang, "Безопасность EcoPay", "EcoPay қауіпсіздігі", "EcoPay security")}
        </div>
        <h1 className="text-[32px] sm:text-[44px] leading-tight m-0" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
          {tx(lang, "Ваши данные и деньги под защитой", "Деректеріңіз бен ақшаңыз қорғауда", "Your data and money are protected")}
        </h1>
        <p className="text-[15px] sm:text-[16px] mt-4 mx-auto max-w-[560px]" style={{ color: "var(--eco-text-secondary)" }}>
          {tx(
            lang,
            "EcoPay построен так, чтобы совместные подписки были безопаснее любых договорённостей в чатах: шифрование, проверенные платёжные системы и защита каждой оплаты.",
            "EcoPay ортақ жазылымдарды чаттағы келісімдерден қауіпсіз етеді: шифрлау, тексерілген төлем жүйелері және әр төлемді қорғау.",
            "EcoPay is built to make shared subscriptions safer than any chat agreement: encryption, trusted payment providers, and protection for every payment.",
          )}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {blocks.map((block, blockIndex) => (
          <Card key={block.title.en} className="eco-lift p-6 sm:p-8 animate-eco-fade-in" >
            <div className="flex items-center gap-3 mb-5" style={{ animationDelay: `${blockIndex * 100}ms` }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
                <block.icon size={20} style={{ color: "var(--eco-primary)" }} />
              </span>
              <h2 className="text-[20px] sm:text-[22px] m-0" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
                {tx(lang, block.title.ru, block.title.kz, block.title.en)}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {block.items.map((item) => (
                <div key={item.en} className="flex flex-col gap-2 rounded-xl p-4" style={{ background: "var(--eco-surface)" }}>
                  <item.icon size={18} style={{ color: "var(--eco-primary)" }} />
                  <p className="text-[13px] m-0 leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                    {tx(lang, item.ru, item.kz, item.en)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div
        className="mt-10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(120deg, var(--eco-primary), var(--eco-brand-600))", color: "#fff" }}
      >
        <div>
          <div className="text-[18px] sm:text-[20px]" style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>
            {tx(lang, "Остались вопросы о безопасности?", "Қауіпсіздік туралы сұрақтарыңыз бар ма?", "Questions about security?")}
          </div>
          <div className="text-[13px] mt-1" style={{ opacity: 0.85 }}>
            {tx(lang, "Поддержка ответит и поможет разобраться с любой ситуацией.", "Қолдау қызметі жауап беріп, кез келген жағдайды шешуге көмектеседі.", "Support will answer and help with any situation.")}
          </div>
        </div>
        <Link to="/support" style={{ textDecoration: "none" }} className="shrink-0">
          <span
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] transition-transform hover:scale-[1.03]"
            style={{ background: "#fff", color: "var(--eco-brand-700)", fontWeight: 600 }}
          >
            {tx(lang, "Написать в поддержку", "Қолдауға жазу", "Contact support")} <ArrowRight size={15} />
          </span>
        </Link>
      </div>
    </div>
  );
}
