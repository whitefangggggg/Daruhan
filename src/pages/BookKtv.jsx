import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon as Iconify } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SITE, CONTACT } from '../lib/constants'
import { THEME } from '../config/theme'
import MotionIn, { MotionStagger, MotionItem } from '../components/MotionIn'
import { fadeUp, transition } from '../lib/motion'
import { MessageCircle } from '../components/ui/Icon'

const ROOMS = Array.from({ length: SITE.ktv.roomCount }, (_, i) => ({
  id: i + 1,
  name: `Room ${i + 1}`,
  capacity: i < 5 ? '4–8 pax' : '8–15 pax',
  type: i < 5 ? 'Standard' : 'Deluxe',
}))

const HOURS = Array.from({ length: 21 }, (_, i) => {
  const h = (i + 4) % 24
  const label = h === 0 ? '12:00 MN' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`
  return { value: h, label }
})

function buildWhatsAppMessage({ name, phone, date, startHour, durationHours, rooms, notes }) {
  const start = HOURS.find(h => h.value === startHour)?.label ?? `${startHour}:00`
  const endH = (startHour + durationHours) % 24
  const end = HOURS.find(h => h.value === endH)?.label ?? `${endH}:00`
  const total = durationHours * SITE.ktv.ratePerHour * rooms
  const lines = [
    '🎤 *KTV Booking Inquiry — Daruhan*',
    '',
    `👤 Name: ${name}`,
    `📞 Contact: ${phone}`,
    `📅 Date: ${date}`,
    `🕐 Time: ${start} – ${end} (${durationHours} hr${durationHours > 1 ? 's' : ''})`,
    `🚪 Rooms: ${rooms}`,
    `💰 Estimated total: ₱${total.toLocaleString()}`,
    notes ? `📝 Notes: ${notes}` : '',
  ].filter(Boolean).join('\n')
  return encodeURIComponent(lines)
}

export default function BookKtv() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date: '',
    startHour: 18,
    durationHours: 2,
    rooms: 1,
    notes: '',
  })
  const [step, setStep] = useState(1)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const total = form.durationHours * SITE.ktv.ratePerHour * form.rooms

  function handleSubmit(e) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    const msg = buildWhatsAppMessage(form)
    const phone = CONTACT.phone.replace('+', '')
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen" style={{ background: THEME.gradients.hero }}>
      <MotionIn className="relative text-center px-4 pt-16 pb-12" animateOnMount>
        <p className="text-xs font-bold text-brand-gold-400 uppercase tracking-[0.25em] mb-3">
          Daruhan KTV
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
          Grab the mic.
          <br />
          <span
            className="bg-gradient-to-r from-brand-gold-200 via-brand-gold-400 to-brand-gold-300 bg-clip-text text-transparent"
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Book a room.
          </span>
        </h1>
        <p className="text-brand-gold-100/70 text-base max-w-md mx-auto leading-relaxed">
          {SITE.ktv.roomCount} private rooms · ₱{SITE.ktv.ratePerHour}/hr · Carcar City, Cebu
        </p>

        <MotionStagger
          className="flex flex-wrap justify-center gap-3 mt-8"
          staggerChildren={0.07}
          delayChildren={0.2}
          animateOnMount
        >
          {[
            { icon: 'noto:microphone', label: `${SITE.ktv.roomCount} Private Rooms` },
            { icon: 'noto:musical-note', label: '₱100 / hour' },
            { icon: 'noto:family', label: 'Up to 15 pax' },
            { icon: 'noto:clock-face-four-oclock', label: SITE.venue.hoursLabel },
          ].map(p => (
            <MotionItem key={p.label} variants={fadeUp}>
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white border"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}
              >
                <Iconify icon={p.icon} width={15} height={15} />
                {p.label}
              </span>
            </MotionItem>
          ))}
        </MotionStagger>
      </MotionIn>

      <div className="max-w-5xl mx-auto px-4 pb-20 grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="space-y-6">
          <MotionIn delay={60}>
            <h2 className="text-sm font-bold text-brand-gold-300 uppercase tracking-widest mb-4">
              Available Rooms
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ROOMS.map(room => (
                <motion.div
                  key={room.id}
                  className="rounded-2xl p-4 flex flex-col gap-1"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  transition={transition.hover}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Iconify icon="noto:microphone" width={20} height={20} />
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={room.type === 'Deluxe'
                        ? { background: 'rgba(201,162,39,0.2)', color: '#d4bc6a' }
                        : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }
                      }
                    >
                      {room.type}
                    </span>
                  </div>
                  <p className="font-bold text-white text-sm">{room.name}</p>
                  <p className="text-xs text-gray-400">{room.capacity}</p>
                </motion.div>
              ))}
            </div>
          </MotionIn>

          <MotionIn delay={100}>
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs font-bold text-brand-gold-400 uppercase tracking-widest mb-4">What&apos;s included</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: 'noto:musical-notes', text: "Massive song library (OPM + Int'l)" },
                  { icon: 'noto:speaker-high-volume', text: 'Full sound system in every room' },
                  { icon: 'noto:cocktail-glass', text: 'Drink orders delivered to your room' },
                  { icon: 'noto:locked', text: 'Fully private — lock the door and sing' },
                  { icon: 'noto:video-game', text: 'HD screens with lyrics display' },
                  { icon: 'noto:convenience-store', text: 'Minimart snacks available' },
                ].map(perk => (
                  <div key={perk.text} className="flex items-start gap-2.5">
                    <Iconify icon={perk.icon} width={18} height={18} className="mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300 leading-snug">{perk.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </MotionIn>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-brand-gold-400 hover:text-brand-gold-300 transition-colors"
          >
            ← Back to Daruhan
          </Link>
        </div>

        <MotionIn delay={40} className="lg:sticky lg:top-24">
          <div
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}
          >
            <div className="px-6 py-5 border-b border-white/10">
              <p className="font-extrabold text-white text-lg">Book a Room</p>
              <p className="text-brand-gold-300 text-sm mt-0.5">
                ₱{SITE.ktv.ratePerHour} / hour · Confirm via WhatsApp
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  onSubmit={handleSubmit}
                  className="p-6 space-y-4"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={transition.fast}
                >
                  <div>
                    <label className="block text-xs font-semibold text-brand-gold-300 uppercase tracking-wider mb-1.5">Your Name</label>
                    <input required type="text" placeholder="Juan dela Cruz" value={form.name} onChange={e => set('name', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-gold-400/50"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-gold-300 uppercase tracking-wider mb-1.5">WhatsApp / Phone</label>
                    <input required type="tel" placeholder="09XX XXX XXXX" value={form.phone} onChange={e => set('phone', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-gold-400/50"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-gold-300 uppercase tracking-wider mb-1.5">Date</label>
                    <input required type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-brand-gold-400/50"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-gold-300 uppercase tracking-wider mb-1.5">Start Time</label>
                    <select value={form.startHour} onChange={e => set('startHour', Number(e.target.value))}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-brand-gold-400/50"
                      style={{ background: 'rgba(30,40,60,0.9)', border: '1.5px solid rgba(255,255,255,0.15)', colorScheme: 'dark' }}>
                      {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-gold-300 uppercase tracking-wider mb-2">
                      Duration — {form.durationHours} hr{form.durationHours > 1 ? 's' : ''}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5, 6].map(h => (
                        <button key={h} type="button" onClick={() => set('durationHours', h)}
                          className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                          style={form.durationHours === h
                            ? { background: THEME.gradients.primary, color: '#0f1a2e' }
                            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }
                          }>{h}h</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-gold-300 uppercase tracking-wider mb-2">
                      Rooms — {form.rooms} room{form.rooms > 1 ? 's' : ''}
                    </label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => set('rooms', Math.max(1, form.rooms - 1))}
                        className="w-9 h-9 rounded-full font-bold text-white flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>−</button>
                      <span className="text-white font-bold text-lg w-6 text-center">{form.rooms}</span>
                      <button type="button" onClick={() => set('rooms', Math.min(SITE.ktv.roomCount, form.rooms + 1))}
                        className="w-9 h-9 rounded-full font-bold text-white flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>+</button>
                      <span className="text-xs text-gray-400 ml-1">max {SITE.ktv.roomCount}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-gold-300 uppercase tracking-wider mb-1.5">Notes (optional)</label>
                    <textarea rows={2} placeholder="Special requests, group size, etc." value={form.notes} onChange={e => set('notes', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-gold-400/50 resize-none"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)' }}>
                    <span className="text-sm text-brand-gold-300 font-medium">
                      {form.rooms} room × {form.durationHours}h × ₱{SITE.ktv.ratePerHour}
                    </span>
                    <span className="text-lg font-extrabold text-brand-gold-300">₱{total.toLocaleString()}</span>
                  </div>
                  <button type="submit" className="btn-primary w-full font-bold py-3.5 text-base" style={{ boxShadow: THEME.shadow.goldLg }}>
                    Review Booking →
                  </button>
                </motion.form>
              ) : (
                <motion.div key="step2" className="p-6 space-y-4"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={transition.fast}>
                  <p className="text-xs font-bold text-brand-gold-400 uppercase tracking-widest mb-4">Confirm details</p>
                  {[
                    { label: 'Name', value: form.name },
                    { label: 'Contact', value: form.phone },
                    { label: 'Date', value: form.date },
                    { label: 'Time', value: `${HOURS.find(h => h.value === form.startHour)?.label} · ${form.durationHours} hr${form.durationHours > 1 ? 's' : ''}` },
                    { label: 'Rooms', value: `${form.rooms} room${form.rooms > 1 ? 's' : ''}` },
                    { label: 'Total', value: `₱${total.toLocaleString()}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm border-b border-white/10 pb-2 last:border-0">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="font-semibold text-white">{row.value}</span>
                    </div>
                  ))}
                  {form.notes && <p className="text-xs text-gray-400 italic">Notes: {form.notes}</p>}
                  <p className="text-xs text-gray-500 leading-relaxed pt-1">
                    Tapping below opens WhatsApp with your inquiry pre-filled. Our team will confirm availability and payment.
                  </p>
                  <button type="button" onClick={() => {
                    const msg = buildWhatsAppMessage(form)
                    const phone = CONTACT.phone.replace('+', '')
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
                  }}
                    className="btn-primary w-full font-bold py-3.5 text-base flex items-center justify-center gap-2"
                    style={{ boxShadow: THEME.shadow.goldLg }}>
                    <MessageCircle size={20} />
                    Send via WhatsApp
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-400 hover:text-white transition-colors py-1">
                    ← Edit booking
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </MotionIn>
      </div>
    </div>
  )
}
