import { useState, useMemo } from "react";

export default function RoiCalculator() {
  const [currency, setCurrency] = useState("USD"); // "USD" or "PKR"
  const [dailyLeads, setDailyLeads] = useState(45);
  const [minutesPerTask, setMinutesPerTask] = useState(15);
  const [hourlyRate, setHourlyRate] = useState(35);

  // Switch hourly default when currency changes
  const handleCurrencyChange = (newCurr) => {
    setCurrency(newCurr);
    if (newCurr === "PKR") {
      setHourlyRate(3500);
    } else {
      setHourlyRate(35);
    }
  };

  // Calculations based on 22 business days/month
  const calculations = useMemo(() => {
    const monthlyTasks = dailyLeads * 22;
    const monthlyMinutes = monthlyTasks * minutesPerTask;
    const hoursSavedPerMonth = Math.round(monthlyMinutes / 60);
    const monthlyCostSaved = Math.round(hoursSavedPerMonth * hourlyRate);
    const annualCostSaved = monthlyCostSaved * 12;

    const currencySymbol = currency === "USD" ? "$" : "Rs. ";

    return {
      hoursSavedPerMonth,
      monthlyCostSaved,
      annualCostSaved,
      currencySymbol,
    };
  }, [dailyLeads, minutesPerTask, hourlyRate, currency]);

  const whatsappUrl = useMemo(() => {
    const text = `Hi Shahzaman, I audited our workflows with your ROI calculator. We process ~${dailyLeads} leads/operations daily and estimate saving approx ${calculations.hoursSavedPerMonth} hours/month (${calculations.currencySymbol}${calculations.monthlyCostSaved.toLocaleString()}/mo). I'd like to discuss automating our backend pipeline.`;
    return `https://wa.me/923241736180?text=${encodeURIComponent(text)}`;
  }, [dailyLeads, calculations]);

  return (
    <section className="max-w-6xl w-full mx-auto px-6 py-16 border-b border-slate-800/60 gsap-reveal opacity-0 translate-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Efficiency &amp; Financial Impact
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">
            Agency ROI &amp; Automation Cost Calculator
          </h2>
          <p className="text-slate-400 text-sm max-w-lg">
            Estimate the exact operational hours and capital your agency or enterprise reclaims by replacing manual lead handling with autonomous n8n &amp; AI Voice pipelines.
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => handleCurrencyChange("USD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              currency === "USD"
                ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => handleCurrencyChange("PKR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              currency === "PKR"
                ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            PKR (Rs.)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Controls Card */}
        <div className="lg:col-span-7 p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Slider 1: Daily Leads */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">
                  Repetitive Tasks / Leads Handled Daily
                </label>
                <span className="text-sm font-heading font-bold text-cyan-400">
                  {dailyLeads} <span className="text-xs font-normal text-slate-500">leads/day</span>
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={dailyLeads}
                onChange={(e) => setDailyLeads(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-950 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>5 / day (Boutique)</span>
                <span>150 / day</span>
                <span>300+ / day (High Scale)</span>
              </div>
            </div>

            {/* Slider 2: Manual Time Spent */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">
                  Manual Handling Time per Lead / Task
                </label>
                <span className="text-sm font-heading font-bold text-purple-400">
                  {minutesPerTask} <span className="text-xs font-normal text-slate-500">minutes</span>
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="45"
                step="1"
                value={minutesPerTask}
                onChange={(e) => setMinutesPerTask(Number(e.target.value))}
                className="w-full accent-purple-400 bg-slate-950 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>3 mins (Quick CRM Entry)</span>
                <span>20 mins</span>
                <span>45 mins (Call + Qualification)</span>
              </div>
            </div>

            {/* Slider 3: Labor Cost */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">
                  Average Hourly Labor / Freelance Cost
                </label>
                <span className="text-sm font-heading font-bold text-emerald-400">
                  {calculations.currencySymbol}
                  {hourlyRate.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-500">/ hr</span>
                </span>
              </div>
              <input
                type="range"
                min={currency === "USD" ? 15 : 1000}
                max={currency === "USD" ? 150 : 15000}
                step={currency === "USD" ? 5 : 500}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-950 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>
                  {calculations.currencySymbol}
                  {currency === "USD" ? "15/hr" : "1,000/hr"}
                </span>
                <span>
                  {calculations.currencySymbol}
                  {currency === "USD" ? "150/hr" : "15,000/hr"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2.5">
            <span className="text-cyan-400 text-base">⚡</span>
            <span>
              Automation reduces response time from <b className="text-white">{minutesPerTask} minutes</b> down to <b className="text-cyan-300">&lt; 1.2 seconds</b> (99.8% reduction in latency).
            </span>
          </div>
        </div>

        {/* Results & CTA Card */}
        <div className="lg:col-span-5 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-600 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>

          <div className="relative p-7 rounded-2xl bg-slate-950 border border-cyan-500/40 flex flex-col justify-between h-full space-y-6 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
                Estimated Net Recovery
              </span>
              <h3 className="text-white font-heading font-bold text-xl pt-1">
                Your Monthly Efficiency Surplus
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono">Hours Saved / Month</div>
                <div className="text-3xl md:text-4xl font-heading font-bold text-cyan-400 mt-1 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  {calculations.hoursSavedPerMonth.toLocaleString()} hrs
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Equivalent to ~{Math.round(calculations.hoursSavedPerMonth / 160 * 10) / 10} full-time operators
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Monthly Capital Reclaimed</div>
                  <div className="text-lg md:text-xl font-heading font-bold text-emerald-400 mt-1">
                    {calculations.currencySymbol}
                    {calculations.monthlyCostSaved.toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Annualized Value</div>
                  <div className="text-lg md:text-xl font-heading font-bold text-purple-400 mt-1">
                    {calculations.currencySymbol}
                    {calculations.annualCostSaved.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-[1.02] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <span>Lock In These Savings on WhatsApp →</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
