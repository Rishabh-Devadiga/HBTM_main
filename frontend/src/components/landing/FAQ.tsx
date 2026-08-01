import { activeDomain } from "@/domain";

const questions = [
  {
    question: activeDomain.landing.faq1Question,
    answer: activeDomain.landing.faq1Answer,
  },
  {
    question: activeDomain.landing.faq2Question,
    answer: activeDomain.landing.faq2Answer,
  },
  {
    question: activeDomain.landing.faq3Question,
    answer: activeDomain.landing.faq3Answer,
  },
];

export function FAQ() {
  return (
    <section
      className="scroll-mt-20 bg-white py-20 sm:py-24"
      id="faq"
    >
      <div className="mx-auto grid w-[min(100%-2rem,1000px)] gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-700">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            A few useful answers
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {activeDomain.landing.faqDescription}
          </p>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {questions.map((item) => (
            <details className="group py-5" key={item.question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-950">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-xl font-normal text-blue-600 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pt-3 text-sm leading-6 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
