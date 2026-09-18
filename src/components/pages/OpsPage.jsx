import { useCallback, useEffect, useMemo, useState } from "react";
import { QUESTION_STATUSES } from "../../utils/backend/schema.js";
import { listRecentAnalytics, summarizeAnalyticsFunnel } from "../../utils/rtdb/analytics.js";
import {
  describeBankHealth,
  importBundledBank,
  listAllQuestions,
  publishSection,
  saveQuestion,
} from "../../utils/rtdb/questionBank.js";
import { Button, Card } from "../ui/primitives";

const SECTIONS = ["easy", "medium", "hard", "master"];
const STATUS_OPTIONS = Object.values(QUESTION_STATUSES);

function emptyDraft(sectionId = "easy") {
  return {
    id: "",
    sectionId,
    topic: "general",
    question: "",
    options: ["", "", "", ""],
    answer: "",
    explanation: "",
    status: QUESTION_STATUSES.draft,
  };
}

function OpsPage({ uid, onBack }) {
  const [tab, setTab] = useState("health");
  const [questions, setQuestions] = useState([]);
  const [draft, setDraft] = useState(() => emptyDraft());
  const [filterSection, setFilterSection] = useState("easy");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [funnel, setFunnel] = useState({ byType: {}, bySection: {}, total: 0 });

  const health = useMemo(
    () => SECTIONS.map((id) => describeBankHealth(id)),
    [questions]
  );

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [rows, events] = await Promise.all([
        listAllQuestions(),
        listRecentAnalytics(300),
      ]);
      setQuestions(rows);
      setFunnel(summarizeAnalyticsFunnel(events));
    } catch (err) {
      setError(err?.message || "Could not load ops data.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = questions.filter((q) => q.sectionId === filterSection);

  async function run(action) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await action();
      if (result?.error) setError(result.error);
      else if (result?.message) setMessage(result.message);
      await refresh();
    } catch (err) {
      setError(err?.message || "Ops action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page ops-page">
      <header className="page-header">
        <p className="kicker">Wave B · Operator</p>
        <h1>Question ops & analytics</h1>
        <p className="lede">
          Manage the RTDB question bank and review learning analytics. This is not issuer attestation.
          Seating math stays on the frozen Easy / Medium / Hard scale.
        </p>
        <div className="quiz-nav">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          <Button variant="secondary" disabled={busy} onClick={() => refresh()}>Refresh</Button>
        </div>
        {message ? <p className="meta-line" role="status">{message}</p> : null}
        {error ? <p className="meta-line feedback-banner-alert" role="alert">{error}</p> : null}
      </header>

      <div className="ops-tabs" role="tablist">
        {[
          ["health", "Bank health"],
          ["questions", "Questions"],
          ["analytics", "Analytics"],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? "primary" : "secondary"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "health" ? (
        <section className="section-block">
          <h2>Bank health</h2>
          <div className="ops-grid">
            {health.map((row) => (
              <Card key={row.sectionId} className="ops-card">
                <p className="kicker">{row.sectionId}</p>
                <h3>{row.name}</h3>
                <p className="meta-line">
                  {row.size} questions · need {row.needed} · {row.ok ? "Ready" : "Short"}
                </p>
                <p className="meta-line">Published overlay: {row.publishedOverlay}</p>
                <p className="meta-line">Topics: {row.topics.slice(0, 8).join(", ") || "—"}</p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const result = await publishSection(row.sectionId, uid);
                      return {
                        ...result,
                        message: result.ok
                          ? `Published ${result.count} questions for ${row.sectionId}.`
                          : result.error,
                      };
                    })
                  }
                >
                  Publish section
                </Button>
              </Card>
            ))}
          </div>
          <div className="quiz-nav">
            <Button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const result = await importBundledBank({
                    uid,
                    status: QUESTION_STATUSES.draft,
                  });
                  return {
                    ...result,
                    message: result.ok
                      ? `Imported ${result.count} bundled questions as DRAFT.`
                      : "Import failed.",
                  };
                })
              }
            >
              Import bundled bank (draft)
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const result = await importBundledBank({
                    uid,
                    status: QUESTION_STATUSES.published,
                  });
                  if (!result.ok) return result;
                  for (const id of SECTIONS) {
                    await publishSection(id, uid);
                  }
                  return {
                    ok: true,
                    message: `Imported ${result.count} as PUBLISHED and refreshed live banks.`,
                  };
                })
              }
            >
              Import + publish all
            </Button>
          </div>
        </section>
      ) : null}

      {tab === "questions" ? (
        <section className="section-block">
          <h2>Questions</h2>
          <label className="auth-field">
            <span>Section</span>
            <select
              value={filterSection}
              onChange={(event) => {
                setFilterSection(event.target.value);
                setDraft((current) => ({ ...current, sectionId: event.target.value }));
              }}
            >
              {SECTIONS.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </label>

          <Card className="ops-editor">
            <p className="kicker">Editor</p>
            <label className="auth-field">
              <span>Id</span>
              <input
                value={draft.id}
                onChange={(event) => setDraft((d) => ({ ...d, id: event.target.value }))}
                placeholder="easy-custom-001"
              />
            </label>
            <label className="auth-field">
              <span>Topic</span>
              <input
                value={draft.topic}
                onChange={(event) => setDraft((d) => ({ ...d, topic: event.target.value }))}
              />
            </label>
            <label className="auth-field">
              <span>Prompt</span>
              <textarea
                rows={3}
                value={draft.question}
                onChange={(event) => setDraft((d) => ({ ...d, question: event.target.value }))}
              />
            </label>
            {draft.options.map((option, index) => (
              <label key={`opt-${index}`} className="auth-field">
                <span>Option {index + 1}</span>
                <input
                  value={option}
                  onChange={(event) => {
                    const next = draft.options.slice();
                    next[index] = event.target.value;
                    setDraft((d) => ({ ...d, options: next }));
                  }}
                />
              </label>
            ))}
            <label className="auth-field">
              <span>Answer (exact option text)</span>
              <input
                value={draft.answer}
                onChange={(event) => setDraft((d) => ({ ...d, answer: event.target.value }))}
              />
            </label>
            <label className="auth-field">
              <span>Explanation</span>
              <textarea
                rows={2}
                value={draft.explanation}
                onChange={(event) => setDraft((d) => ({ ...d, explanation: event.target.value }))}
              />
            </label>
            <label className="auth-field">
              <span>Status</span>
              <select
                value={draft.status}
                onChange={(event) => setDraft((d) => ({ ...d, status: event.target.value }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <div className="quiz-nav">
              <Button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const result = await saveQuestion(
                      { ...draft, sectionId: filterSection },
                      uid
                    );
                    if (result.ok) setDraft(emptyDraft(filterSection));
                    return {
                      ...result,
                      message: result.ok ? "Question saved." : result.error,
                    };
                  })
                }
              >
                Save question
              </Button>
              <Button variant="secondary" onClick={() => setDraft(emptyDraft(filterSection))}>
                Clear
              </Button>
            </div>
          </Card>

          <ol className="ops-question-list">
            {filtered.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  className="ops-question-row"
                  onClick={() =>
                    setDraft({
                      id: q.id,
                      sectionId: q.sectionId,
                      topic: q.topic || "general",
                      question: q.question || "",
                      options: [...(q.options || []), "", "", "", ""].slice(0, 4),
                      answer: q.answer || "",
                      explanation: q.explanation || "",
                      status: q.status || QUESTION_STATUSES.draft,
                    })
                  }
                >
                  <span className="kicker">{q.status}</span>
                  <strong>{q.id}</strong>
                  <span className="meta-line">{q.question}</span>
                </button>
              </li>
            ))}
          </ol>
          {!filtered.length ? <p className="meta-line">No RTDB questions for this section yet.</p> : null}
        </section>
      ) : null}

      {tab === "analytics" ? (
        <section className="section-block">
          <h2>Analytics funnel</h2>
          <p className="meta-line">{funnel.total} recent events (RTDB). Not issuer-attested.</p>
          <div className="ops-grid">
            <Card className="ops-card">
              <p className="kicker">By type</p>
              <ul className="ops-stat-list">
                {Object.entries(funnel.byType).map(([type, count]) => (
                  <li key={type}>{type}: {count}</li>
                ))}
              </ul>
              {!Object.keys(funnel.byType).length ? <p className="meta-line">No events yet.</p> : null}
            </Card>
            <Card className="ops-card">
              <p className="kicker">By challenge section</p>
              <ul className="ops-stat-list">
                {Object.entries(funnel.bySection).map(([section, count]) => (
                  <li key={section}>{section}: {count}</li>
                ))}
              </ul>
              {!Object.keys(funnel.bySection).length ? <p className="meta-line">No section tags yet.</p> : null}
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default OpsPage;
