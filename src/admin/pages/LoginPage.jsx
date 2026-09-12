/** Halaman masuk dasbor. */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Rosette } from '@/components/ui/Icons';
import { api } from '../api';
import { LanguageSwitch, useI18n } from '../i18n';
import { errorMessage, safeNext } from '../session';
import { FOCUS, Field, INPUT, Notice, PrimaryButton, describedBy } from '../ui';

const KNOWN_LOGIN_ERRORS = [400, 401, 429];

export default function LoginPage() {
  const { t } = useI18n();
  usePageMeta(t('login.metaTitle'));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const expired = params.get('reason') === 'expired';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.me().then(
      () => active && navigate(next, { replace: true }),
      () => {},
    );
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    const errors = {};
    if (!email.trim()) errors.email = 'login.emailRequired';
    if (!password) errors.password = 'login.passwordRequired';
    setFieldErrors(errors);
    setError(null);

    if (errors.email) return emailRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();

    setPending(true);
    try {
      await api.login(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err);
      setPending(false);
    }
  }

  const errorText =
    error && (KNOWN_LOGIN_ERRORS.includes(error.status) ? t(`login.errors.${error.status}`) : errorMessage(error, t));
  const emailError = fieldErrors.email && t(fieldErrors.email);
  const passwordError = fieldErrors.password && t(fieldErrors.password);

  return (
    <main className="grid min-h-svh bg-cream min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest-deep p-[clamp(40px,5vw,72px)] text-cream min-[900px]:flex">
        <div className="flex items-center gap-3">
          <span className="text-gold">
            <Rosette size={26} />
          </span>
          <span className="font-display text-[1.2rem] font-medium tracking-[0.32em]">MATARAM</span>
        </div>

        <div className="relative z-10 max-w-[30rem]">
          <p className="mb-5 text-[0.66rem] font-medium tracking-[0.32em] uppercase text-gold">Royal Archive</p>
          <p className="font-display text-[clamp(2.4rem,4vw,3.5rem)] font-light leading-[1.05]">{t('login.panelHeadline')}</p>
          <p className="mt-5 max-w-[40ch] text-[0.92rem] leading-relaxed text-cream/72">{t('login.panelText')}</p>
        </div>

        <p className="relative z-10 text-[0.76rem] text-cream/60">{t('login.panelFootnote')}</p>

        <span className="pointer-events-none absolute -right-36 -bottom-36 text-gold/14">
          <Rosette size={560} strokeWidth={0.5} />
        </span>
      </aside>

      <div className="relative grid place-items-center px-5 pt-20 pb-14 min-[900px]:pt-14">
        <LanguageSwitch tone="light" className="absolute top-5 right-5" />

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <span className="mb-4 inline-flex items-center gap-2.5 text-gold min-[900px]:hidden">
              <Rosette size={24} />
              <span className="font-display text-[1.05rem] font-medium tracking-[0.3em] text-forest">MATARAM</span>
            </span>
            <h1 className="font-display text-[2.4rem] font-light leading-none text-forest">{t('login.title')}</h1>
            <p className="mt-2.5 text-[0.88rem] text-ink/72">{t('login.subtitle')}</p>
          </div>

          <form noValidate onSubmit={onSubmit} className="space-y-5">
            {expired && !errorText && <Notice>{t('login.expired')}</Notice>}
            {errorText && <Notice tone="error">{errorText}</Notice>}

            <Field id="login-email" label={t('login.email')} error={emailError}>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('login.emailPlaceholder')}
                aria-invalid={Boolean(emailError)}
                aria-describedby={describedBy('login-email', emailError)}
                className={cx(INPUT, 'py-3')}
              />
            </Field>

            <Field id="login-password" label={t('login.password')} error={passwordError}>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={describedBy('login-password', passwordError)}
                  className={cx(INPUT, 'py-3 pr-[118px]')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-pressed={showPassword}
                  aria-controls="login-password"
                  className={cx(
                    'absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md px-3 py-1.5 text-[0.76rem] whitespace-nowrap text-forest hover:bg-forest/8',
                    FOCUS,
                  )}
                >
                  {showPassword ? t('login.hide') : t('login.show')}
                </button>
              </div>
            </Field>

            <PrimaryButton type="submit" disabled={pending} className="w-full py-3">
              {pending ? t('login.submitting') : t('login.submit')}
            </PrimaryButton>
          </form>

          <p className="mt-8 border-t border-forest/15 pt-5 text-[0.8rem] text-ink/72">
            {t('login.notManager')}{' '}
            <Link to="/" className={cx('rounded-sm text-forest underline-offset-4 hover:underline', FOCUS)}>
              {t('login.backToSite')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
