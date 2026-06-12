// FR-05 / FR-06 — pure lifecycle progression rules. No framework imports, no DB.
// Source: playbook phase-gate model (Appendix B); domain contract §3.
import { can, type Role } from "../identity/rbac";
import { MAX_PHASE } from "@/lib/phases";

export type GateState = {
  decision: "approved" | "conditionally_approved" | "not_approved" | null;
};

export type AdvanceResult =
  | { ok: true; nextPhase: number }
  | {
      ok: false;
      reason:
        | "gate_not_decided"
        | "gate_not_approved"
        | "already_final"
        | "not_authorized";
    };

/**
 * Strict linear CPMAI progression, one phase at a time (1→6, no skipping).
 * Check precedence: not_authorized → already_final → gate_not_decided →
 * gate_not_approved. `approved` and `conditionally_approved` advance;
 * `not_approved` and an undecided (NULL) gate block. Phase 6 is final.
 */
export function evaluateAdvance(
  currentPhase: number,
  gate: GateState,
  role: Role,
): AdvanceResult {
  if (!can(role, "phase.advance")) {
    return { ok: false, reason: "not_authorized" };
  }
  if (currentPhase >= MAX_PHASE) {
    return { ok: false, reason: "already_final" };
  }
  if (gate.decision === null) {
    return { ok: false, reason: "gate_not_decided" };
  }
  if (gate.decision === "not_approved") {
    return { ok: false, reason: "gate_not_approved" };
  }
  return { ok: true, nextPhase: currentPhase + 1 };
}

/** Gate sign-off is restricted to Governance Lead and Executive Sponsor (spec §5). */
export function canDecideGate(role: Role): boolean {
  return role === "governance_lead" || role === "executive_sponsor";
}
