import { describeMetadataUri } from "../utils/credentialModel";
import { shortAddress } from "../utils/learnerStats";
import { QUESTIONS_PER_QUIZ } from "../utils/quiz";
import { EXPLORER_LINK_LABEL, resolveCredentialStatus } from "../utils/credentialStatus";
import { safeExternalHref } from "../utils/frontendSecurity";
import CredentialStatusBadge from "./CredentialStatusBadge";

function CredentialRecord({ credential }) {
  if (!credential) return null;

  const state = resolveCredentialStatus(credential);
  const issuerLabel =
    state.id === "attested"
      ? `Contract owner${credential.issuer?.address ? ` ${shortAddress(credential.issuer.address)}` : ""}`
      : `Learner${credential.walletAddress ? ` ${shortAddress(credential.walletAddress)}` : ""}`;
  const metadata = describeMetadataUri(credential.metadataUri);

  return (
    <div className={`credential-record credential-record-${state.id}`}>
      <div className="credential-record-head">
        <CredentialStatusBadge status={state} />
        <p>
          Token #{credential.credentialId} · {state.title} · {credential.score.totalPoints} pts
        </p>
      </div>
      <p className="credential-record-honesty">{state.body}</p>
      <p className="meta-line">
        Status · {state.label}
        {credential.walletAddress ? ` · Wallet ${shortAddress(credential.walletAddress)}` : ""}
      </p>
      <p className="meta-line">
        Easy {credential.difficulty.easy.correct}/{QUESTIONS_PER_QUIZ}
        {credential.difficulty.easy.complete ? " complete" : ""}
        {" · "}
        Medium {credential.difficulty.medium.correct}/{QUESTIONS_PER_QUIZ}
        {credential.difficulty.medium.complete ? " complete" : ""}
        {" · "}
        Hard {credential.difficulty.hard.correct}/{QUESTIONS_PER_QUIZ}
        {credential.difficulty.hard.complete ? " complete" : ""}
      </p>
      <p className="meta-line">
        Puzzle {credential.completion.puzzlePieces}/{credential.completion.puzzleTotal}
        {" · "}
        Quiz {credential.completion.quizCorrect}/{credential.completion.quizTotal}
      </p>
      <p className="meta-line">Issuer: {issuerLabel}</p>
      <p className="meta-line">
        Contract {shortAddress(credential.contractAddress) || "not set"} · Chain {credential.chainId}
        {" · "}
        Schema v{credential.version?.schema ?? credential.schemaVersion}
      </p>
      {metadata && <p className="meta-line">Metadata: {metadata}</p>}
      {safeExternalHref(credential.explorerUrl) && (
        <p>
          <a href={safeExternalHref(credential.explorerUrl)} target="_blank" rel="noopener noreferrer">{EXPLORER_LINK_LABEL}</a>
        </p>
      )}
    </div>
  );
}

export default CredentialRecord;
