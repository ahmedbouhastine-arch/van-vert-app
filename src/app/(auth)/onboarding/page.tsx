'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, Globe, Calendar, Camera, X, Shield, Clock,
  ChevronRight, CheckCircle,
} from 'lucide-react';

import { useUser, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { VvButton } from '@/components/vv/VvButton';
import { VvInput } from '@/components/vv/VvInput';
import { updateUserProfileAction, uploadProfilePictureAction } from '@/app/actions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


/* ── Constants ──────────────────────────────────────────────────────────── */
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahrain','Bangladesh','Belgium','Bolivia','Bosnia and Herzegovina',
  'Brazil','Brunei','Bulgaria','Cambodia','Cameroon','Canada','Chile','China',
  'Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia',
  'Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Honduras',
  'Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait',
  'Latvia','Lebanon','Libya','Lithuania','Luxembourg','Malaysia','Maldives',
  'Malta','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Nepal','Netherlands','New Zealand','Nicaragua','Nigeria','North Macedonia',
  'Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal',
  'Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea',
  'Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tanzania',
  'Thailand','Tunisia','Turkey','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam',
  'Yemen','Zambia','Zimbabwe',
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1939 }, (_, i) => CURRENT_YEAR - 10 - i);


/* ── Searchable Country Input ─────────────────────────────────────────────── */
function CountryCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes((query || '').toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync external value
  useEffect(() => { setQuery(value); }, [value]);

  const handleSelect = useCallback(
    (c: string) => {
      setQuery(c);
      onChange(c);
      setOpen(false);
      setHighlighted(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlighted >= 0) {
      const items = listRef.current.children;
      if (items[highlighted]) {
        (items[highlighted] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlighted]);

  return (
    <div ref={containerRef} className="relative">
      <VvInput
        leftIcon={<Globe className="h-4 w-4" />}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(-1);
          if (!e.target.value) onChange('');
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search countries…"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[220px] overflow-y-auto rounded-lg border-[1.5px] border-[var(--vv-border)] bg-white shadow-lg"
        >
          {filtered.map((c, i) => (
            <div
              key={c}
              onMouseDown={() => handleSelect(c)}
              onMouseEnter={() => setHighlighted(i)}
              className={`cursor-pointer px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors ${
                i === highlighted ? 'bg-[var(--sky-pale)]' : 'hover:bg-[var(--sky-pale)]'
              }`}
            >
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ── Onboarding Page ───────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, claims, loading: userLoading } = useUser();
  const auth = useAuth();

  /* ── Form state ──────────────────────────────────────────────────────── */
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Photo state ─────────────────────────────────────────────────────── */
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isComplete = selectedDay && selectedMonth && selectedYear && country;

  const firstName = user?.displayName?.split(' ')[0] || 'Pilot';
  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  /* ── Redirect logic ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login');
    } else if (!user.emailVerified) {
      router.push('/verify-email');
    }
    // If user already has birthDate + country, they've already onboarded —
    // redirect to dashboard:
    if (claims?.birthDate && claims?.country) {
      router.push('/dashboard');
    }
  }, [user, userLoading, claims, router]);

  /* ── Photo handler ───────────────────────────────────────────────────── */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Submit handler ──────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !user) return;

    setIsSubmitting(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Could not retrieve authentication token.');

      // Build birthDate as YYYY-MM-DD
      const monthIndex = MONTHS.indexOf(selectedMonth);
      const birthDate = new Date(
        Date.UTC(parseInt(selectedYear), monthIndex, parseInt(selectedDay))
      )
        .toISOString()
        .split('T')[0];

      // Update profile (birthDate + country)
      const { success } = await updateUserProfileAction(
        { birthDate, country },
        idToken
      );

      if (!success) throw new Error('Profile update failed.');

      // Upload photo if provided
      if (photoFile) {
        try {
          const fd = new FormData();
          fd.append('file', photoFile, 'profile-picture.png');
          await uploadProfilePictureAction(fd, idToken);
        } catch {
          // Non-blocking — photo upload failure shouldn't block onboarding
          console.error('Profile picture upload failed');
        }
      }

      toast({ title: 'Profile saved!' });
      router.push('/dashboard');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unexpected error occurred.');
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message,
      });
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Skipped',
      description: 'You can complete your profile later in Settings.',
    });
    router.push('/dashboard');
  };

  /* ── Loading / guard skeleton ────────────────────────────────────────── */
  if (userLoading || !user || !user.emailVerified) {
    return (
      <div
        className="flex min-h-screen"
        style={{ display: 'grid', gridTemplateColumns: '5fr 6fr' }}
      >
        <div className="hidden bg-[var(--navy)] lg:block" />
        <div className="flex flex-col items-center justify-center bg-white px-12 py-16">
          <div className="w-full max-w-[440px]">
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="mb-10 h-4 w-72" />
            <div className="mb-6 flex items-center gap-5 rounded-xl border border-[var(--vv-border-soft)] bg-[var(--surface)] p-5">
              <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <Skeleton className="mb-2 h-3 w-20" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              </div>
              <div>
                <Skeleton className="mb-2 h-3 w-32" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div
      className="flex min-h-screen"
      style={{ display: 'grid', gridTemplateColumns: '5fr 6fr' }}
    >
      {/* ── Left — navy brand panel ──────────────────────────────────────── */}
      <aside
        className="relative hidden lg:flex"
        style={{
          background: 'var(--navy)',
          color: 'white',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        {/* Decorative arcs */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -180,
            left: -180,
            opacity: 0.06,
            pointerEvents: 'none',
          }}
          width="640"
          height="640"
          viewBox="0 0 640 640"
        >
          {[280, 220, 160, 100, 40].map((r) => (
            <circle key={r} cx="320" cy="320" r={r} fill="none" stroke="white" strokeWidth="1" />
          ))}
        </svg>

        {/* Progress breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3.5 py-2">
            <CheckCircle className="h-3.5 w-3.5 text-[var(--status-ready)]" />
            <span className="text-xs font-medium text-white/60">Account created</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-white/30" />
          <div className="flex items-center gap-2 rounded-lg border border-[var(--sky-bright)]/25 bg-[var(--sky-bright)]/15 px-3.5 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sky-bright)]" />
            <span className="text-xs font-semibold text-white">Personal details</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative max-w-[420px]">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            <span style={{ color: 'white' }}>Van-</span>
            <span style={{ color: 'var(--sky-bright)' }}>Vert</span>
          </span>

          <div
            className="mt-12"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'var(--sky-bright)',
            }}
          >
            Almost there
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 36,
              lineHeight: 1.15,
              letterSpacing: '-0.015em',
              color: 'white',
              marginTop: 16,
            }}
          >
            Tell us a little about yourself, {firstName}.
          </h2>

          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            We need a few personal details to match your conversion application with the right
            authority requirements. This takes under a minute.
          </p>

          {/* Info cards */}
          <div className="mt-10 flex flex-col gap-3.5">
            {[
              { icon: Shield, text: 'Your data is encrypted and never shared without your consent.' },
              { icon: Clock, text: 'You can update these details anytime from your profile.' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 rounded-[10px] border border-white/[0.06] bg-white/[0.04] px-4 py-3.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--sky-bright)]/12">
                  <item.icon className="h-[15px] w-[15px] text-[var(--sky-bright)]" />
                </div>
                <span className="text-[13px] leading-relaxed text-white/55">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'relative',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Vanguard Aviation Academy
        </div>
      </aside>

      {/* ── Right — form ──────────────────────────────────────────────────── */}
      <main className="flex flex-col items-center justify-center bg-white px-12 py-16">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Header */}
          <div className="mb-9">
            <h1
              className="font-outfit text-[28px] font-semibold tracking-tight text-[var(--navy)]"
              style={{ letterSpacing: '-0.02em' }}
            >
              Personal details
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Help us set up your pilot profile. Fields marked with{' '}
              <span className="text-[var(--status-missing)]">*</span> are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* ── Profile photo ──────────────────────────────────────────── */}
            <div className="flex items-center gap-5 rounded-xl border border-[var(--vv-border-soft)] bg-[var(--surface)] p-5">
              <label className="group relative cursor-pointer" title="Upload photo">
                <Avatar className="h-24 w-24 border-[3px] border-[var(--sky-pale)]">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt="Profile preview" />
                  ) : (
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-[var(--navy)] to-[var(--sky)] font-outfit text-3xl font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--navy)]/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>

              <div className="flex-1">
                <div className="font-outfit text-[15px] font-semibold text-[var(--navy)]">
                  Profile photo
                </div>
                <div className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
                  Optional — helps reviewers identify you. You can always add one later.
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--status-missing)] transition-opacity hover:opacity-70"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>

            {/* ── Date of birth ──────────────────────────────────────────── */}
            <div>
              <Label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
                Date of birth <span className="text-[var(--status-missing)]">*</span>
              </Label>
              <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="rounded-lg border-[var(--vv-border)]">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="rounded-lg border-[var(--vv-border)]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="rounded-lg border-[var(--vv-border)]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                Required by most aviation authorities for identity verification.
              </p>
            </div>

            {/* ── Country of residence ──────────────────────────────────────── */}
            <div>
              <Label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                <Globe className="h-3 w-3 text-[var(--text-muted)]" />
                Country of residence <span className="text-[var(--status-missing)]">*</span>
              </Label>
              <CountryCombobox value={country} onChange={setCountry} />
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                This helps us determine which authority conversions apply to you.
              </p>
            </div>

            {/* ── Divider ──────────────────────────────────────────────────── */}
            <hr className="border-[var(--vv-border)]" />

            {/* ── Actions ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5">
              <VvButton
                type="submit"
                size="lg"
                loading={isSubmitting}
                disabled={!isComplete || isSubmitting}
                className="w-full justify-center"
              >
                Continue to dashboard <ArrowRight className="h-4 w-4" />
              </VvButton>

              <VvButton
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full justify-center"
              >
                Skip for now
              </VvButton>
            </div>

            {/* ── Footer note ──────────────────────────────────────────────── */}
            <p className="mt-1 text-center text-xs leading-relaxed text-[var(--text-muted)]">
              By continuing you confirm these details are accurate. See our{' '}
              <Link href="/privacy" className="text-[var(--text-secondary)] underline">
                Privacy Policy
              </Link>{' '}
              for how we handle your data.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
