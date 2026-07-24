"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useFlashcards,
  useAddFlashcard,
  useUpdateFlashcard,
  useDeleteFlashcard,
  useRecordFlashcardReview,
} from "@/hooks/use-flashcards";
import { Flashcard, ReviewRating } from "@/lib/schemas/flashcard.schema";
import { useAuthGuard } from "@/components/auth-guard";
import { motion, AnimatePresence } from "framer-motion";
import { format, isBefore, startOfToday } from "date-fns";
import {
  Layers,
  Plus,
  RotateCw,
  CheckCircle2,
  Brain,
  Sparkles,
  Search,
  Check,
  Edit2,
  Trash2,
  X,
  Shuffle,
  Volume2,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  Play,
} from "lucide-react";

export default function FlashcardsPage() {
  const { data: cards = [], isLoading } = useFlashcards();
  const addMutation = useAddFlashcard();
  const updateMutation = useUpdateFlashcard();
  const deleteMutation = useDeleteFlashcard();
  const reviewMutation = useRecordFlashcardReview();
  const { requireAuth } = useAuthGuard();

  // Filters & State
  const [selectedDeck, setSelectedDeck] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "due" | "mastered">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Study session mode
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deckInput, setDeckInput] = useState("General");
  const [frontInput, setFrontInput] = useState("");
  const [backInput, setBackInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Unique deck list
  const availableDecks = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => set.add(c.deck || "General"));
    return Array.from(set);
  }, [cards]);

  // Filtered card list
  const filteredCards = useMemo(() => {
    const today = startOfToday();
    return cards.filter((card) => {
      // Deck filter
      if (selectedDeck !== "all" && card.deck !== selectedDeck) {
        return false;
      }
      // Status filter
      if (statusFilter === "due") {
        if (card.mastered) return false;
        if (!card.nextReviewDate) return true;
        const reviewDate = card.nextReviewDate.toDate ? card.nextReviewDate.toDate() : new Date(card.nextReviewDate);
        if (!isBefore(reviewDate, today) && reviewDate.toDateString() !== today.toDateString()) {
          return false;
        }
      } else if (statusFilter === "mastered") {
        if (!card.mastered) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFront = card.front.toLowerCase().includes(q);
        const matchBack = card.back.toLowerCase().includes(q);
        const matchDeck = card.deck.toLowerCase().includes(q);
        const matchTags = card.tags?.some((t) => t.toLowerCase().includes(q));
        return matchFront || matchBack || matchDeck || matchTags;
      }
      return true;
    });
  }, [cards, selectedDeck, statusFilter, searchQuery]);

  // Due cards count
  const dueCardsCount = useMemo(() => {
    const today = startOfToday();
    return cards.filter((card) => {
      if (card.mastered) return false;
      if (!card.nextReviewDate) return true;
      const reviewDate = card.nextReviewDate.toDate ? card.nextReviewDate.toDate() : new Date(card.nextReviewDate);
      return isBefore(reviewDate, today) || reviewDate.toDateString() === today.toDateString();
    }).length;
  }, [cards]);

  const masteredCount = useMemo(() => {
    return cards.filter((c) => c.mastered).length;
  }, [cards]);

  // Start study session
  const startStudySession = (deckName: string = selectedDeck) => {
    const today = startOfToday();
    let candidates = cards.filter((c) => {
      if (deckName !== "all" && c.deck !== deckName) return false;
      if (c.mastered) return false;
      if (!c.nextReviewDate) return true;
      const reviewDate = c.nextReviewDate.toDate ? c.nextReviewDate.toDate() : new Date(c.nextReviewDate);
      return isBefore(reviewDate, today) || reviewDate.toDateString() === today.toDateString();
    });

    // If no due cards, study all cards in selected deck
    if (candidates.length === 0) {
      candidates = cards.filter((c) => (deckName === "all" ? true : c.deck === deckName));
    }

    if (candidates.length === 0) return;

    // Shuffle study set
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setIsStudyMode(true);
  };

  // Keyboard shortcut listener for Study Mode
  useEffect(() => {
    if (!isStudyMode || sessionCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleRateCard("again");
        if (e.key === "2") handleRateCard("hard");
        if (e.key === "3") handleRateCard("good");
        if (e.key === "4") handleRateCard("easy");
        if (e.key === "5") handleRateCard("mastered");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStudyMode, isFlipped, sessionCompleted, currentCardIndex, studyCards]);

  const handleRateCard = (rating: ReviewRating) => {
    const activeCard = studyCards[currentCardIndex];
    if (!activeCard) return;

    requireAuth(() => {
      reviewMutation.mutate({ card: activeCard, rating });
      setIsFlipped(false);

      if (currentCardIndex + 1 < studyCards.length) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    });
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontInput.trim() || !backInput.trim()) return;

    const tagsArr = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    requireAuth(() => {
      if (editingCard) {
        updateMutation.mutate(
          {
            cardId: editingCard.id,
            data: {
              deck: deckInput.trim() || "General",
              front: frontInput.trim(),
              back: backInput.trim(),
              tags: tagsArr,
            },
          },
          {
            onSuccess: () => {
              closeModal();
            },
          }
        );
      } else {
        addMutation.mutate(
          {
            deck: deckInput.trim() || "General",
            front: frontInput.trim(),
            back: backInput.trim(),
            tags: tagsArr,
          },
          {
            onSuccess: () => {
              closeModal();
            },
          }
        );
      }
    });
  };

  const openAddModal = () => {
    setEditingCard(null);
    setDeckInput(selectedDeck === "all" ? "General" : selectedDeck);
    setFrontInput("");
    setBackInput("");
    setTagsInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (card: Flashcard) => {
    setEditingCard(card);
    setDeckInput(card.deck || "General");
    setFrontInput(card.front);
    setBackInput(card.back);
    setTagsInput(card.tags?.join(", ") || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    requireAuth(() => {
      deleteMutation.mutate(cardId, {
        onSuccess: () => {
          setDeletingId(null);
        },
      });
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            <span>Spaced Repetition Flashcards</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Flashcard Decks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, organize, and practice concept cards with smart review intervals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => startStudySession("all")}
            disabled={cards.length === 0}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current" />
            Study Due Cards ({dueCardsCount})
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary active:scale-95"
          >
            <Plus className="h-4 w-4 text-primary" />
            New Flashcard
          </button>
        </div>
      </div>

      {/* ── Overview Statistics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Cards
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{cards.length}</span>
            <BookOpen className="h-5 w-5 text-primary/60" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Due Today
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-500">{dueCardsCount}</span>
            <RotateCw className="h-5 w-5 text-amber-500/60" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Mastered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-500">{masteredCount}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500/60" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Decks
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{availableDecks.length}</span>
            <Layers className="h-5 w-5 text-primary/60" />
          </div>
        </div>
      </div>

      {/* ── Toolbar: Decks & Filters ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/50 p-4 rounded-2xl border border-border/60">
        {/* Decks filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedDeck("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedDeck === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Decks ({cards.length})
          </button>

          {availableDecks.map((deck) => {
            const deckCardCount = cards.filter((c) => c.deck === deck).length;
            return (
              <button
                key={deck}
                onClick={() => setSelectedDeck(deck)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedDeck === deck
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {deck} ({deckCardCount})
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-xl border border-border bg-background p-0.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                statusFilter === "all" ? "bg-secondary text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("due")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                statusFilter === "due" ? "bg-secondary text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              Due
            </button>
            <button
              onClick={() => setStatusFilter("mastered")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                statusFilter === "mastered" ? "bg-secondary text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              Mastered
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Cards Grid ── */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RotateCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading your flashcards...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border/80 rounded-3xl bg-card/30 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-foreground">No flashcards found</h3>
            <p className="text-xs text-muted-foreground">
              {cards.length === 0
                ? "You haven't created any flashcards yet. Add your first card to start practicing!"
                : "No flashcards match your current deck or status filter."}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Create Flashcard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="group relative rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    <Layers className="h-3 w-3" />
                    {card.deck}
                  </span>

                  {card.mastered ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Mastered
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Interval: {card.intervalDays || 1}d
                    </span>
                  )}
                </div>

                {/* Front (Question) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Front / Prompt
                  </span>
                  <h4 className="font-semibold text-foreground text-sm line-clamp-3 leading-snug">
                    {card.front}
                  </h4>
                </div>

                {/* Back (Answer Preview) */}
                <div className="space-y-1 border-t border-border/50 pt-2.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Back / Answer
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {card.back}
                  </p>
                </div>
              </div>

              {/* Tags & Action Buttons */}
              <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
                <div className="flex flex-wrap gap-1">
                  {card.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(card)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition"
                    title="Edit Card"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(card.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    title="Delete Card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Interactive 3D Study Session Modal ── */}
      <AnimatePresence>
        {isStudyMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6">
              {/* Session Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-bold text-sm text-foreground">
                    Study Session — Card {currentCardIndex + 1} of {studyCards.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsStudyMode(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${((currentCardIndex + (sessionCompleted ? 1 : 0)) / studyCards.length) * 100}%`,
                  }}
                />
              </div>

              {!sessionCompleted && studyCards[currentCardIndex] ? (
                <>
                  {/* 3D Flip Card Container */}
                  <div
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className="relative w-full min-h-[260px] sm:min-h-[320px] cursor-pointer perspective-1000 group"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="w-full h-full min-h-[260px] sm:min-h-[320px] rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 p-6 sm:p-8 flex flex-col justify-between shadow-xl transform-style-3d relative overflow-hidden"
                    >
                      {/* Front Side */}
                      <div
                        className={`space-y-4 flex flex-col justify-between h-full ${
                          isFlipped ? "opacity-0 pointer-events-none hidden" : "opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                            {studyCards[currentCardIndex].deck}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            Click or Press Space to Flip
                          </span>
                        </div>

                        <div className="my-auto space-y-2 py-4">
                          <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                            Question / Concept
                          </span>
                          <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed">
                            {studyCards[currentCardIndex].front}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                          <span>Review count: {studyCards[currentCardIndex].reviewCount || 0}</span>
                          <span className="text-primary font-semibold">Reveal Answer ➔</span>
                        </div>
                      </div>

                      {/* Back Side (Answer) */}
                      <div
                        className={`space-y-4 flex flex-col justify-between h-full rotate-y-180 ${
                          isFlipped ? "opacity-100" : "opacity-0 pointer-events-none hidden"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-500">
                            Answer
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            Rate your recall below
                          </span>
                        </div>

                        <div className="my-auto space-y-2 py-4">
                          <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                            Explanation / Answer
                          </span>
                          <div className="text-base sm:text-lg text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                            {studyCards[currentCardIndex].back}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                          <span>Select rating to continue</span>
                          <span className="text-muted-foreground">Keys 1-5</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Rating Actions (Visible when card is flipped) */}
                  {isFlipped ? (
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      <button
                        onClick={() => handleRateCard("again")}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition font-bold text-xs gap-1"
                      >
                        <span>Again</span>
                        <span className="text-[10px] opacity-75">(1d)</span>
                      </button>
                      <button
                        onClick={() => handleRateCard("hard")}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition font-bold text-xs gap-1"
                      >
                        <span>Hard</span>
                        <span className="text-[10px] opacity-75">(2d)</span>
                      </button>
                      <button
                        onClick={() => handleRateCard("good")}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition font-bold text-xs gap-1"
                      >
                        <span>Good</span>
                        <span className="text-[10px] opacity-75">(4d)</span>
                      </button>
                      <button
                        onClick={() => handleRateCard("easy")}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition font-bold text-xs gap-1"
                      >
                        <span>Easy</span>
                        <span className="text-[10px] opacity-75">(7d)</span>
                      </button>
                      <button
                        onClick={() => handleRateCard("mastered")}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500 hover:text-white transition font-bold text-xs gap-1"
                      >
                        <span>Master</span>
                        <span className="text-[10px] opacity-75">🏆</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-xs text-muted-foreground">
                      Click card or press <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary font-mono text-[10px]">Space</kbd> to reveal answer
                    </div>
                  )}
                </>
              ) : (
                /* Session Complete Screen */
                <div className="py-12 text-center space-y-5">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <Award className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">Session Complete! 🎉</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Great job! You reviewed {studyCards.length} flashcard{studyCards.length > 1 ? "s" : ""}. Keep up the streak to lock memories long-term.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsStudyMode(false)}
                    className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:scale-105"
                  >
                    Back to Decks
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Flashcard Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg text-foreground">
                    {editingCard ? "Edit Flashcard" : "Create New Flashcard"}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Deck Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JavaScript, DSA, System Design"
                    value={deckInput}
                    onChange={(e) => setDeckInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Front Side (Question / Concept)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter the question or concept..."
                    value={frontInput}
                    onChange={(e) => setFrontInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Back Side (Answer / Explanation)
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter the detailed answer or code snippet..."
                    value={backInput}
                    onChange={(e) => setBackInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. react, hooks, performance"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:scale-105 transition"
                  >
                    {editingCard ? "Update Card" : "Save Flashcard"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-lg text-foreground">Delete Flashcard?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete this flashcard? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCard(deletingId)}
                  className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-md hover:bg-destructive/90"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
