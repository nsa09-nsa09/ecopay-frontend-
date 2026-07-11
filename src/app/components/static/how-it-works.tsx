import { Link } from "react-router";
import { WaveDivider } from "../ds-primitives";
import { UserPlus, Key, CreditCard, CheckCircle, AlertCircle, MessageSquare, ArrowRight } from "lucide-react";
import { useI18n, type Language } from "../i18n-provider";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

export function HowItWorksPage() {
  const { language } = useI18n();

  const steps = [
    {
      icon: UserPlus,
      number: 1,
      title: tx(language, "Создайте или найдите комнату", "Бөлме жасаңыз немесе табыңыз", "Create or Join a Room"),
      description: tx(
        language,
        "Просматривайте доступные общие тарифы по сервисам и операторам (Beeline, Activ, Altel, Tele2, Kcell) и присоединяйтесь к существующей комнате — или создайте свою, если у вас есть семейный тариф.",
        "Сервистер мен операторлар (Beeline, Activ, Altel, Tele2, Kcell) бойынша қолжетімді ортақ тарифтерді қарап, бар бөлмеге қосылыңыз — немесе отбасылық тарифіңіз болса, өз бөлмеңізді жасаңыз.",
        "Browse available shared plans by service and operator (Beeline, Activ, Altel, Tele2, Kcell) and join an existing room, or create your own if you have a family plan to share.",
      ),
      details: [
        tx(language, "Выберите сервис и тариф", "Сервис пен тарифті таңдаңыз", "Pick your service and plan"),
        tx(language, "Смотрите свободные места", "Бос орындарды көріңіз", "See available slots"),
        tx(language, "Мгновенное создание комнаты", "Бөлмені лезде жасау", "Instant room creation"),
      ],
    },
    {
      icon: Key,
      number: 2,
      title: tx(language, "Укажите идентификатор", "Идентификаторды енгізіңіз", "Enter Your Identifier"),
      description: tx(
        language,
        "Укажите телеком-идентификатор (номер телефона или ID аккаунта), чтобы владелец добавил вас в семейный тариф. Контактные данные остаются приватными — передаются только проверенные идентификаторы.",
        "Иесі сізді отбасылық тарифке қосуы үшін телеком-идентификаторды (телефон нөмірі немесе аккаунт ID) енгізіңіз. Байланыс деректері жеке қалады — тек тексерілген идентификаторлар беріледі.",
        "Provide your telecom identifier (phone number or account ID) so the plan owner can add you to their family plan. Your contact info stays private — only verified identifiers are shared.",
      ),
      details: [
        tx(language, "Безопасная передача данных", "Деректерді қауіпсіз беру", "Secure identifier submission"),
        tx(language, "Без обмена контактами", "Байланыс деректерінсіз", "No personal contact sharing"),
        tx(language, "Проверено платформой", "Платформа тексерген", "Verified by platform"),
      ],
    },
    {
      icon: CreditCard,
      number: 3,
      title: tx(language, "Оплатите свою долю", "Өз үлесіңізді төлеңіз", "Pay Your Share"),
      description: tx(
        language,
        "Оплачивайте ежемесячную долю безопасно через платформу. Деньги удерживаются в hold и переводятся владельцу только после подтверждения активного доступа.",
        "Ай сайынғы үлесіңізді платформа арқылы қауіпсіз төлеңіз. Ақша hold-та ұсталып, иесіне тек белсенді қолжетімділік расталғаннан кейін аударылады.",
        "Pay your monthly share securely through the platform. Payments are held in escrow and released to the room owner once service is confirmed active.",
      ),
      details: [
        tx(language, "Безопасная оплата", "Қауіпсіз төлем", "Secure payment processing"),
        tx(language, "Защита через hold", "Hold арқылы қорғау", "Escrow protection"),
        tx(language, "Прозрачные цены", "Ашық бағалар", "Transparent pricing"),
      ],
    },
    {
      icon: CheckCircle,
      number: 4,
      title: tx(language, "Подтвердите и пользуйтесь", "Растаңыз және қолданыңыз", "Verify & Activate"),
      description: tx(
        language,
        "Владелец комнаты добавляет вас в тариф. После проверки доступ активируется — и вы начинаете экономить. Вся координация идёт через тикеты поддержки, без прямых контактов между пользователями.",
        "Бөлме иесі сізді тарифке қосады. Тексеруден кейін қолжетімділік іске қосылады — үнемдеуді бастайсыз. Барлық үйлестіру қолдау тикеттері арқылы жүреді, пайдаланушылар арасында тікелей байланыс жоқ.",
        "The room owner adds you to their plan. Once verified, your service activates and you start saving. All coordination happens through support tickets — no direct user contact needed.",
      ),
      details: [
        tx(language, "Владелец добавляет вас", "Иесі сізді қосады", "Owner adds you to plan"),
        tx(language, "Проверка платформой", "Платформа тексеруі", "Platform verification"),
        tx(language, "Подтверждение активации", "Іске қосуды растау", "Service activation confirmed"),
      ],
    },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[900px] mx-auto text-center animate-eco-fade-in">
          <h1 className="text-[28px] sm:text-[40px] tracking-tight mb-4" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
            {tx(language, "Как работает EcoSplit", "EcoSplit қалай жұмыс істейді", "How EcoSplit Works")}
          </h1>
          <p className="text-[16px] max-w-[600px] mx-auto" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(
              language,
              "Присоединяйтесь к общим подпискам за четыре простых шага. Экономьте без лишних хлопот.",
              "Төрт қарапайым қадаммен ортақ жазылымдарға қосылыңыз. Артық қиындықсыз үнемдеңіз.",
              "Join shared plans in four simple steps. Save money without the hassle.",
            )}
          </p>
        </div>
      </div>
      <WaveDivider flip />

      {/* Steps */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative animate-eco-fade-in" style={{ animationDelay: `${idx * 90}ms` }}>
                {idx < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute left-[28px] top-[60px] w-0.5 h-[calc(100%+24px)]"
                    style={{ background: "var(--eco-border)" }}
                  />
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="shrink-0 flex flex-col items-center md:items-start">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-2 relative z-10"
                      style={{ background: "var(--eco-primary)" }}
                    >
                      <Icon size={26} style={{ color: "#fff" }} />
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
                      style={{ background: "var(--eco-surface)", color: "var(--eco-text)", border: "2px solid var(--eco-primary)", fontWeight: 600 }}
                    >
                      {step.number}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-[22px] mb-3" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
                      {step.title}
                    </h2>
                    <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--eco-text-secondary)" }}>
                      {step.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {step.details.map((detail) => (
                        <span
                          key={detail}
                          className="px-3 py-1.5 rounded-lg text-[12px]"
                          style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Important Notice */}
        <div className="mt-12 p-6 rounded-xl border-2" style={{ background: "var(--eco-surface)", borderColor: "var(--eco-warning-500)" }}>
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="shrink-0 mt-1" style={{ color: "var(--eco-warning-500)" }} />
            <div>
              <h3 className="text-[16px] mb-2" style={{ color: "var(--eco-text)", fontWeight: 600 }}>
                {tx(language, "Важно: без личных чатов между пользователями", "Маңызды: пайдаланушылар арасында жеке чат жоқ", "Important: No User-to-User Chat")}
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                {tx(
                  language,
                  "EcoSplit не предоставляет прямую переписку между пользователями. Всё общение, вопросы и координация проходят через официальные тикеты поддержки под контролем нашей команды. Это защищает вашу приватность и гарантирует, что все взаимодействия безопасны и задокументированы.",
                  "EcoSplit пайдаланушылар арасында тікелей хат алмасуды ұсынбайды. Барлық қарым-қатынас, сұрақтар және үйлестіру біздің команда бақылайтын ресми қолдау тикеттері арқылы өтеді. Бұл жекелігіңізді қорғайды және барлық әрекеттердің қауіпсіз әрі құжатталғанын қамтамасыз етеді.",
                  "EcoSplit does not provide direct messaging between users. All communication, questions, and coordination happen through official support tickets monitored by our team. This protects your privacy and ensures all interactions are secure and documented.",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: "var(--eco-brand-50)" }}>
          <div className="flex items-start gap-4">
            <MessageSquare size={24} className="shrink-0 mt-1" style={{ color: "var(--eco-primary)" }} />
            <div>
              <h3 className="text-[16px] mb-2" style={{ color: "var(--eco-text)", fontWeight: 600 }}>
                {tx(language, "Нужна помощь?", "Көмек керек пе?", "Need Help?")}
              </h3>
              <p className="text-[14px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>
                {tx(
                  language,
                  "Наша поддержка поможет с любыми вопросами о комнатах, оплатах и активации доступа.",
                  "Қолдау қызметіміз бөлмелер, төлемдер және қолжетімділікті іске қосу туралы кез келген сұраққа көмектеседі.",
                  "Our support team is here to help with any questions about joining rooms, payments, or plan activation.",
                )}
              </p>
              <Link
                to="/support/new"
                className="eco-btn eco-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[14px]"
                style={{ textDecoration: "none" }}
              >
                {tx(language, "Создать заявку", "Өтінім жасау", "Create Support Ticket")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <WaveDivider />
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-[24px] sm:text-[28px] mb-3" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
            {tx(language, "Готовы начать экономить?", "Үнемдеуді бастауға дайынсыз ба?", "Ready to Start Saving?")}
          </h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(
              language,
              "Посмотрите доступные тарифы популярных сервисов и присоединяйтесь к комнате уже сегодня.",
              "Танымал сервистердің қолжетімді тарифтерін қарап, бүгін-ақ бөлмеге қосылыңыз.",
              "Browse available plans from top services and join a room today.",
            )}
          </p>
          <Link
            to="/"
            className="eco-btn eco-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[15px]"
            style={{ textDecoration: "none" }}
          >
            {tx(language, "Открыть каталог", "Каталогты ашу", "View Catalog")} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
