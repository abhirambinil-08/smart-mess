// ============================================================
//  pages/FeedbackPage.jsx  — Premium Multi-Step Feedback Wizard
//  Glassmorphism dark-mode · Animated progress · Rich micro-UX
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { getAllMess, getTodaysQuestions, submitFeedback, uploadImage } from '../utils/api'
import { useAuth } from '../context/AuthContext'

// ── Constants ─────────────────────────────────────────────────
const STAFF_EMOJIS   = ['😡', '😐', '🙂', '😍']
const STAFF_LABELS   = ['Very Rude', 'Unfriendly', 'Polite', 'Very Helpful']
const STAFF_COLORS   = ['#FF5252', '#FFB347', '#00D9A6', '#6C63FF']
const EMOJI_FACES    = ['😍', '🙂', '😐', '😕', '😡', '🤩', '😋', '🤢', '😴', '🔥']
// Each slot has a start/end in 24-h minutes for easy comparison
const SLOT_INFO = [
  { label: 'Breakfast', time: '7:00 – 11:00 AM', icon: '🌅', value: 'Breakfast', startH: 7,  endH: 11 },
  { label: 'Lunch',     time: '1:00 – 3:00 PM',  icon: '☀️', value: 'Lunch',     startH: 13, endH: 15 },
  { label: 'Dinner',    time: '7:00 – 10:00 PM', icon: '🌙', value: 'Dinner',    startH: 19, endH: 22 },
]

// Returns true if the given slot is open right now
function isSlotOpen(slot) {
  const h = new Date().getHours()
  return h >= slot.startH && h < slot.endH
}

// Returns the currently active slot label, or null if between meals
function getCurrentSlot() {
  return SLOT_INFO.find(isSlotOpen) || null
}
const CAMERA_CATEGORIES = ['hygiene', 'food_quality', 'taste', 'portion', 'general']

// ── Inject scoped styles ──────────────────────────────────────
const FP_STYLES = `
  @keyframes fp-float   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-8px)} }
  @keyframes fp-fadein  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fp-slidein { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fp-bounce  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
  @keyframes fp-ping    { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }
  @keyframes fp-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes fp-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(108,99,255,0.4)} 70%{box-shadow:0 0 0 10px rgba(108,99,255,0)} }
  @keyframes fp-spin    { to{transform:rotate(360deg)} }

  .fp-page {
    min-height: 100vh;
    background: var(--bg-deep);
    padding: 0 0 60px;
    position: relative;
    overflow: hidden;
  }
  .fp-bg-orb {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(80px);
    opacity: 0.35;
  }

  /* ── Progress bar ── */
  .fp-progress-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(10,14,26,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(108,99,255,0.12);
    padding: 14px 20px;
  }
  .fp-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    max-width: 540px;
    margin: 0 auto;
  }
  .fp-step-dot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
    position: relative;
    cursor: pointer;
  }
  .fp-step-dot::after {
    content: '';
    position: absolute;
    top: 18px;
    left: 50%;
    width: 100%;
    height: 2px;
    background: rgba(108,99,255,0.15);
    z-index: -1;
  }
  .fp-step-dot:last-child::after { display: none; }
  .fp-step-dot--done::after  { background: linear-gradient(90deg, #6C63FF, #00D9A6); }
  .fp-step-dot--active::after { background: rgba(108,99,255,0.15); }
  .fp-step-circle {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700;
    border: 2px solid rgba(108,99,255,0.2);
    background: rgba(15,22,50,0.7);
    color: var(--text-muted);
    transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
    position: relative;
  }
  .fp-step-dot--done .fp-step-circle {
    background: linear-gradient(135deg, #6C63FF, #00D9A6);
    border-color: transparent;
    color: white;
    box-shadow: 0 0 20px rgba(108,99,255,0.4);
  }
  .fp-step-dot--active .fp-step-circle {
    border-color: #6C63FF;
    background: rgba(108,99,255,0.15);
    color: #6C63FF;
    animation: fp-pulse 2s infinite;
  }
  .fp-step-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .fp-step-dot--done .fp-step-label,
  .fp-step-dot--active .fp-step-label { color: var(--primary); }

  /* ── Hero header ── */
  .fp-hero {
    text-align: center;
    padding: 36px 20px 0;
    animation: fp-fadein 0.6s ease forwards;
    position: relative; z-index: 1;
  }
  .fp-hero-icon {
    font-size: 60px;
    animation: fp-float 3.5s ease-in-out infinite;
    display: block; margin: 0 auto 12px;
    line-height: 1;
  }
  .fp-hero-title {
    font-size: 28px;
    font-weight: 900;
    background: linear-gradient(135deg, #6C63FF 0%, #00D9A6 60%, #FF6B9D 100%);
    background-size: 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fp-shimmer 4s linear infinite;
    margin-bottom: 6px;
  }
  .fp-hero-sub {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 20px;
  }

  /* ── Meal slot pills ── */
  .fp-meal-slots {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .fp-slot-pill {
    display: flex; align-items: center; gap: 6px;
    background: rgba(108,99,255,0.08);
    border: 1px solid rgba(108,99,255,0.15);
    border-radius: 99px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    transition: all 0.2s;
    cursor: pointer;
  }
  .fp-slot-pill:hover,
  .fp-slot-pill--active {
    background: rgba(108,99,255,0.18);
    border-color: rgba(108,99,255,0.5);
    color: var(--text-primary);
    box-shadow: 0 0 16px rgba(108,99,255,0.2);
  }
  .fp-slot-pill--active {
    background: linear-gradient(135deg, rgba(108,99,255,0.25), rgba(0,217,166,0.15));
    border-color: #6C63FF;
  }

  /* ── Main container ── */
  .fp-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 16px;
    position: relative; z-index: 1;
  }

  /* ── Step card ── */
  .fp-card {
    background: rgba(15,22,50,0.55);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(108,99,255,0.15);
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(108,99,255,0.06);
    animation: fp-fadein 0.45s ease forwards;
    position: relative;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .fp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(108,99,255,0.5), rgba(0,217,166,0.3), transparent);
  }

  /* ── Section header ── */
  .fp-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .fp-section-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    background: rgba(108,99,255,0.15);
    border: 1px solid rgba(108,99,255,0.2);
    flex-shrink: 0;
  }
  .fp-section-title {
    font-size: 15px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: 0.2px;
  }
  .fp-section-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 1px;
  }

  /* ── Select grid (mess/meal) ── */
  .fp-select-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* ── Question card ── */
  .fp-q-card {
    background: rgba(108,99,255,0.04);
    border: 2px solid transparent;
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 14px;
    transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
    animation: fp-fadein 0.4s ease forwards;
  }
  .fp-q-card--answered {
    border-color: rgba(0,217,166,0.4);
    background: rgba(0,217,166,0.04);
    box-shadow: 0 0 20px rgba(0,217,166,0.08);
  }
  .fp-q-num {
    font-size: 11px;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .fp-q-text {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .fp-menu-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,179,71,0.1);
    border: 1px solid rgba(255,179,71,0.2);
    border-radius: 99px;
    padding: 3px 10px;
    font-size: 12px;
    color: var(--warning);
    font-weight: 600;
    margin-bottom: 12px;
  }

  /* ── Emoji option buttons ── */
  .fp-emoji-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fp-emoji-opt {
    display: flex; flex-direction: column; align-items: center;
    gap: 4px;
    background: rgba(108,99,255,0.06);
    border: 2px solid rgba(108,99,255,0.12);
    border-radius: 12px;
    padding: 10px 14px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    min-width: 64px;
    font-family: inherit;
  }
  .fp-emoji-opt:hover {
    transform: scale(1.1) translateY(-2px);
    border-color: rgba(108,99,255,0.5);
    background: rgba(108,99,255,0.12);
    box-shadow: 0 4px 20px rgba(108,99,255,0.2);
  }
  .fp-emoji-opt--selected {
    border-color: #6C63FF;
    background: rgba(108,99,255,0.2);
    transform: scale(1.12) translateY(-2px);
    box-shadow: 0 4px 24px rgba(108,99,255,0.35);
  }
  .fp-emoji-opt__face { font-size: 30px; line-height: 1; }
  .fp-emoji-opt__label {
    font-size: 10px; font-weight: 700;
    color: var(--text-muted);
    text-align: center; line-height: 1.2;
    max-width: 56px;
  }
  .fp-emoji-opt--selected .fp-emoji-opt__label { color: var(--primary); }

  /* ── Multi-select tags ── */
  .fp-multi-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
  .fp-multi-tag {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    background: rgba(15,22,50,0.7);
    border: 1.5px solid rgba(108,99,255,0.15);
    border-radius: 99px;
    font-size: 13px; font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .fp-multi-tag:hover {
    border-color: rgba(108,99,255,0.4);
    color: var(--text-primary);
    background: rgba(108,99,255,0.1);
  }
  .fp-multi-tag--selected {
    background: rgba(108,99,255,0.18);
    border-color: #6C63FF;
    color: var(--primary);
    box-shadow: 0 0 14px rgba(108,99,255,0.2);
  }

  /* ── Slider ── */
  .fp-slider-wrap { position: relative; }
  .fp-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 6px;
    border-radius: 99px;
    background: rgba(108,99,255,0.15);
    outline: none;
    cursor: pointer;
    margin: 8px 0;
  }
  .fp-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6C63FF, #00D9A6);
    cursor: pointer;
    box-shadow: 0 0 12px rgba(108,99,255,0.5);
    transition: transform 0.15s;
  }
  .fp-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
  .fp-slider-labels {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 2px;
  }
  .fp-slider-val {
    font-size: 22px; font-weight: 900;
    background: linear-gradient(135deg, #6C63FF, #00D9A6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Camera component ── */
  .fp-cam-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed rgba(108,99,255,0.2);
  }
  .fp-cam-hint {
    font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 8px;
    display: flex; align-items: center; gap: 5px;
  }
  .fp-cam-hint span { color: var(--secondary); }
  .fp-cam-btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .fp-cam-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px;
    font-size: 12px; font-weight: 700;
    cursor: pointer; border: none;
    font-family: inherit;
    transition: all 0.2s;
  }
  .fp-cam-btn--primary {
    background: linear-gradient(135deg, #6C63FF, #8B7CF7);
    color: white; box-shadow: 0 3px 12px rgba(108,99,255,0.35);
  }
  .fp-cam-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(108,99,255,0.45); }
  .fp-cam-btn--ghost {
    background: rgba(108,99,255,0.08);
    border: 1.5px solid rgba(108,99,255,0.25);
    color: var(--primary);
  }
  .fp-cam-btn--ghost:hover { background: rgba(108,99,255,0.15); }

  .fp-video-wrap {
    border-radius: 14px; overflow: hidden;
    background: #000; position: relative; margin-top: 10px;
  }
  .fp-capture-overlay {
    position: absolute; bottom: 12px; left: 0; right: 0;
    display: flex; justify-content: center; align-items: center; gap: 12px;
  }
  .fp-shutter {
    width: 60px; height: 60px; border-radius: 50%;
    background: rgba(15,22,50,0.6);
    border: 4px solid #00D9A6;
    font-size: 24px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(0,217,166,0.4);
    transition: transform 0.15s;
  }
  .fp-shutter:hover { transform: scale(1.1); }
  .fp-photo-preview {
    position: relative; display: inline-block; margin-top: 10px;
  }
  .fp-photo-preview img {
    max-height: 120px; border-radius: 12px; max-width: 100%;
    border: 2px solid rgba(0,217,166,0.5);
    box-shadow: 0 4px 20px rgba(0,217,166,0.2);
  }
  .fp-photo-remove {
    position: absolute; top: -8px; right: -8px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--danger); color: white;
    border: none; font-size: 11px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-family: inherit;
  }
  .fp-photo-boost {
    font-size: 11px; color: var(--secondary);
    margin-top: 4px; font-weight: 600;
  }

  /* ── Staff rating ── */
  .fp-staff-grid { display: flex; gap: 12px; flex-wrap: wrap; }
  .fp-staff-btn {
    flex: 1; min-width: 90px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 10px;
    background: rgba(108,99,255,0.05);
    border: 2px solid rgba(108,99,255,0.12);
    border-radius: 14px;
    cursor: pointer; font-family: inherit;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .fp-staff-btn:hover { transform: translateY(-3px); }
  .fp-staff-btn--active {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 24px rgba(108,99,255,0.3);
  }
  .fp-staff-face { font-size: 36px; transition: transform 0.2s; }
  .fp-staff-btn:hover .fp-staff-face { transform: scale(1.15); animation: fp-bounce 0.5s ease; }
  .fp-staff-label { font-size: 11px; font-weight: 700; color: var(--text-muted); }
  .fp-staff-btn--active .fp-staff-label { color: var(--text-primary); }

  /* ── Upload drop zone ── */
  .fp-dropzone {
    border: 2px dashed rgba(108,99,255,0.25);
    border-radius: 14px;
    padding: 28px 20px;
    text-align: center;
    cursor: pointer;
    background: rgba(108,99,255,0.04);
    transition: all 0.25s;
  }
  .fp-dropzone:hover {
    border-color: rgba(108,99,255,0.5);
    background: rgba(108,99,255,0.08);
    box-shadow: 0 0 20px rgba(108,99,255,0.1);
  }
  .fp-dropzone__icon { font-size: 36px; margin-bottom: 8px; }
  .fp-dropzone__text { font-size: 13px; color: var(--text-secondary); }
  .fp-dropzone__hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

  /* ── Textarea ── */
  .fp-textarea {
    width: 100%; padding: 14px 16px;
    background: rgba(10,14,26,0.6);
    border: 1.5px solid rgba(108,99,255,0.15);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 14px; font-family: inherit;
    resize: vertical; min-height: 90px;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fp-textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(108,99,255,0.12), 0 0 20px rgba(108,99,255,0.15);
  }
  .fp-textarea::placeholder { color: var(--text-muted); }

  /* ── FeedGuard banner ── */
  .fp-feedguard {
    display: flex; align-items: flex-start; gap: 12px;
    background: rgba(108,99,255,0.07);
    border: 1px solid rgba(108,99,255,0.18);
    border-radius: 14px; padding: 14px 16px;
    margin-bottom: 18px;
  }
  .fp-feedguard__icon { font-size: 22px; flex-shrink: 0; }
  .fp-feedguard__text { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
  .fp-feedguard__text strong { color: var(--primary); }

  /* ── Submit button ── */
  .fp-submit {
    width: 100%;
    padding: 16px;
    border: none; border-radius: 14px;
    background: linear-gradient(135deg, #6C63FF, #00D9A6);
    color: white;
    font-size: 16px; font-weight: 800;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 4px 24px rgba(108,99,255,0.35);
    transition: all 0.25s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    position: relative; overflow: hidden;
  }
  .fp-submit::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
    opacity: 0; transition: opacity 0.25s;
  }
  .fp-submit:hover:not(:disabled)::before { opacity: 1; }
  .fp-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(108,99,255,0.5);
  }
  .fp-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .fp-spinner {
    width: 20px; height: 20px;
    border: 2.5px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: fp-spin 0.7s linear infinite;
  }

  /* ── Success / Flagged screen ── */
  .fp-result {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    background: var(--bg-deep);
    position: relative; overflow: hidden;
  }
  .fp-result-card {
    background: rgba(15,22,50,0.7);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(108,99,255,0.2);
    border-radius: 24px;
    padding: 36px 32px;
    width: 100%; max-width: 440px;
    text-align: center;
    box-shadow: 0 16px 60px rgba(0,0,0,0.4);
    position: relative;
    animation: fp-fadein 0.6s ease forwards;
  }
  .fp-result-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #6C63FF, #00D9A6, #FF6B9D);
    border-radius: 24px 24px 0 0;
  }
  .fp-result-icon { font-size: 72px; margin-bottom: 12px; display: block; animation: fp-float 3s ease-in-out infinite; }
  .fp-result-title { font-size: 24px; font-weight: 900; margin-bottom: 6px; color: var(--text-primary); }
  .fp-result-sub   { font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; }

  .fp-token-box {
    background: linear-gradient(135deg, rgba(108,99,255,0.25), rgba(0,217,166,0.15));
    border: 1px solid rgba(108,99,255,0.3);
    border-radius: 16px; padding: 20px 24px; margin-bottom: 16px;
  }
  .fp-token-amount { font-size: 42px; font-weight: 900; margin-bottom: 4px; }
  .fp-token-total  { font-size: 14px; color: var(--text-secondary); }

  .fp-level-box {
    background: rgba(108,99,255,0.07);
    border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; text-align: left;
  }
  .fp-level-name { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  .fp-level-bar-bg {
    background: rgba(108,99,255,0.15);
    border-radius: 99px; height: 8px; overflow: hidden;
  }
  .fp-level-bar-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, #6C63FF, #00D9A6);
    box-shadow: 0 0 10px rgba(108,99,255,0.4);
    transition: width 1s cubic-bezier(0.4,0,0.2,1);
  }
  .fp-milestone {
    background: rgba(255,179,71,0.08);
    border: 1.5px solid rgba(255,179,71,0.3);
    border-radius: 12px; padding: 12px 14px; margin-bottom: 12px;
  }
  .fp-flagged-box {
    background: rgba(255,82,82,0.07);
    border: 1.5px solid rgba(255,82,82,0.25);
    border-radius: 12px; padding: 14px; margin-bottom: 16px;
    font-size: 13px; color: var(--text-secondary); line-height: 1.5; text-align: left;
  }
  .fp-result-actions { display: flex; gap: 10px; justify-content: center; margin-top: 4px; }

  /* ── Alert ── */
  .fp-alert {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px;
    font-size: 13px; font-weight: 500; margin-bottom: 18px;
    animation: fp-slidein 0.3s ease forwards;
  }
  .fp-alert--error {
    background: rgba(255,82,82,0.1);
    border: 1px solid rgba(255,82,82,0.25);
    color: var(--danger);
  }

  /* ── Nav ── */
  .fp-nav { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
  .fp-btn-next {
    padding: 12px 24px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #6C63FF, #8B7CF7);
    color: white; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 3px 14px rgba(108,99,255,0.35);
    transition: all 0.2s;
  }
  .fp-btn-next:hover { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(108,99,255,0.5); }
  .fp-btn-back {
    padding: 12px 20px; border-radius: 10px;
    background: transparent;
    border: 1.5px solid rgba(108,99,255,0.3);
    color: var(--primary); font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    transition: all 0.2s;
  }
  .fp-btn-back:hover { background: rgba(108,99,255,0.08); }

  /* ── Emoji picker ── */
  .fp-emoji-picker {
    position: absolute; right: 0; top: 44px; z-index: 20;
    background: rgba(10,14,26,0.92); backdrop-filter: blur(12px);
    border: 1px solid rgba(108,99,255,0.2); border-radius: 14px;
    padding: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    display: flex; flex-wrap: wrap; gap: 6px; width: 192px;
  }
  .fp-ep-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; border: none; background: none;
    cursor: pointer; border-radius: 8px;
    transition: all 0.15s;
  }
  .fp-ep-btn:hover { background: rgba(108,99,255,0.15); transform: scale(1.2); }

  /* ── Voice note placeholder ── */
  .fp-voice-note {
    display: flex; align-items: center; gap: 10px;
    background: rgba(15,22,50,0.5);
    border: 1px dashed rgba(108,99,255,0.2);
    border-radius: 10px; padding: 12px 14px;
    font-size: 13px; color: var(--text-muted);
  }

  /* ── Progress fill line ── */
  .fp-progress-line {
    height: 2px; width: 100%;
    background: rgba(108,99,255,0.1);
    border-radius: 99px; margin-top: 10px;
    overflow: hidden;
  }
  .fp-progress-line-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, #6C63FF, #00D9A6);
    box-shadow: 0 0 8px rgba(108,99,255,0.4);
    transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .fp-select-grid { grid-template-columns: 1fr; }
    .fp-card { padding: 20px 16px; }
    .fp-staff-grid { gap: 8px; }
    .fp-staff-btn { min-width: 75px; padding: 10px 6px; }
  }
`

// ── QuestionCamera (per-question photo capture) ───────────────
function QuestionCamera({ questionKey, onCapture, captured }) {
  const videoRef   = useRef()
  const canvasRef  = useRef()
  const streamRef  = useRef(null)
  const fileRef    = useRef()

  const [open, setOpen]         = useState(false)
  const [preview, setPreview]   = useState(captured || null)
  const [hasCamera, setHasCamera] = useState(true)

  async function openCamera() {
    setOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
    } catch { setHasCamera(false) }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setOpen(false)
  }

  function capture() {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], `q-${questionKey}-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const url  = URL.createObjectURL(blob)
      setPreview(url); onCapture(file, url); closeCamera()
    }, 'image/jpeg', 0.85)
  }

  function handleFile(e) {
    const file = e.target.files[0]; if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url); onCapture(file, url)
  }

  function remove() { setPreview(null); onCapture(null, null) }

  return (
    <div className="fp-cam-section">
      <div className="fp-cam-hint">
        📷 Add photo proof <span>(boosts AI authenticity score!)</span>
      </div>

      {!preview && !open && (
        <div className="fp-cam-btns">
          <button type="button" className="fp-cam-btn fp-cam-btn--primary" onClick={openCamera}>
            📷 Open Camera
          </button>
          <button type="button" className="fp-cam-btn fp-cam-btn--ghost" onClick={() => fileRef.current.click()}>
            🖼️ Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {open && (
        <div className="fp-video-wrap">
          {hasCamera ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="fp-capture-overlay">
                <button type="button" className="fp-shutter" onClick={capture} title="Capture">📸</button>
                <button type="button" onClick={closeCamera}
                  style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
                    border: '2px solid white', color: 'white', fontSize: 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                  ✕
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: 'white', padding: 20, textAlign: 'center', fontSize: 13 }}>
              📷 Camera not available — use Upload instead.
              <br />
              <button type="button" onClick={closeCamera}
                style={{ marginTop: 10, color: '#00D9A6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="fp-photo-preview">
          <img src={preview} alt="captured" />
          <button type="button" className="fp-photo-remove" onClick={remove}>✕</button>
          <div className="fp-photo-boost">✅ Photo attached!</div>
        </div>
      )}
    </div>
  )
}

// ── Step indicator ──────────────────────────────────────────────
const STEPS = [
  { label: 'Setup',     icon: '📍' },
  { label: 'Questions', icon: '❓' },
  { label: 'Staff',     icon: '🧑‍🍳' },
  { label: 'Extras',    icon: '📎' },
]

function StepBar({ current }) {
  const pct = ((current) / (STEPS.length - 1)) * 100
  return (
    <div className="fp-progress-bar">
      <div className="fp-steps">
        {STEPS.map((s, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : ''
          return (
            <div key={s.label} className={`fp-step-dot fp-step-dot--${state}`}>
              <div className="fp-step-circle">
                {i < current ? '✓' : s.icon}
              </div>
              <div className="fp-step-label">{s.label}</div>
            </div>
          )
        })}
      </div>
      <div className="fp-progress-line" style={{ marginTop: 10 }}>
        <div className="fp-progress-line-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Main FeedbackPage ─────────────────────────────────────────
export default function FeedbackPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const messIdParam = params.get('mess') || ''
  const messName    = params.get('name') || ''

  useEffect(() => {
    if (!user) navigate(`/student-login${window.location.search}`, { replace: true })
  }, [user, navigate])

  // ── State ─────────────────────────────────────────────────
  const [step, setStep]                   = useState(0)          // wizard step 0-3
  const [messList, setMessList]           = useState([])
  const [questions, setQuestions]         = useState([])
  const [answers, setAnswers]             = useState({})
  const [questionPhotos, setQuestionPhotos] = useState({})
  const [staffRating, setStaffRating]     = useState(null)
  const [staffEmoji, setStaffEmoji]       = useState('😐')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [comment, setComment]             = useState('')
  const [imageFile, setImageFile]         = useState(null)
  const [imagePreview, setImagePreview]   = useState('')
  const [selectedMess, setSelectedMess]   = useState(messIdParam)
  const [mealType, setMealType]           = useState('')
  const [loading, setLoading]             = useState(false)
  const [status, setStatus]              = useState(null)
  const [submitted, setSubmitted]         = useState(false)
  const [reward, setReward]              = useState(null)
  const mainFileRef = useRef()

  useEffect(() => {
    getAllMess().then(d => setMessList(d.mess || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!mealType) return
    getTodaysQuestions(mealType)
      .then(d => { setQuestions(d.questions || []); setAnswers({}); setQuestionPhotos({}) })
      .catch(() => {})
  }, [mealType])

  // ── Handlers ────────────────────────────────────────────────
  function handleMainImageChange(e) {
    const file = e.target.files[0]; if (!file) return
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  function handleQuestionPhoto(qKey, file, url) {
    setQuestionPhotos(prev => ({ ...prev, [qKey]: file ? { file, url } : null }))
  }

  function recordAnswer(q, value, extra = {}) {
    const key = q.id || q.question_text
    setAnswers(prev => ({
      ...prev,
      [key]: {
        question_id:    q.id || '',
        question_text:  q.question_text,
        selected_option: String(value),
        emoji:          extra.emoji || '',
        category:       q.category,
        question_type:  q.question_type || 'single_select',
        multi_values:   extra.multi_values || null,
      },
    }))
  }

  function toggleMulti(q, option, emoji) {
    const key     = q.id || q.question_text
    const current = answers[key]?.multi_values || []
    const updated = current.includes(option) ? current.filter(v => v !== option) : [...current, option]
    recordAnswer(q, updated.join(', '), { emoji, multi_values: updated })
  }

  // ── Step validation & navigation ────────────────────────────
  function canAdvance() {
    if (step === 0) {
      if (!selectedMess || !mealType) return false
      // Enforce time window
      const slot = SLOT_INFO.find(s => s.value === mealType)
      if (slot && !isSlotOpen(slot)) return false
      return true
    }
    if (step === 1) {
      const reqQ = questions.filter(q => !['photo_upload', 'voice_note'].includes(q.question_type || 'single_select'))
      return reqQ.length === 0 || Object.keys(answers).length >= reqQ.length
    }
    if (step === 2) return staffRating !== null
    return true
  }

  function goNext() {
    if (!canAdvance()) {
      let msg
      if (step === 0) {
        if (!selectedMess || !mealType) {
          msg = 'Please select a Mess and Meal type to continue.'
        } else {
          const slot = SLOT_INFO.find(s => s.value === mealType)
          msg = slot
            ? `⏰ ${slot.label} feedback is only available from ${slot.time}. Please come back then!`
            : 'Please select a valid meal type.'
        }
      } else if (step === 1) {
        msg = 'Please answer all questions before proceeding.'
      } else {
        msg = 'Please rate the staff behaviour.'
      }
      setStatus({ type: 'error', msg }); return
    }
    setStatus(null)
    if (step === 3) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true); setStatus(null)
    try {
      let mainImageUrl = ''
      if (imageFile) {
        const imgRes = await uploadImage(imageFile)
        mainImageUrl = imgRes.url || ''
      }

      const updatedAnswers = { ...answers }
      for (const [qKey, photoData] of Object.entries(questionPhotos)) {
        if (photoData?.file) {
          try {
            const imgRes = await uploadImage(photoData.file)
            if (updatedAnswers[qKey]) updatedAnswers[qKey].photo_url = imgRes.url || ''
          } catch { }
        }
      }

      if (!mainImageUrl) {
        const firstPhoto = Object.values(questionPhotos).find(p => p?.file)
        if (firstPhoto) mainImageUrl = Object.values(updatedAnswers).find(a => a.photo_url)?.photo_url || ''
      }

      const payload = {
        mess_id:         selectedMess,
        meal_type:       mealType,
        answers:         Object.values(updatedAnswers),
        staff_behaviour: staffRating + 1,
        image_url:       mainImageUrl,
        comment,
      }

      const res = await submitFeedback(payload)
      setSubmitted(true)
      setReward({
        tokens_earned:   res.tokens_earned,
        total_tokens:    res.total_tokens,
        milestone_reward: res.milestone_reward,
        level_info:      res.level_info,
        flagged:         res.tokens_earned === 0,
        message:         res.message,
      })
    } catch (err) {
      setStatus({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setSubmitted(false); setReward(null); setAnswers({})
    setComment(''); setStaffRating(null)
    setImageFile(null); setImagePreview('')
    setQuestionPhotos({}); setStep(0)
  }

  if (!user) return null

  const CAMERA_CATEGORIES = ['hygiene', 'food_quality', 'taste', 'portion', 'general']

  // ── Result Screen ────────────────────────────────────────────
  if (submitted && reward) {
    const isFlagged = reward.flagged
    return (
      <>
        <style>{FP_STYLES}</style>
        <div className="fp-result"
          style={{ background: isFlagged ? 'linear-gradient(135deg,#1a0a0a,#2d1a0a)' : 'var(--bg-deep)' }}>
          {/* Background orbs */}
          <div className="fp-bg-orb" style={{ width: 400, height: 400, top: -100, left: -100,
            background: isFlagged ? '#FF5252' : '#6C63FF' }} />
          <div className="fp-bg-orb" style={{ width: 300, height: 300, bottom: -80, right: -80,
            background: isFlagged ? '#FF8C00' : '#00D9A6' }} />

          <div className="fp-result-card">
            <span className="fp-result-icon">{isFlagged ? '⚠️' : '🎉'}</span>
            <div className="fp-result-title">
              {isFlagged ? 'FeedGuard Warning!' : 'Feedback Submitted!'}
            </div>
            <p className="fp-result-sub">
              {isFlagged
                ? 'Your feedback was flagged as suspicious. Give genuine feedback to earn tokens.'
                : 'Thank you for helping improve the mess experience.'}
            </p>

            {!isFlagged && (
              <div className="fp-token-box">
                <div className="fp-token-amount"
                  style={{ background: 'linear-gradient(135deg,#6C63FF,#00D9A6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  🪙 +{reward.tokens_earned} Token{reward.tokens_earned > 1 ? 's' : ''}
                </div>
                <div className="fp-token-total">
                  Total balance: <strong style={{ color: 'var(--text-primary)' }}>{reward.total_tokens}</strong> tokens
                </div>
                {reward.tokens_earned === 10 && (
                  <div style={{ marginTop: 10, fontSize: 13,
                    background: 'rgba(108,99,255,0.2)', borderRadius: 8, padding: '6px 12px',
                    color: 'var(--primary)', fontWeight: 700 }}>
                    ✨ JACKPOT — RARE 10-Token Reward!
                  </div>
                )}
              </div>
            )}

            {isFlagged && (
              <div className="fp-flagged-box">
                <strong style={{ color: 'var(--danger)' }}>Why was I flagged?</strong><br />
                Our AI detected your answers may be random or inconsistent.
                Attaching photos and writing a genuine comment boosts your authenticity score.
              </div>
            )}

            {reward.level_info && !isFlagged && (
              <div className="fp-level-box">
                <div className="fp-level-name">🏅 {reward.level_info.level_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Progress: {reward.level_info.progress_pct}%
                </div>
                <div className="fp-level-bar-bg">
                  <div className="fp-level-bar-fill" style={{ width: `${reward.level_info.progress_pct}%` }} />
                </div>
              </div>
            )}

            {reward.milestone_reward && !isFlagged && (
              <div className="fp-milestone">
                <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>🏆 Milestone Unlocked!</div>
                <div style={{ fontSize: 14 }}>{reward.milestone_reward}</div>
              </div>
            )}

            <div className="fp-result-actions">
              <button className="fp-btn-next" onClick={resetForm}
                style={{ flex: 1 }}>
                {isFlagged ? '🔄 Try Again' : '➕ Submit Another'}
              </button>
              <Link to="/voter" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: '1.5px solid rgba(108,99,255,0.35)', color: 'var(--primary)',
                background: 'rgba(108,99,255,0.07)',
              }}>
                🪙 My Tokens
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Main wizard form ─────────────────────────────────────────
  const progressPct = ((step + 1) / STEPS.length) * 100

  return (
    <>
      <style>{FP_STYLES}</style>
      <div className="fp-page">
        {/* Background orbs */}
        <div className="fp-bg-orb" style={{ width: 500, height: 500, top: -200, left: -150, background: '#6C63FF' }} />
        <div className="fp-bg-orb" style={{ width: 350, height: 350, bottom: 0,  right:  -100, background: '#00D9A6' }} />
        <div className="fp-bg-orb" style={{ width: 250, height: 250, top: '40%', right: '10%', background: '#FF6B9D' }} />

        {/* Sticky step bar */}
        <StepBar current={step} />

        {/* Hero */}
        <div className="fp-hero">
          <span className="fp-hero-icon">🍱</span>
          <h1 className="fp-hero-title">MateMess Feedback</h1>
          <p className="fp-hero-sub">Hey <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>! Your voice improves every meal 🚀</p>

          {/* Meal time slot pills — clickable shortcut for step 0 */}
          <div className="fp-meal-slots">
            {SLOT_INFO.map(s => (
              <button key={s.label} type="button"
                className={`fp-slot-pill${mealType === s.value ? ' fp-slot-pill--active' : ''}`}
                onClick={() => { setMealType(s.value); if (step === 0 && selectedMess) setStep(0) }}>
                {s.icon} {s.label} <span style={{ opacity: 0.6 }}>· {s.time}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="fp-container">

          {/* ── Alert ── */}
          {status && (
            <div className="fp-alert fp-alert--error">
              ⚠️ {status.msg}
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 0 — Select Mess & Meal
          ════════════════════════════════════════ */}
          {step === 0 && (
            <div className="fp-card">
              <div className="fp-section-header">
                <div className="fp-section-icon">📍</div>
                <div>
                  <div className="fp-section-title">Select Your Mess & Meal</div>
                  <div className="fp-section-sub">Tell us where and what you ate</div>
                </div>
              </div>

              <div className="fp-select-grid">
                <div>
                  <label className="label">Mess Location *</label>
                  <select className="input" value={selectedMess}
                    onChange={e => setSelectedMess(e.target.value)}>
                    <option value="">— Select Mess —</option>
                    {messList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Meal Type *</label>
                  <select className="input" value={mealType}
                    onChange={e => setMealType(e.target.value)}>
                    <option value="">— Select Meal —</option>
                    <option value="Breakfast">🌅 Breakfast</option>
                    <option value="Lunch">☀️ Lunch</option>
                    <option value="Dinner">🌙 Dinner</option>
                  </select>
                </div>
              </div>

              {selectedMess && mealType && (
                <div style={{ marginTop: 16, padding: '12px 14px',
                  background: 'rgba(0,217,166,0.07)', border: '1px solid rgba(0,217,166,0.2)',
                  borderRadius: 12, fontSize: 13, color: 'var(--secondary)',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                  animation: 'fp-fadein 0.3s ease forwards' }}>
                  <span>✅</span>
                  <span>Great! Ready to rate your {mealType} experience.</span>
                </div>
              )}

              <div className="fp-nav">
                <button className="fp-btn-next" onClick={goNext}>
                  Next: Rate Your Meal →
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 1 — Questions
          ════════════════════════════════════════ */}
          {step === 1 && (
            <div className="fp-card">
              <div className="fp-section-header">
                <div className="fp-section-icon">❓</div>
                <div>
                  <div className="fp-section-title">Rate Your Meal</div>
                  <div className="fp-section-sub">
                    {Object.keys(answers).length} / {questions.filter(q =>
                      !['photo_upload', 'voice_note'].includes(q.question_type || 'single_select')
                    ).length} answered
                  </div>
                </div>
              </div>

              {questions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                  No questions for this meal. Click Next to continue.
                </div>
              )}

              {questions.map((q, qi) => {
                const qKey     = q.id || q.question_text
                const answered = answers[qKey]
                const qType    = q.question_type || 'single_select'
                const showCam  = CAMERA_CATEGORIES.includes(q.category)

                return (
                  <div key={qKey} className={`fp-q-card${answered ? ' fp-q-card--answered' : ''}`}
                    style={{ animationDelay: `${qi * 0.06}s` }}>
                    <div className="fp-q-num">Q{qi + 1} · {q.category || 'General'}
                      {answered && <span style={{ marginLeft: 8, color: 'var(--secondary)' }}>✓ Answered</span>}
                    </div>
                    <div className="fp-q-text">{q.question_text}</div>
                    {q.menu_item && (
                      <div className="fp-menu-item">🍛 Today: <strong>{q.menu_item}</strong></div>
                    )}

                    {/* single_select / emoji_rating */}
                    {(qType === 'single_select' || qType === 'emoji_rating') && (
                      <div className="fp-emoji-grid">
                        {q.options.map((opt, oi) => {
                          const isSel = answered?.selected_option === opt
                          return (
                            <button key={oi} type="button"
                              className={`fp-emoji-opt${isSel ? ' fp-emoji-opt--selected' : ''}`}
                              onClick={() => recordAnswer(q, opt, { emoji: q.emoji_scale?.[oi] || '' })}>
                              <span className="fp-emoji-opt__face">{q.emoji_scale?.[oi]}</span>
                              {qType === 'single_select' && (
                                <span className="fp-emoji-opt__label">{opt}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* slider */}
                    {qType === 'slider' && (
                      <div className="fp-slider-wrap">
                        <input type="range" min="1" max="10" step="1"
                          className="fp-slider"
                          value={answered?.selected_option || 5}
                          onChange={e => {
                            const val = parseInt(e.target.value)
                            recordAnswer(q, val, { emoji: q.emoji_scale?.[val - 1] || '' })
                          }} />
                        <div className="fp-slider-labels">
                          <span style={{ fontSize: 20 }}>😡</span>
                          <span className="fp-slider-val">{answered?.selected_option || 5} / 10</span>
                          <span style={{ fontSize: 20 }}>😍</span>
                        </div>
                      </div>
                    )}

                    {/* multi_select */}
                    {qType === 'multi_select' && (
                      <div className="fp-multi-wrap">
                        {q.options.map((opt, oi) => {
                          const sel = answers[qKey]?.multi_values?.includes(opt)
                          return (
                            <button key={oi} type="button"
                              className={`fp-multi-tag${sel ? ' fp-multi-tag--selected' : ''}`}
                              onClick={() => toggleMulti(q, opt, q.emoji_scale?.[oi])}>
                              {q.emoji_scale?.[oi]} {opt}{sel && ' ✓'}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* photo_upload */}
                    {qType === 'photo_upload' && (
                      <div className="fp-voice-note" style={{ border: '1px dashed rgba(108,99,255,0.25)' }}>
                        📸 <span>Use the camera button below to capture your meal photo!</span>
                      </div>
                    )}

                    {/* voice_note */}
                    {qType === 'voice_note' && (
                      <div className="fp-voice-note">
                        🎙️ <span>Voice notes coming soon! Leave a written comment in Step 4.</span>
                      </div>
                    )}

                    {/* Per-question camera */}
                    {showCam && (
                      <QuestionCamera
                        questionKey={qKey}
                        captured={questionPhotos[qKey]?.url || null}
                        onCapture={(file, url) => handleQuestionPhoto(qKey, file, url)}
                      />
                    )}
                  </div>
                )
              })}

              <div className="fp-nav">
                <button className="fp-btn-back" onClick={() => setStep(0)}>← Back</button>
                <button className="fp-btn-next" onClick={goNext}>Next: Rate Staff →</button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 2 — Staff Behaviour
          ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="fp-card">
              <div className="fp-section-header">
                <div className="fp-section-icon">🧑‍🍳</div>
                <div>
                  <div className="fp-section-title">Rate Staff Behaviour</div>
                  <div className="fp-section-sub">How was the mess staff during your meal?</div>
                </div>
                {/* emoji style picker */}
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                  <button type="button"
                    onClick={() => setShowEmojiPicker(p => !p)}
                    style={{ fontSize: 22, background: 'rgba(108,99,255,0.08)',
                      border: '1px solid rgba(108,99,255,0.2)', borderRadius: 10,
                      padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                    title="Change emoji style">
                    {staffEmoji}
                  </button>
                  {showEmojiPicker && (
                    <div className="fp-emoji-picker">
                      {EMOJI_FACES.map(em => (
                        <button key={em} className="fp-ep-btn"
                          onClick={() => { setStaffEmoji(em); setShowEmojiPicker(false) }}>
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="fp-staff-grid">
                {STAFF_EMOJIS.map((emoji, i) => (
                  <button key={i} type="button"
                    className={`fp-staff-btn${staffRating === i ? ' fp-staff-btn--active' : ''}`}
                    style={staffRating === i ? {
                      borderColor: STAFF_COLORS[i],
                      background: `${STAFF_COLORS[i]}18`,
                      boxShadow: `0 6px 24px ${STAFF_COLORS[i]}33`,
                    } : {}}
                    onClick={() => setStaffRating(i)}
                    title={STAFF_LABELS[i]}>
                    <div className="fp-staff-face">{staffRating === i ? staffEmoji : emoji}</div>
                    <div className="fp-staff-label" style={staffRating === i ? { color: STAFF_COLORS[i] } : {}}>
                      {STAFF_LABELS[i]}
                    </div>
                  </button>
                ))}
              </div>

              {staffRating !== null && (
                <div style={{ marginTop: 16, padding: '12px 14px',
                  background: `${STAFF_COLORS[staffRating]}14`,
                  border: `1px solid ${STAFF_COLORS[staffRating]}33`,
                  borderRadius: 12, fontSize: 13, fontWeight: 600,
                  color: STAFF_COLORS[staffRating],
                  display: 'flex', alignItems: 'center', gap: 8,
                  animation: 'fp-fadein 0.3s ease forwards' }}>
                  <span>{STAFF_EMOJIS[staffRating]}</span>
                  <span>You rated staff as <strong>{STAFF_LABELS[staffRating]}</strong></span>
                </div>
              )}

              <div className="fp-nav">
                <button className="fp-btn-back" onClick={() => setStep(1)}>← Back</button>
                <button className="fp-btn-next" onClick={goNext}>Next: Optional Extras →</button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 3 — Optional Extras + Submit
          ════════════════════════════════════════ */}
          {step === 3 && (
            <div className="fp-card">
              <div className="fp-section-header">
                <div className="fp-section-icon">📎</div>
                <div>
                  <div className="fp-section-title">Optional Extras</div>
                  <div className="fp-section-sub">Photo & comment boost your AI authenticity score</div>
                </div>
              </div>

              {/* Drop zone */}
              <div style={{ marginBottom: 18 }}>
                <label className="label">
                  Overall Meal Photo
                  <span style={{ marginLeft: 6, color: 'var(--secondary)', fontSize: 11, fontWeight: 600 }}>
                    ⭐ Boosts AI score
                  </span>
                </label>
                <div className="fp-dropzone"
                  onClick={() => mainFileRef.current.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.25)'}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview"
                      style={{ maxHeight: 140, borderRadius: 10, maxWidth: '100%',
                        boxShadow: '0 4px 20px rgba(108,99,255,0.2)' }} />
                  ) : (
                    <>
                      <div className="fp-dropzone__icon">📸</div>
                      <div className="fp-dropzone__text">Click to upload overall meal photo</div>
                      <div className="fp-dropzone__hint">JPG · PNG · WEBP up to 10MB</div>
                    </>
                  )}
                </div>
                <input ref={mainFileRef} type="file" accept="image/*" capture="environment"
                  style={{ display: 'none' }} onChange={handleMainImageChange} />
                {imageFile && (
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview('') }}
                    style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)', background: 'none',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✕ Remove photo
                  </button>
                )}
              </div>

              {/* Comment */}
              <div style={{ marginBottom: 20 }}>
                <label className="label">Additional Comment <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <textarea className="fp-textarea"
                  placeholder="Any specific feedback or suggestions for the mess team..."
                  value={comment} maxLength={300}
                  onChange={e => setComment(e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                  {comment.length}/300
                </div>
              </div>

              {/* FeedGuard notice */}
              <div className="fp-feedguard">
                <div className="fp-feedguard__icon">🛡️</div>
                <div className="fp-feedguard__text">
                  <strong>FeedGuard AI</strong> checks every submission. Random or inconsistent answers reduce tokens
                  and flag a warning. Adding photos and a genuine comment boosts your authenticity score!
                </div>
              </div>

              {/* Submit */}
              <button className="fp-submit" onClick={goNext} disabled={loading}>
                {loading
                  ? <><div className="fp-spinner" /> Submitting...</>
                  : '🚀 Submit & Earn Tokens!'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                🪙 Genuine feedback earns 1–10 tokens · Camera photos boost your score!
              </p>

              <div className="fp-nav" style={{ marginTop: 8 }}>
                <button className="fp-btn-back" onClick={() => setStep(2)}>← Back</button>
              </div>
            </div>
          )}

          {/* Footer */}
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 8 }}>
            MateMess · Logged in as{' '}
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.username}</strong>
            {' · '}
            <Link to="/voter" style={{ color: 'rgba(108,99,255,0.8)' }}>My Tokens</Link>
          </p>
        </div>
      </div>
    </>
  )
}
