"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  HeartCrack,
  Lightbulb,
  Loader2,
  PartyPopper,
  Sparkles,
  Star,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { BottomNav } from "@/components/BottomNav";
import { ChallengeCompletedCard } from "@/components/ChallengeCompletedCard";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ChallengeSkeleton } from "@/components/skeletons/PageSkeletons";
import { formatDurationMs } from "@/lib/format";
import { repairInflatedDurationMs, capAttemptDurationMs } from "@/lib/challenge-timer";
import { invalidateMeCache } from "@/lib/client/me-cache";
import {
  fetchChallengeToday,
  invalidateChallengeCache,
  type ChallengeTodayResponse,
} from "@/lib/client/challenge-cache";
import { WalletPicker } from "@/components/WalletPicker";
import { useIsMiniPay } from "@/hooks/useIsMiniPay";
import { isCustomSepoliaTcopm, filterRecoveryTokensForMiniPay } from "@/lib/chain/minipay-tokens";
import {
  clearPendingRefill,
  pollRefillUntilConfirmed,
  readPendingRefill,
  savePendingRefill,
  tryRecoverRefillStateFromServer,
  type RefillApiSuccess,
} from "@/lib/client/pending-refill";
import {
  connectWallet,
  sendRecoveryPayment,
  type RecoveryToken,
} from "@/lib/wallet";
import {
  getPreferredWalletProvider,
  getWalletProvider,
  savePreferredWalletProvider,
  type WalletProviderId,
} from "@/lib/wallet-providers";
import { isApiClientError } from "@/lib/client/api-fetch";
import { formatApiErrorMessage } from "@/lib/client/format-api-error";
import { LIVES_PER_DAY } from "@/lib/game";

type Question = {
  id: string;
  category: string;
  difficulty?: number;
  text: string;
  options: string[];
};

type AnswerRecord = {
  questionId: string;
  answerIndex: number;
  correct: boolean;
};

type Feedback = {
  correct: boolean;
  correctIndex: number;
  explanation: string;
};

type Summary = {
  xpEarned: number;
  correctCount: number;
  totalAnswered: number;
  totalQuestions: number;
  streak: number;
  durationMs: number | null;
  outOfLives: boolean;
};

type RefillStep = "idle" | "wallet" | "verifying" | "success";

export default function ChallengePage() {
  const { t, locale } = useLocale();
  const miniPay = useIsMiniPay();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [livesLeft, setLivesLeft] = useState(LIVES_PER_DAY);
  const [xpEarned, setXpEarned] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingRefill, setAwaitingRefill] = useState(false);
  const [canRefill, setCanRefill] = useState(false);
  const [refilling, setRefilling] = useState(false);
  const [refillStep, setRefillStep] = useState<RefillStep>("idle");
  const [refillStatus, setRefillStatus] = useState<string | null>(null);
  const [refillError, setRefillError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [durationOffset, setDurationOffset] = useState(0);
  const [recoveryTokens, setRecoveryTokens] = useState<RecoveryToken[]>(["USDC"]);
  const [selectedToken, setSelectedToken] = useState<RecoveryToken>("USDC");
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [sessionWallet, setSessionWallet] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletProviderId | null>(null);
  const [tokenPriceLabels, setTokenPriceLabels] = useState<Record<string, string>>({});
  const [recoveryPriceUsd, setRecoveryPriceUsd] = useState(0.1);
  const [copPerUsd, setCopPerUsd] = useState("");

  useEffect(() => {
    if (miniPay) {
      setSelectedWallet("minipay");
      savePreferredWalletProvider("minipay");
      setSelectedToken("USDC");
      setRecoveryTokens(["USDC"]);
      return;
    }
    setSelectedWallet(getPreferredWalletProvider());
  }, [miniPay]);

  useEffect(() => {
    if (!awaitingRefill) return;
    let cancelled = false;

    async function loadBalance() {
      try {
        const res = await fetch(
          `/api/wallet/recovery-balance?token=${encodeURIComponent(selectedToken)}`,
          { credentials: "include" }
        );
        if (!res.ok || cancelled) return;
        const payload = await res.json();
        if (!cancelled) {
          setTokenBalance(`${payload.display} ${payload.symbol}`);
          if (typeof payload.requiredDisplay === "string") {
            setTokenPriceLabels((prev) => ({
              ...prev,
              [selectedToken]: payload.requiredDisplay,
            }));
          }
          if (typeof payload.walletAddress === "string") {
            setSessionWallet(payload.walletAddress);
          }
        }
      } catch {
        if (!cancelled) setTokenBalance(null);
      }
    }

    void loadBalance();
    return () => {
      cancelled = true;
    };
  }, [awaitingRefill, selectedToken]);

  async function applyChallengeData(data: ChallengeTodayResponse) {
    if (data.progress?.completed) {
      setXpEarned(data.progress.xpEarned ?? 0);
      setAlreadyDone(true);
      return;
    }
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      setLoadError(t.challenge.loadError);
      return;
    }

    const answers: AnswerRecord[] = data.progress.answers;
    setQuestions(data.questions);
    const safeIndex =
      data.questions.length === 0
        ? 0
        : Math.min(answers.length, data.questions.length - 1);
    setCurrentIndex(safeIndex);
    setLivesLeft(data.progress.livesLeft);
    setXpEarned(data.progress.xpEarned);
    setAwaitingRefill(!!data.progress.awaitingRefill);
    setCanRefill(!!data.progress.canRefill);
    if (data.progress.startedAt) setStartedAt(data.progress.startedAt);
    setDurationOffset(
      repairInflatedDurationMs(
        data.progress.activeDurationMs ?? 0,
        data.progress.awaitingRefill ? "awaiting_refill" : "in_progress",
        answers.length,
        !!data.progress.completed
      )
    );
    if (answers.length > 0) setIntroDismissed(true);
  }

  function applyDurationFromServer(
    ms: number,
    answerCount: number,
    result: string,
    completed: boolean
  ) {
    setDurationOffset(repairInflatedDurationMs(ms, result, answerCount, completed));
  }
  async function loadChallenge(force = false) {
    setLoadError(null);
    try {
      const data = await fetchChallengeToday(locale, { force });
      await applyChallengeData(data);
    } catch (e) {
      if (isApiClientError(e) && e.kind === "UNAUTHORIZED") {
        window.location.assign("/connect");
        return;
      }
      setLoadError(
        formatApiErrorMessage(e, t.apiErrors, { showDebug: miniPay })
      );
    }
  }

  async function loadRecoveryMeta() {
    try {
      const res = await fetch("/api/challenge/recovery", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const apiTokens = data.tokens;
      if (Array.isArray(apiTokens) && apiTokens.length > 0) {
        const filteredTokens = miniPay
          ? filterRecoveryTokensForMiniPay(
              apiTokens.filter(
                (t): t is { id: RecoveryToken; priceDisplay?: string } =>
                  typeof t === "object" && t?.id != null
              )
            )
          : apiTokens;
        const ids = filteredTokens
          .map((t: { id?: string; priceDisplay?: string } | string) =>
            typeof t === "string" ? t : t.id
          )
          .filter(Boolean) as RecoveryToken[];
        const labels: Record<string, string> = {};
        for (const t of filteredTokens) {
          if (typeof t === "object" && t?.id && t?.priceDisplay) {
            labels[t.id] = t.priceDisplay;
          }
        }
        if (Object.keys(labels).length > 0) setTokenPriceLabels(labels);
        if (ids.length > 0) {
          setRecoveryTokens(ids);
          let preferred: RecoveryToken = miniPay ? "USDC" : ids[0];
          const tokenOrder = miniPay
            ? (["USDC"] as RecoveryToken[])
            : ids;
          for (const id of tokenOrder) {
            try {
              const balRes = await fetch(
                `/api/wallet/recovery-balance?token=${encodeURIComponent(id)}`,
                { credentials: "include" }
              );
              if (!balRes.ok) continue;
              const bal = await balRes.json();
              if (typeof bal.requiredDisplay === "string") {
                labels[id] = bal.requiredDisplay;
              }
              if (!bal.sufficient) continue;
              if (
                !miniPay &&
                id === "tCOPM" &&
                typeof bal.tokenAddress === "string" &&
                isCustomSepoliaTcopm(bal.tokenAddress)
              ) {
                continue;
              }
              preferred = id;
              break;
            } catch {
              continue;
            }
          }
          if (Object.keys(labels).length > 0) setTokenPriceLabels(labels);
          setSelectedToken(preferred);
        }
      }
      if (typeof data.priceUsd === "number") {
        setRecoveryPriceUsd(data.priceUsd);
      }
      if (typeof data.copPerUsd === "string") {
        setCopPerUsd(data.copPerUsd);
      }
    } catch {
      /* recovery meta is optional until refill screen */
    }
  }

  useEffect(() => {
    if (!awaitingRefill) return;
    void loadRecoveryMeta();
  }, [awaitingRefill]);

  function applyRefillSuccess(data: RefillApiSuccess) {
    setLivesLeft(data.livesLeft);
    setAwaitingRefill(false);
    setCanRefill(false);
    if (data.startedAt) setStartedAt(data.startedAt);
    if (typeof data.activeDurationMs === "number") {
      setDurationOffset(data.activeDurationMs);
    }
    setFeedback(null);
    setSelected(null);
    setRefillStep("idle");
    setRefillStatus(null);
    setRefillError(null);
    clearPendingRefill();
    invalidateChallengeCache();
    invalidateMeCache();
  }

  async function confirmRefillOnServer(
    txHash: string,
    token: RecoveryToken,
    payerWallet?: string
  ): Promise<"confirmed" | "pending" | "failed"> {
    setRefillStep("verifying");
    setRefillError(null);
    setRefillStatus(t.challenge.verifyingPayment);

    const result = await pollRefillUntilConfirmed(txHash, token, {
      payerWallet,
      maxWallMs: 180_000,
      retryDelayMs: 5_000,
      fetchTimeoutMs: 22_000,
      onProgress: ({ attempt }) => {
        setRefillStatus(
          t.challenge.verifyingPaymentProgress.replace("{n}", String(attempt))
        );
      },
    });

    if (result.outcome === "confirmed") {
      setRefillStep("success");
      setRefillStatus(t.challenge.lifeRestored);
      await new Promise((r) => setTimeout(r, 1100));
      applyRefillSuccess(result.data);
      void syncProgress();
      return "confirmed";
    }

    if (result.outcome === "pending") {
      setRefillStep("verifying");
      setRefillStatus(t.challenge.verifyingPayment);
      setRefillError(null);
      return "pending";
    }

    setRefillStep("idle");
    setRefillStatus(null);
    setRefillError(formatRefillError(null, result.error));
    return "failed";
  }

  async function handleRetryVerify() {
    const pending = readPendingRefill();
    if (!pending || refilling) return;
    setRefilling(true);
    setRefillError(null);
    try {
      await confirmRefillOnServer(
        pending.txHash,
        pending.token,
        sessionWallet ?? undefined
      );
    } finally {
      setRefilling(false);
    }
  }

  useEffect(() => {
    if (!awaitingRefill || refilling) return;
    const pending = readPendingRefill();
    if (!pending) return;

    let cancelled = false;
    setRefilling(true);
    setRefillStep("verifying");
    setRefillStatus(t.challenge.verifyingPayment);

    void (async () => {
      const recovered = await tryRecoverRefillStateFromServer();
      if (cancelled) return;
      if (recovered) {
        setRefillStep("success");
        applyRefillSuccess(recovered);
        setRefilling(false);
        return;
      }

      const outcome = await confirmRefillOnServer(
        pending.txHash,
        pending.token,
        sessionWallet ?? undefined
      );
      if (!cancelled) setRefilling(false);
      if (!cancelled && outcome === "pending") {
        setRefillStep("verifying");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume pending tx once
  }, [awaitingRefill]);

  useEffect(() => {
    if (!awaitingRefill || refilling) return;
    if (refillStep !== "verifying") return;
    const pending = readPendingRefill();
    if (!pending) return;

    const interval = window.setInterval(() => {
      void (async () => {
        const recovered = await tryRecoverRefillStateFromServer();
        if (recovered) {
          setRefillStep("success");
          applyRefillSuccess(recovered);
          return;
        }
        const result = await pollRefillUntilConfirmed(
          pending.txHash,
          pending.token,
          {
            payerWallet: sessionWallet ?? undefined,
            maxWallMs: 25_000,
            retryDelayMs: 4_000,
            fetchTimeoutMs: 22_000,
          }
        );
        if (result.outcome === "confirmed") {
          setRefillStep("success");
          setRefillStatus(t.challenge.lifeRestored);
          applyRefillSuccess(result.data);
        }
      })();
    }, 20_000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- background sync while verifying
  }, [awaitingRefill, refilling, refillStep, sessionWallet]);

  useEffect(() => {
    setLoading(true);
    void loadChallenge(true)
      .catch(() => setLoadError(t.common.error))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const question = questions[currentIndex];
  const showIntro =
    !loading &&
    questions.length > 0 &&
    currentIndex === 0 &&
    !feedback &&
    !summary &&
    !awaitingRefill &&
    !introDismissed;

  async function handleStartChallenge() {
    setIntroDismissed(true);
    try {
      const res = await fetch("/api/challenge/start-timer", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          startedAt?: string;
          activeDurationMs?: number;
        };
        if (data.startedAt) setStartedAt(data.startedAt);
        if (typeof data.activeDurationMs === "number") {
          applyDurationFromServer(data.activeDurationMs, 0, "in_progress", false);
        }
      } else {
        setStartedAt(new Date().toISOString());
      }
    } catch {
      setStartedAt(new Date().toISOString());
    }
  }

  async function handleCheck() {
    if (selected === null || !question || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenge/answer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          answerIndex: selected,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) await syncProgress();
        return;
      }
      invalidateChallengeCache();
      setFeedback({
        correct: data.correct,
        correctIndex: data.correctIndex,
        explanation: data.explanation,
      });
      setLivesLeft(data.livesLeft);
      setXpEarned(data.xpEarned);
      if (data.summary) {
        invalidateMeCache();
        invalidateChallengeCache();
        setSummary(data.summary);
        if (data.summary.durationMs != null) {
          setDurationOffset(data.summary.durationMs);
        }
      } else if (typeof data.activeDurationMs === "number") {
        applyDurationFromServer(
          data.activeDurationMs,
          currentIndex + 1,
          data.awaitingRefill ? "awaiting_refill" : "in_progress",
          false
        );
      }
      if (data.startedAt) setStartedAt(data.startedAt);
      if (data.awaitingRefill) {
        setAwaitingRefill(true);
        setCanRefill(data.canRefill);
      } else {
        setAwaitingRefill(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function syncProgress() {
    invalidateChallengeCache();
    await loadChallenge(true);
  }

  function handleNext() {
    if (awaitingRefill && !summary) {
      setFeedback(null);
      setSelected(null);
      void syncProgress();
      return;
    }
    setFeedback(null);
    setSelected(null);
    setCurrentIndex((i) => i + 1);
  }

  function requiredAmountForToken(
    token: RecoveryToken,
    override?: string
  ): string {
    if (override) return override;
    if (tokenPriceLabels[token]) return tokenPriceLabels[token];
    if (token === "USDC") return `${recoveryPriceUsd.toFixed(2)} USDC`;
    return `${recoveryPriceUsd.toFixed(2)} USD`;
  }

  function insufficientBalanceMessage(
    token: RecoveryToken,
    override?: string
  ): string {
    return t.challenge.insufficientBalance.replace(
      "{amount}",
      requiredAmountForToken(token, override)
    );
  }

  function refillErrorMessage(err: unknown, apiError?: string): string {
    if (apiError === "INVALID_PAYMENT") return t.challenge.refillInvalidPayment;
    if (apiError === "SERVER_ERROR" || apiError?.startsWith("HTTP_5")) {
      return t.challenge.refillServerRetry;
    }
    if (apiError === "TX_FAILED") return t.challenge.refillTxFailed;
    if (apiError === "TX_NOT_FOUND") return t.challenge.refillTxNotFound;
    if (apiError === "VERIFY_TIMEOUT" || apiError === "PAYMENT_PENDING") {
      return t.challenge.verifyingPayment;
    }
    if (apiError === "WALLET_MISMATCH") return t.challenge.walletMismatch;
    if (apiError === "PAYMENT_NOT_CONFIGURED") {
      return t.challenge.refillPaymentNotConfigured;
    }
    if (apiError === "TX_ALREADY_USED" || apiError === "REFILL_ALREADY_USED") {
      return t.challenge.refillAlreadyUsed;
    }
    if (err instanceof Error) {
      switch (err.message) {
        case "USER_REJECTED":
          return t.challenge.paymentRejected;
        case "WRONG_NETWORK":
          return miniPay ? t.challenge.wrongNetworkMiniPay : t.challenge.wrongNetwork;
        case "WALLET_NOT_INSTALLED":
          return t.connect.walletNotInstalled;
        case "NO_WALLET":
          return t.connect.noWallet;
        case "WALLET_MISMATCH":
          return t.challenge.walletMismatch;
        case "INSUFFICIENT_BALANCE":
          return insufficientBalanceMessage(selectedToken);
        case "PAYMENT_NOT_CONFIGURED":
          return t.challenge.refillNotConfigured;
        case "TX_FAILED":
          return t.challenge.refillTxFailed;
        case "TX_NOT_FOUND":
          return t.challenge.refillTxNotFound;
        case "APPROVE_PENDING":
          return miniPay
            ? t.challenge.refillApprovePending
            : t.challenge.refillTxNotFound;
        case "MINIPAY_CUSTOM_TCOPM":
          return t.challenge.minipayCustomTcopm;
        case "WALLET_TX_FAILED":
          return miniPay
            ? t.challenge.refillWalletTxFailed
            : t.challenge.refillError;
        case "PREPARE_FAILED":
          return t.challenge.refillError;
        default:
          if (err.message.startsWith("WALLET_TX_FAILED")) {
            return miniPay
              ? t.challenge.refillWalletTxFailed
              : t.challenge.refillError;
          }
          break;
      }
    }
    if (apiError === "Refill not available") {
      return t.challenge.refillNotAvailable;
    }
    if (apiError === "Not authenticated") {
      return t.connect.errorGeneric;
    }
    return t.challenge.refillError;
  }

  function formatRefillError(err: unknown, apiError?: string): string {
    const base = refillErrorMessage(err, apiError);
    if (!miniPay) return base;
    const code =
      apiError ??
      (err instanceof Error ? err.message.split(":")[0] : undefined);
    let detail =
      err instanceof Error && err.message.includes(":")
        ? err.message.slice(err.message.indexOf(":") + 1).trim()
        : apiError;
    if (detail && detail.length > 72) {
      detail = `${detail.slice(0, 69)}…`;
    }
    return detail && detail !== base ? `${base} [${detail}]` : code ? `${base} [${code}]` : base;
  }

  function handleSelectWallet(id: WalletProviderId) {
    setSelectedWallet(id);
    savePreferredWalletProvider(id);
    setRefillError(null);
  }

  async function handleRefill() {
    setRefillError(null);
    setRefillStatus(null);
    const walletId: WalletProviderId | null = miniPay ? "minipay" : selectedWallet;
    if (!walletId) {
      setRefillError(t.connect.chooseWalletFirst);
      return;
    }
    if (!getWalletProvider(walletId)) {
      setRefillError(t.connect.walletNotInstalled);
      return;
    }
    const payToken: RecoveryToken = miniPay ? "USDC" : selectedToken;
    setRefilling(true);
    setRefillStep("wallet");
    setRefillStatus(t.challenge.openingWallet);
    try {
      let payerWallet = sessionWallet;

      if (miniPay) {
        try {
          payerWallet = await connectWallet("minipay");
          setSessionWallet(payerWallet);
        } catch (err) {
          setRefillStep("idle");
          setRefillStatus(null);
          setRefillError(formatRefillError(err));
          return;
        }
      }

      const balRes = await fetch(
        `/api/wallet/recovery-balance?token=${encodeURIComponent(payToken)}`,
        { credentials: "include" }
      );
      if (balRes.ok) {
        const bal = await balRes.json();
        if (typeof bal.walletAddress === "string" && !miniPay) {
          payerWallet = bal.walletAddress;
          setSessionWallet(bal.walletAddress);
        }
        if (!miniPay && !bal.sufficient) {
          setRefillStep("idle");
          setRefillStatus(null);
          setRefillError(
            insufficientBalanceMessage(
              payToken,
              typeof bal.requiredDisplay === "string"
                ? bal.requiredDisplay
                : undefined
            )
          );
          return;
        }
        if (miniPay && typeof bal.walletAddress === "string") {
          const sessionAddr = bal.walletAddress.toLowerCase();
          if (payerWallet && payerWallet.toLowerCase() !== sessionAddr) {
            setRefillStep("idle");
            setRefillStatus(null);
            setRefillError(t.challenge.walletMismatch);
            return;
          }
        }
        if (miniPay && typeof bal.display === "string" && bal.symbol) {
          setTokenBalance(`${bal.display} ${bal.symbol}`);
        }
        if (
          !miniPay &&
          payToken === "tCOPM" &&
          typeof bal.tokenAddress === "string" &&
          isCustomSepoliaTcopm(bal.tokenAddress)
        ) {
          setRefillStep("idle");
          setRefillStatus(null);
          setRefillError(t.challenge.minipayCustomTcopm);
          return;
        }
      }

      clearPendingRefill();

      const { hash: txHash, token: paidToken } = await sendRecoveryPayment(
        payToken,
        walletId,
        payerWallet ?? undefined
      );

      savePendingRefill({ txHash, token: paidToken });
      setRefillStep("verifying");
      setRefillStatus(t.challenge.verifyingPayment);
      const outcome = await confirmRefillOnServer(
        txHash,
        paidToken,
        payerWallet ?? undefined
      );
      if (outcome === "pending") {
        setRefillError(null);
      }
    } catch (err) {
      setRefillStep("idle");
      setRefillStatus(null);
      setRefillError(formatRefillError(err));
    } finally {
      setRefilling(false);
    }
  }

  async function handleForfeit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenge/forfeit", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.summary) {
        invalidateMeCache();
        setSummary({
          ...data.summary,
          totalQuestions: questions.length,
        });
        if (data.summary.durationMs != null) {
          setDurationOffset(data.summary.durationMs);
        }
        setAwaitingRefill(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ChallengeShell>
        <ChallengeSkeleton />
        <BottomNav variant="perfil" />
      </ChallengeShell>
    );
  }

  if (loadError) {
    return (
      <ChallengeShell>
        <CenterScreen>
          <XCircle className="size-16 text-danger" />
          <p className="mt-4 font-display text-lg font-semibold text-h-foreground">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadChallenge(true)
                .catch(() => setLoadError(t.common.error))
                .finally(() => setLoading(false));
            }}
            className="btn-chunky mt-6 rounded-2xl bg-prosperity px-8 py-4 font-display text-base font-bold text-h-background"
          >
            {t.common.retry}
          </button>
          <Link
            href="/home"
            className="mt-4 text-sm font-semibold text-h-muted underline"
          >
            {t.challenge.backHome}
          </Link>
        </CenterScreen>
      </ChallengeShell>
    );
  }

  if (alreadyDone && !summary && !awaitingRefill) {
    return (
      <ChallengeShell>
        <main className="flex flex-1 flex-col justify-center px-4 pb-28 safe-top">
          <ChallengeCompletedCard
            layout="full"
            title={t.home.dailyChallengeDone}
            subtitle={t.challenge.comeBackTomorrow}
            xp={xpEarned}
            xpBadgeLabel={t.home.xpEarnedBadge}
            rankingLabel={t.challenge.seeRanking}
            homeLabel={t.challenge.backHome}
            playTabLabel={t.home.playTab.toUpperCase()}
            className="w-full max-w-sm mx-auto"
          />
        </main>
        <BottomNav variant="perfil" />
      </ChallengeShell>
    );
  }

  if (showIntro) {
    return (
      <ChallengeShell>
        <IntroScreen
          title={t.challenge.readyTitle}
          subtitle={t.challenge.readySubtitle}
          dailyLabel={t.challenge.dailyChallenge}
          cta={t.challenge.startChallenge}
          onStart={() => void handleStartChallenge()}
        />
        <BottomNav variant="perfil" />
      </ChallengeShell>
    );
  }

  if (awaitingRefill && !feedback && !summary) {
    return (
      <ChallengeShell>
        <main className="flex flex-1 flex-col px-4 pb-28 safe-top">
          <RefillScreen
            title={t.challenge.dailyAttemptEnded}
            body={t.challenge.dailyAttemptEndedBody}
            livesLabel={`0 ${t.challenge.livesAvailable}`}
            earnedLabel={`+${xpEarned} XP ${t.challenge.earnedSoFar}`}
            elapsedMs={capAttemptDurationMs(durationOffset)}
            timerPaused
            timeLabel={t.challenge.elapsedTime}
            recoverLabel={t.challenge.recoverEnergy}
            refillNote={`$${recoveryPriceUsd.toFixed(2)} USD${copPerUsd ? ` · 1 USD = ${Number(copPerUsd).toLocaleString()} COP` : ""} · ${t.challenge.oneRefillPerDay}`}
            tokenPriceLabels={tokenPriceLabels}
            tokenBalance={tokenBalance}
            balanceLabel={t.challenge.yourBalance}
            recoveryTokens={recoveryTokens}
            selectedToken={selectedToken}
            onSelectToken={setSelectedToken}
            refillError={refillError}
            refilling={refilling}
            refillStep={refillStep}
            refillStatus={refillStatus}
            canRefill={canRefill}
            payWithTokenLabel={t.challenge.payWithToken}
            selectTokenLabel={t.challenge.selectPaymentToken}
            processingLabel={t.challenge.processingPayment}
            confirmingLabel={t.challenge.verifyingPayment}
            confirmingHint={t.challenge.confirmingPaymentHint}
            lifeRestoredLabel={t.challenge.lifeRestored}
            openingWalletLabel={t.challenge.openingWallet}
            waitLabel={t.challenge.waitForReset}
            onRefill={handleRefill}
            onRetryVerify={handleRetryVerify}
            showRetryVerify={
              (!!readPendingRefill() && refillStep === "verifying") ||
              (!!readPendingRefill() && !!refillError)
            }
            retryVerifyLabel={t.challenge.retryVerifyPayment}
            onForfeit={handleForfeit}
            submitting={submitting}
            selectedWallet={selectedWallet}
            onSelectWallet={handleSelectWallet}
            walletLabels={{
              chooseWallet: t.connect.chooseWallet,
              notInstalled: t.connect.notInstalled,
              install: t.connect.installWallet,
            }}
            hideWalletPicker={miniPay}
            hideTokenPicker={miniPay}
            minipayHint={
              miniPay ? t.challenge.minipayAmountHint : undefined
            }
          />
        </main>
        <BottomNav variant="perfil" />
      </ChallengeShell>
    );
  }

  if (summary && !feedback && !awaitingRefill) {
    const ratio =
      summary.totalQuestions > 0
        ? summary.correctCount / summary.totalQuestions
        : 0;
    const headline = summary.outOfLives
      ? t.challenge.outOfLives
      : t.challenge.summaryTitle;
    const sub = summary.outOfLives
      ? t.challenge.outOfLivesBody
      : ratio === 1
        ? t.challenge.summaryPerfect
        : ratio >= 0.6
          ? t.challenge.summaryGood
          : t.challenge.summaryOk;

    return (
      <ChallengeShell>
        <main className="flex flex-1 flex-col px-4 pb-28 safe-top">
          <SummaryScreen
            headline={headline}
            sub={sub}
            outOfLives={summary.outOfLives}
            perfect={ratio === 1}
            xp={summary.xpEarned}
            correct={`${summary.correctCount}/${summary.totalQuestions}`}
            streak={summary.streak}
            durationMs={summary.durationMs}
            xpLabel={t.challenge.xpEarned}
            correctLabel={t.challenge.correct}
            streakLabel={t.challenge.streakUp}
            timeLabel={t.challenge.timeTaken}
            rankingLabel={t.challenge.seeRanking}
            homeLabel={t.challenge.backHome}
            progressLabel={t.home.myProgress}
          />
        </main>
        <BottomNav variant="perfil" />
      </ChallengeShell>
    );
  }

  if (!question && !loading && !loadError) {
    return (
      <ChallengeShell>
        <CenterScreen>
          <XCircle className="size-16 text-danger" />
          <p className="mt-4 font-display text-lg font-semibold text-h-foreground">
            {t.challenge.loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoadError(null);
              setLoading(true);
              loadChallenge(true)
                .catch(() => setLoadError(t.common.error))
                .finally(() => setLoading(false));
            }}
            className="btn-chunky mt-6 rounded-2xl bg-prosperity px-8 py-4 font-display text-base font-bold text-h-background"
          >
            {t.common.retry}
          </button>
        </CenterScreen>
        <BottomNav variant="perfil" />
      </ChallengeShell>
    );
  }

  const progressPct = Math.round((currentIndex / questions.length) * 100);

  return (
    <ChallengeShell>
      <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden px-4 safe-top">
        <div className="mb-4 flex shrink-0 animate-card-pop items-center gap-2">
          <div className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-h-background ring-1 ring-h-border">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-prosperity to-lemon transition-all duration-700 ease-out"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            >
              <div className="absolute inset-y-0 left-0 w-1/2 animate-shimmer bg-white/25" />
            </div>
          </div>
          <span
            className={`flex shrink-0 items-center gap-0.5 font-display text-sm font-bold ${
              livesLeft > 0 ? "text-danger" : "text-h-muted"
            }`}
          >
            {livesLeft > 0 ? (
              <Heart className="size-4 fill-danger text-danger" />
            ) : (
              <HeartCrack className="size-4" />
            )}
            {livesLeft}
          </span>
        </div>

        <div
          key={question.id}
          className="shrink-0 animate-card-pop"
          style={{ animationDelay: "80ms" }}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-prosperity/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-prosperity">
              {t.challenge.question} {currentIndex + 1} {t.challenge.of}{" "}
              {questions.length}
            </span>
            <CategoryBadge category={question.category} />
            {question.difficulty && (
              <span className="rounded-full bg-h-background px-2 py-0.5 text-[10px] font-bold text-h-muted ring-1 ring-h-border">
                {t.challenge.difficultyLabel} {question.difficulty}
              </span>
            )}
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-h-foreground">
            {question.text}
          </h2>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto pb-2">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            let style =
              "bg-surface text-h-foreground ring-1 ring-h-border hover:ring-prosperity/40";
            let badgeStyle = "bg-h-background text-h-muted ring-1 ring-h-border";
            let icon: ReactNode = letter;

            if (feedback) {
              if (i === feedback.correctIndex) {
                style = "bg-prosperity/15 text-h-foreground ring-2 ring-prosperity/50";
                badgeStyle = "bg-prosperity text-h-background ring-0";
                icon = <CheckCircle2 className="size-4" />;
              } else if (i === selected && !feedback.correct) {
                style = "bg-danger/10 text-h-foreground ring-2 ring-danger/40 animate-shake";
                badgeStyle = "bg-danger text-white ring-0";
                icon = <XCircle className="size-4" />;
              } else {
                style = "bg-surface/50 text-h-muted ring-1 ring-h-border opacity-60";
              }
            } else if (selected === i) {
              style = "bg-lemon/15 text-h-foreground ring-2 ring-lemon/70";
              badgeStyle = "bg-lemon text-h-background ring-0";
            }

            return (
              <button
                key={i}
                type="button"
                disabled={!!feedback}
                onClick={() => setSelected(i)}
                className={`animate-option-in flex w-full max-w-full items-center gap-3 rounded-2xl p-4 text-left text-base font-semibold transition-[background,ring-color] ${style}`}
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${badgeStyle}`}
                >
                  {icon}
                </span>
                <span className="min-w-0 flex-1 break-words">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="shrink-0 overflow-x-hidden border-t border-h-border/60 bg-h-background/80 pb-24 pt-3 backdrop-blur-sm">
        {feedback ? (
          <div
            className={`animate-slide-up rounded-2xl px-1 pt-1 ring-1 ${
              feedback.correct
                ? "bg-prosperity/15 ring-prosperity/25"
                : "bg-danger/10 ring-danger/25"
            }`}
          >
            <p
              className={`flex items-center gap-2 px-3 pt-3 font-display text-xl font-bold ${
                feedback.correct ? "text-prosperity" : "text-danger"
              }`}
            >
              {feedback.correct ? (
                <>
                  <Sparkles className="size-6 animate-celebrate" />
                  {t.challenge.correct} +2 XP
                </>
              ) : (
                <>
                  <HeartCrack className="size-6" />
                  {t.challenge.incorrect}
                </>
              )}
            </p>
            {!feedback.correct && (
              <p className="mt-2 px-3 text-sm font-semibold text-h-foreground">
                {t.challenge.correctAnswerWas}{" "}
                <span className="text-prosperity">
                  {question.options[feedback.correctIndex]}
                </span>
              </p>
            )}
            <p className="mt-3 flex items-start gap-2 px-3 text-sm leading-relaxed text-h-muted">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-lemon" />
              {feedback.explanation}
            </p>
            <button
              type="button"
              onClick={handleNext}
              className={`btn-chunky mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-base font-bold text-h-background ${
                feedback.correct ? "bg-prosperity" : "bg-danger"
              }`}
            >
              {awaitingRefill
                ? t.challenge.seeOptions
                : summary || currentIndex + 1 >= questions.length
                  ? t.challenge.finish
                  : t.challenge.nextQuestion}
              <ArrowRight className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCheck}
            disabled={selected === null || submitting}
            className="btn-chunky w-full rounded-2xl bg-lemon py-4 font-display text-lg font-bold text-h-background disabled:opacity-30"
          >
            {t.challenge.check}
          </button>
        )}
        </div>
      </main>
      <BottomNav variant="perfil" />
    </ChallengeShell>
  );
}

function ChallengeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-perfil flex min-h-dvh flex-col overflow-x-hidden">{children}</div>
  );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-28 text-center safe-top">
      {children}
    </main>
  );
}

function IntroScreen({
  title,
  subtitle,
  dailyLabel,
  cta,
  onStart,
}: {
  title: string;
  subtitle: string;
  dailyLabel: string;
  cta: string;
  onStart: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 pb-28 safe-top">
      <div className="relative w-full max-w-sm">
        <div className="pointer-events-none absolute -left-8 top-0 size-32 rounded-full bg-prosperity/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 bottom-20 size-32 rounded-full bg-lemon/15 blur-3xl" />

        <section
          className="relative animate-card-pop overflow-hidden rounded-[2rem] bg-surface p-8 text-center ring-1 ring-h-border card-depth"
          style={{ animationDelay: "0ms" }}
        >
          <div className="mx-auto mb-6 grid size-24 animate-float place-items-center rounded-full bg-prosperity/20 ring-4 ring-prosperity/30">
            <Zap className="size-12 text-prosperity" />
          </div>
          <span className="inline-block rounded-full bg-lemon/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-lemon">
            {dailyLabel}
          </span>
          <h1
            className="mt-4 font-display text-3xl font-bold leading-tight text-h-foreground animate-card-pop"
            style={{ animationDelay: "120ms" }}
          >
            {title}
          </h1>
          <p
            className="mt-2 text-sm font-medium text-h-muted animate-card-pop"
            style={{ animationDelay: "200ms" }}
          >
            {subtitle}
          </p>

          <div
            className="mt-8 flex justify-center gap-4 animate-card-pop"
            style={{ animationDelay: "280ms" }}
          >
            {[Sparkles, Star, Flame].map((Icon, i) => (
              <div
                key={i}
                className="grid size-12 place-items-center rounded-2xl bg-h-background ring-1 ring-h-border"
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <Icon
                  className={`size-5 ${
                    i === 0
                      ? "text-lemon"
                      : i === 1
                        ? "fill-lemon text-lemon"
                        : "animate-flame fill-flame text-flame"
                  }`}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="btn-chunky mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-lemon py-4 font-display text-lg font-bold text-h-background animate-card-pop"
            style={{ animationDelay: "400ms" }}
          >
            <Zap className="size-5" />
            {cta}
            <ArrowRight className="size-4" />
          </button>
        </section>
      </div>
    </main>
  );
}

function SummaryScreen({
  headline,
  sub,
  outOfLives,
  perfect,
  xp,
  correct,
  streak,
  durationMs,
  xpLabel,
  correctLabel,
  streakLabel,
  timeLabel,
  rankingLabel,
  homeLabel,
  progressLabel,
}: {
  headline: string;
  sub: string;
  outOfLives: boolean;
  perfect: boolean;
  xp: number;
  correct: string;
  streak: number;
  durationMs: number | null;
  xpLabel: string;
  correctLabel: string;
  streakLabel: string;
  timeLabel: string;
  rankingLabel: string;
  homeLabel: string;
  progressLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex flex-1 flex-col items-center justify-center text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-48 animate-pulse rounded-full bg-prosperity/10 blur-3xl" />
        </div>

        <div
          className={`relative mb-6 grid size-24 animate-celebrate place-items-center rounded-full ${
            outOfLives
              ? "bg-danger/20 ring-4 ring-danger/30"
              : perfect
                ? "bg-lemon/20 ring-4 ring-lemon/40"
                : "bg-prosperity/20 ring-4 ring-prosperity/30"
          }`}
        >
          {outOfLives ? (
            <HeartCrack className="size-12 text-danger" />
          ) : perfect ? (
            <Trophy className="size-12 text-lemon" />
          ) : (
            <PartyPopper className="size-12 text-prosperity" />
          )}
        </div>

        <h2
          className="animate-card-pop font-display text-3xl font-bold text-h-foreground"
          style={{ animationDelay: "100ms" }}
        >
          {headline}
        </h2>
        <p
          className="mt-2 max-w-xs animate-card-pop text-sm font-medium text-h-muted"
          style={{ animationDelay: "180ms" }}
        >
          {sub}
        </p>

        <div
          className="mt-8 grid w-full grid-cols-2 gap-3 animate-card-pop"
          style={{ animationDelay: "260ms" }}
        >
          <StatCard
            icon={<Zap className="size-4 text-lemon" />}
            value={`+${xp}`}
            label={xpLabel}
            valueClass="text-lemon"
          />
          <StatCard
            icon={<CheckCircle2 className="size-4 text-prosperity" />}
            value={correct}
            label={correctLabel}
            valueClass="text-h-foreground"
          />
          <StatCard
            icon={<Flame className="size-4 animate-flame fill-flame text-flame" />}
            value={`${streak}`}
            label={streakLabel}
            valueClass="text-flame"
          />
          <StatCard
            icon={<Clock className="size-4 text-prosperity" />}
            value={formatDurationMs(durationMs ?? 0)}
            label={timeLabel}
            valueClass="text-prosperity"
          />
        </div>
      </section>

      <div
        className="flex flex-col gap-3 animate-card-pop"
        style={{ animationDelay: "340ms" }}
      >
        <Link
          href="/progress"
          className="flex items-center justify-center gap-2 rounded-2xl bg-prosperity/15 py-3 font-display text-sm font-semibold text-prosperity ring-1 ring-prosperity/30"
        >
          {progressLabel}
        </Link>
        <Link
          href="/leaderboard"
          className="btn-chunky flex items-center justify-center gap-2 rounded-2xl bg-lemon py-4 font-display text-base font-bold text-h-background"
        >
          <Trophy className="size-5" />
          {rankingLabel}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/home"
          className="flex items-center justify-center rounded-2xl bg-surface py-4 font-display text-base font-semibold text-h-foreground ring-1 ring-h-border transition-transform active:scale-[0.98]"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}

function RefillScreen({
  title,
  body,
  livesLabel,
  earnedLabel,
  elapsedMs,
  timerPaused,
  timeLabel,
  recoverLabel,
  refillNote,
  tokenPriceLabels,
  tokenBalance,
  balanceLabel,
  recoveryTokens,
  selectedToken,
  onSelectToken,
  refillError,
  refilling,
  refillStep,
  refillStatus,
  canRefill,
  selectTokenLabel,
  payWithTokenLabel,
  processingLabel,
  confirmingLabel,
  confirmingHint,
  lifeRestoredLabel,
  openingWalletLabel,
  waitLabel,
  onRefill,
  onRetryVerify,
  showRetryVerify = false,
  retryVerifyLabel,
  onForfeit,
  submitting,
  selectedWallet,
  onSelectWallet,
  walletLabels,
  hideWalletPicker = false,
  hideTokenPicker = false,
  minipayHint,
}: {
  title: string;
  body: string;
  livesLabel: string;
  earnedLabel: string;
  elapsedMs: number;
  timerPaused: boolean;
  timeLabel: string;
  recoverLabel: string;
  refillNote: string;
  tokenPriceLabels: Record<string, string>;
  tokenBalance: string | null;
  balanceLabel: string;
  recoveryTokens: RecoveryToken[];
  selectedToken: RecoveryToken;
  onSelectToken: (t: RecoveryToken) => void;
  refillError: string | null;
  refilling: boolean;
  refillStep: RefillStep;
  refillStatus: string | null;
  canRefill: boolean;
  selectTokenLabel: string;
  payWithTokenLabel: string;
  processingLabel: string;
  confirmingLabel: string;
  confirmingHint: string;
  lifeRestoredLabel: string;
  openingWalletLabel: string;
  waitLabel: string;
  onRefill: () => void;
  onRetryVerify?: () => void;
  showRetryVerify?: boolean;
  retryVerifyLabel?: string;
  onForfeit: () => void;
  submitting: boolean;
  selectedWallet: WalletProviderId | null;
  onSelectWallet: (id: WalletProviderId) => void;
  walletLabels: { chooseWallet: string; notInstalled: string; install: string };
  hideWalletPicker?: boolean;
  hideTokenPicker?: boolean;
  minipayHint?: string;
}) {
  const isVerifying = refillStep === "verifying" || refillStep === "wallet";
  const isSuccess = refillStep === "success";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className={`animate-pop mb-6 grid size-24 place-items-center rounded-full ring-4 ${
            isSuccess
              ? "bg-prosperity/20 ring-prosperity/40"
              : "bg-danger/15 ring-danger/25"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="size-12 text-prosperity" />
          ) : isVerifying ? (
            <Loader2 className="size-12 animate-spin text-prosperity" />
          ) : (
            <HeartCrack className="size-12 text-danger" />
          )}
        </div>
        <h2 className="animate-card-pop font-display text-2xl font-bold text-h-foreground">
          {isSuccess ? lifeRestoredLabel : title}
        </h2>
        {!isSuccess && (
          <p className="mt-2 font-display text-sm font-bold text-danger">
            ❤️ {livesLabel}
          </p>
        )}
        {!isSuccess && (
          <p className="mt-4 max-w-xs text-sm font-medium text-h-muted">{body}</p>
        )}
        {!isSuccess && (
          <p className="mt-2 text-xs font-semibold text-h-muted/70">
            {earnedLabel}
          </p>
        )}
        {timerPaused && !isSuccess && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-h-muted ring-1 ring-h-border">
            <Clock className="size-3.5 text-h-muted" />⏸ {timeLabel}:{" "}
            <span className="font-mono text-prosperity">
              {formatDurationMs(elapsedMs)}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 animate-card-pop">
        {isVerifying || isSuccess ? (
          <div className="rounded-2xl bg-surface p-6 ring-1 ring-prosperity/30 card-depth-sm text-center">
            <p className="text-sm font-bold text-prosperity">
              {isSuccess
                ? lifeRestoredLabel
                : refillStep === "wallet"
                  ? openingWalletLabel
                  : confirmingLabel}
            </p>
            {!isSuccess && (
              <p className="mt-2 text-xs font-medium leading-relaxed text-h-muted">
                {refillStep === "verifying"
                  ? confirmingHint
                  : confirmingHint}
              </p>
            )}
            {refillStatus && (
              <p className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-semibold text-h-foreground">
                {!isSuccess && (
                  <Loader2 className="size-3.5 animate-spin text-prosperity" />
                )}
                {refillStatus}
              </p>
            )}
          </div>
        ) : (
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-prosperity/30 card-depth-sm">
          <p className="text-center text-sm font-bold text-prosperity">
            ⚡ {recoverLabel}
          </p>
          <p className="mt-1 text-center text-xs text-h-muted">{refillNote}</p>
          {minipayHint ? (
            <p className="mt-2 text-center text-[11px] font-semibold leading-snug text-lemon">
              {minipayHint}
            </p>
          ) : null}
          {tokenBalance && (
            <p className="mt-2 text-center text-xs font-semibold text-h-foreground">
              {balanceLabel}:{" "}
              <span className="font-mono text-prosperity">{tokenBalance}</span>
            </p>
          )}

          {recoveryTokens.length > 0 && !hideTokenPicker && recoveryTokens.length > 1 && (
            <div className="mt-3">
              <label className="mb-1.5 block text-center text-[10px] font-bold uppercase tracking-wide text-h-muted">
                {selectTokenLabel}
              </label>
              <select
                value={selectedToken}
                onChange={(e) => onSelectToken(e.target.value as RecoveryToken)}
                disabled={refilling}
                className="w-full rounded-xl bg-h-background px-4 py-3 font-display text-sm font-bold text-h-foreground ring-1 ring-h-border outline-none focus:ring-prosperity/50 disabled:opacity-50"
              >
                {recoveryTokens.map((tok) => (
                  <option key={tok} value={tok}>
                    {tokenPriceLabels[tok]
                      ? `${payWithTokenLabel.replace("{token}", tok)} (${tokenPriceLabels[tok]})`
                      : payWithTokenLabel.replace("{token}", tok)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {refillError && !isVerifying && !isSuccess && (
            <p className="animate-shake mt-2 text-center text-xs font-bold text-danger">
              {refillError}
            </p>
          )}

          {showRetryVerify && onRetryVerify && retryVerifyLabel && !isSuccess && (
            <button
              type="button"
              onClick={onRetryVerify}
              disabled={refilling}
              className="btn-chunky mt-3 w-full rounded-2xl bg-lemon/90 py-3 font-display text-sm font-bold text-h-background disabled:opacity-50"
            >
              ↻ {retryVerifyLabel}
            </button>
          )}

          <div className="mt-4">
            {!hideWalletPicker && (
              <WalletPicker
                selected={selectedWallet}
                onSelect={onSelectWallet}
                disabled={refilling}
                hideMiniPay
                labels={walletLabels}
              />
            )}
          </div>

          <button
            type="button"
            onClick={onRefill}
            disabled={refilling || !canRefill || (!hideWalletPicker && !selectedWallet)}
            className="btn-chunky mt-4 w-full rounded-2xl bg-prosperity py-4 font-display text-base font-bold text-h-background disabled:opacity-50"
          >
            {refilling
              ? processingLabel
              : `💰 ${payWithTokenLabel.replace("{token}", selectedToken)}`}
          </button>
        </div>
        )}

        <button
          type="button"
          onClick={onForfeit}
          disabled={submitting || refilling}
          className="rounded-2xl bg-surface py-4 font-display text-sm font-semibold text-h-muted ring-1 ring-h-border transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          ⏳ {waitLabel}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  valueClass,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  valueClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface p-4 ring-1 ring-h-border card-depth-sm">
      {icon}
      <span className={`font-display text-lg font-bold leading-none ${valueClass}`}>
        {value}
      </span>
      <span className="text-center text-[10px] font-semibold uppercase tracking-tight text-h-muted">
        {label}
      </span>
    </div>
  );
}
