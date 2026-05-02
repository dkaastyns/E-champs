'use client';

import { useState } from 'react';

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

  return (
    <section id="faq" className="py-24 bg-[#0d0d0d]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-[#2BE900] text-sm font-bold tracking-widest font-[family-name:var(--font-body)]">SUPPORT</span>
          <h2 className="font-[family-name:var(--font-display)] text-6xl md:text-8xl text-white uppercase leading-none mt-2">
            FAQ
          </h2>
        </div>

        <div className="space-y-0">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="border-b border-[#1a1a1a]"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full py-6 flex items-start gap-6 text-left group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#6520EE] flex items-center justify-center">
                    <span className="font-[family-name:var(--font-display)] text-xl text-white">
                      {faq.number}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-[family-name:var(--font-heading)] text-xl text-white group-hover:text-[#6520EE] transition-colors">
                        {faq.question}
                      </h3>
                      
                      <span className={`text-[#2BE900] text-2xl transition-transform ${isOpen ? 'rotate-45' : ''}`}>
                        +
                      </span>
                    </div>

                    {isOpen && (
                      <div className="mt-4 text-gray-400 font-[family-name:var(--font-body)] leading-relaxed pl-0">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 p-8 border border-[#1a1a1a] bg-[#080808]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-3xl text-white">STILL HAVE QUESTIONS?</h3>
              <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Contact our support team for assistance.</p>
            </div>
            <a
              href="mailto:support@e-champs.com"
              className="inline-flex items-center justify-center border-2 border-[#6520EE] text-[#6520EE] hover:bg-[#6520EE] hover:text-white font-bold px-8 py-3 font-[family-name:var(--font-heading)] transition-colors"
            >
              CONTACT SUPPORT
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
