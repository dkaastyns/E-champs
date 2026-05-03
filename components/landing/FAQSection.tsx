'use client';

import { useState, useRef, useEffect } from 'react';

const faqs = [
  {
    number: '01',
    question: 'HOW DO I REGISTER MY TEAM?',
    answer: 'Create an account, browse available tournaments, and click "Register Team". You will need to provide your team name, member details, and upload payment proof. Once verified by admins, your spot is secured.',
  },
  {
    number: '02',
    question: 'WHAT PAYMENT METHODS ARE ACCEPTED?',
    answer: 'We accept bank transfers and popular e-wallets. After registration, you will receive payment instructions. Upload your payment proof in the "My Teams" section for verification.',
  },
  {
    number: '03',
    question: 'CAN I CHANGE MY TEAM ROSTER?',
    answer: 'Yes, you can modify your roster up until the tournament registration closes. After that, rosters are locked to ensure fair competition. Contact admin if you have emergencies.',
  },
  {
    number: '04',
    question: 'WHAT IF MY TEAM WITHDRAWS?',
    answer: 'You can withdraw anytime before the tournament starts from "My Teams". Withdrawn teams are soft-deleted (remain in logs) but excluded from brackets. Refund policy varies by tournament.',
  },
  {
    number: '05',
    question: 'HOW DOES DOUBLE ELIMINATION WORK?',
    answer: 'Teams get a second chance in the losers bracket after their first loss. Lose twice and you are eliminated. Winners bracket champion faces losers bracket champion in grand finals.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="faq" className="py-24 bg-[#0d0d0d]">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <div className="mb-16">
          <span className={`text-[#2BE900] text-sm font-bold tracking-widest font-[family-name:var(--font-body)] block ${visible ? 'animate-fade-left delay-0' : 'opacity-0'}`}>
            SUPPORT
          </span>
          <h2 className={`font-[family-name:var(--font-display)] text-6xl md:text-8xl text-white uppercase leading-none mt-2 ${visible ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
            FAQ
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-0">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border-b border-[#1a1a1a] ${visible ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: visible ? `${150 + index * 80}ms` : '0ms' }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full py-6 flex items-start gap-6 text-left group cursor-pointer"
                  aria-expanded={isOpen}
                >
                  {/* Number badge with hover glow */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? 'bg-[#2BE900] shadow-[0_0_20px_rgba(43,233,0,0.4)]'
                        : 'bg-[#6520EE] group-hover:bg-[#7c3aed] group-hover:shadow-[0_0_16px_rgba(101,32,238,0.4)]'
                    }`}
                  >
                    <span className={`font-[family-name:var(--font-display)] text-xl transition-colors duration-300 ${isOpen ? 'text-black' : 'text-white'}`}>
                      {faq.number}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-[family-name:var(--font-heading)] text-xl transition-colors duration-300 ${
                          isOpen ? 'text-[#2BE900]' : 'text-white group-hover:text-[#6520EE]'
                        }`}
                      >
                        {faq.question}
                      </h3>

                      {/* Plus/X icon with smooth rotation */}
                      <span
                        className={`text-2xl transition-all duration-400 ease-in-out flex-shrink-0 ml-4 ${
                          isOpen ? 'rotate-45 text-[#2BE900]' : 'text-[#2BE900] group-hover:scale-125'
                        }`}
                      >
                        +
                      </span>
                    </div>

                    {/* Animated accordion */}
                    <div
                      className="overflow-hidden transition-all duration-500 ease-in-out"
                      style={{
                        maxHeight: isOpen ? '200px' : '0px',
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="mt-4 text-gray-400 font-[family-name:var(--font-body)] leading-relaxed pb-2 border-l-2 border-[#6520EE]/40 pl-4">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Still have questions */}
        <div
          className={`mt-16 p-8 border border-[#1a1a1a] bg-[#080808] transition-all duration-500 hover:border-[#6520EE]/30 ${visible ? 'animate-fade-up delay-600' : 'opacity-0'}`}
          style={{ transition: 'border-color 0.3s ease, box-shadow 0.3s ease' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(101,32,238,0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-3xl text-white">
                STILL HAVE QUESTIONS?
              </h3>
              <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">
                Contact our support team for assistance.
              </p>
            </div>
            <a
              href="mailto:support@e-champs.com"
              className="btn-press inline-flex items-center justify-center border-2 border-[#6520EE] text-[#6520EE] hover:bg-[#6520EE] hover:text-white font-bold px-8 py-3 font-[family-name:var(--font-heading)] transition-all duration-300 hover:shadow-[0_0_24px_rgba(101,32,238,0.4)] hover:-translate-y-0.5"
            >
              CONTACT SUPPORT
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
