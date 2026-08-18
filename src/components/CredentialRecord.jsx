import { describeMetadataUri } from "../utils/credentialModel";
import { shortAddress } from "../utils/learnerStats";
import { QUESTIONS_PER_QUIZ } from "../utils/quiz";

function CredentialRecord({ credential }) {
  if (!credential) return null;

  const issuerLabel =
    credential.issuer?.kind === "contract-owner"
      ? `Contract owner${credential.issuer.address ? ` ${shortAddress(credential.issuer.address)}` : ""}`
      : `Learner${credential.walletAddress ? ` ${shortAddress(credential.walletAddress)}` : ""}`;
  const metadata = describeMetadataUri(credential.metadataUri);

  return (
    <div className="credential-record">
      <p>
        Token #{credential.credentialId} · {credential.credentialType} · {credential.score.totalPoints} pts
      </p>
      <p className="meta-line">
        Verification: {credential.verificationStatus}
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
      {credential.explorerUrl && (
        <p>
          <a href={credential.explorerUrl} target="_blank" rel="noreferrer">Open on Snowtrace</a>
        </p>
      )}
    </div>
  );
}

export default CredentialRecord;
