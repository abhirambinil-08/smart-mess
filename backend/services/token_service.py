# ============================================================
#  services/token_service.py  — Token randomisation & rewards
# ============================================================

import random

# ── Token level configuration ─────────────────────────────────
# Format: (min_tokens, max_tokens, level_name, reward_description)
LEVELS = [
    (0,    154,  "🌱 Beginner",        "Keep submitting to unlock rewards!"),
    (154,  369,  "🍎 Food Explorer",   "Reward: Extra fruit 🍎"),
    (369,  649,  "🌟 Mess Influencer", "Reward: Extra roti / add-on 🫓"),
    (649,  1599, "🎩 Food Critic",     "Reward: Priority serving — skip the line! ⚡"),
    (1599, 2999, "🏆 Mess Legend",     "Reward: Free snack or drink 🥤"),
    (2999, 9999, "👑 Ultimate Foodie", "Reward: Special snack pass (one-time) 🎁"),
]

# ── Rare reward milestones ────────────────────────────────────
REWARDS = {
    154:  "🍎 Extra Fruit",
    369:  "🫓 Extra Roti / Add-on",
    649:  "⚡ Priority Serving (Skip the Line!)",
    1599: "🥤 Free Snack / Drink",
    2999: "🎁 Special Snack Pass (One-Time)",
}


def award_tokens() -> int:
    """
    Random token award after each feedback submission.
    Range: 1–10, but 10 is RARE (only ~5% chance).
    
    Distribution:
      - 1–9 : equal probability = 19% each  → total 95%
      - 10  : rare reward                  → 5%
    """
    roll = random.random()   # 0.0 – 1.0

    if roll < 0.05:
        # 5% chance — big reward!
        return 10
    else:
        # 95% chance — normal reward 1–9
        return random.randint(1, 9)


def get_level_info(total_tokens: int) -> dict:
    """Return current level name, reward description, and next milestone."""
    current_level = LEVELS[0]
    next_milestone = LEVELS[1][0]
    next_reward    = LEVELS[1][3]

    for i, (min_t, max_t, name, reward) in enumerate(LEVELS):
        if min_t <= total_tokens < max_t:
            current_level = (min_t, max_t, name, reward)
            # Get next level info if available
            if i + 1 < len(LEVELS):
                next_milestone = LEVELS[i + 1][0]
                next_reward    = LEVELS[i + 1][3]
            else:
                next_milestone = None
                next_reward    = "Maximum level reached! 👑"
            break

    _, max_t, level_name, reward_desc = current_level
    progress_pct = min(100, int((total_tokens - current_level[0]) /
                                max(1, max_t - current_level[0]) * 100))

    return {
        "level_name":     level_name,
        "reward_desc":    reward_desc,
        "next_milestone": next_milestone,
        "next_reward":    next_reward,
        "progress_pct":   progress_pct,
        "total_tokens":   total_tokens,
    }


def check_milestone_reward(old_tokens: int, new_tokens: int) -> str | None:
    """
    Check if the user just crossed a milestone.
    Returns the reward string if they did, else None.
    """
    for milestone, reward in REWARDS.items():
        if old_tokens < milestone <= new_tokens:
            return reward
    return None
