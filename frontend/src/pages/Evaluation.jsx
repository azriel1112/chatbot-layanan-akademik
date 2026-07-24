import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  ProgressBar,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import {
  BsArrowClockwise,
  BsBarChartFill,
  BsCheckCircleFill,
  BsClockHistory,
  BsDatabaseFill,
  BsDownload,
  BsExclamationTriangleFill,
  BsPeopleFill,
  BsXCircleFill,
} from "react-icons/bs";

import Header from "../components/Header";

import Footer from "../components/Footer";

import {
  getArtifactUrl,
  getConfusionMatrix,
  getEvaluationSummary,
  getLogSummary,
  getMisclassifications,
  getSystemStatus,
} from "../api/evaluationApi";

function MetricCard({ label, value, detail }) {
  return (
    <Card className="metric-card surface-card">
      <Card.Body>
        <span>{label}</span>

        <strong>{Number(value || 0).toFixed(2)}%</strong>

        <ProgressBar now={Number(value || 0)} />

        <small>{detail}</small>
      </Card.Body>
    </Card>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <Card className="log-stat-card surface-card">
      <Card.Body>
        <div className="log-stat-icon">{icon}</div>

        <div>
          <span>{label}</span>

          <strong>{value}</strong>

          <small>{detail}</small>
        </div>
      </Card.Body>
    </Card>
  );
}

function formatIntent(intent) {
  return String(intent || "-").replaceAll("_", " ");
}

export default function Evaluation() {
  const [summary, setSummary] = useState(null);

  const [matrix, setMatrix] = useState(null);

  const [misclassifications, setMisclassifications] = useState([]);

  const [logs, setLogs] = useState(null);

  const [system, setSystem] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [summaryData, matrixData, errorData, logData, systemData] =
        await Promise.all([
          getEvaluationSummary(),
          getConfusionMatrix(),
          getMisclassifications(20),
          getLogSummary(),
          getSystemStatus(),
        ]);

      setSummary(summaryData);

      setMatrix(matrixData);

      setMisclassifications(errorData || []);

      setLogs(logData);

      setSystem(systemData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dashboard evaluasi " + "gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const topIntents = useMemo(() => {
    if (!logs?.intentCounts) {
      return [];
    }

    return Object.entries(logs.intentCounts)
      .slice(0, 8)
      .map(([intent, count]) => ({
        intent,
        count,
      }));
  }, [logs]);

  if (loading) {
    return (
      <div className="app">
        <Header activePage="evaluation" connectionStatus="online" />

        <Container className="evaluation-loading">
          <Spinner animation="border" />

          <strong>Memuat artefak evaluasi dan ringkasan log...</strong>
        </Container>

        <Footer />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="app">
        <Header activePage="evaluation" connectionStatus="offline" />

        <Container className="main-shell">
          <Alert variant="danger" className="runtime-alert">
            <BsExclamationTriangleFill />

            <div>
              <strong>Dashboard evaluasi belum dapat dimuat.</strong>

              <span>{error}</span>

              <small>
                Pastikan folder backend/reports/model-evaluation sudah berisi
                model_metrics.json, confusion_matrix.csv, dan
                misclassified_examples.csv.
              </small>
            </div>

            <Button type="button" variant="danger" onClick={loadDashboard}>
              <BsArrowClockwise />
              Coba Lagi
            </Button>
          </Alert>
        </Container>

        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        activePage="evaluation"
        connectionStatus={system?.status === "healthy" ? "online" : "offline"}
      />

      <Container className="main-shell evaluation-shell">
        <Card className="evaluation-overview surface-card">
          <Card.Body>
            <div>
              <span className="section-kicker">Ringkasan eksperimen</span>

              <h2>{summary.model.algorithm}</h2>

              <p>
                Model dievaluasi menggunakan stratified train-test split dengan
                random seed {summary.model.randomSeed}.
              </p>
            </div>

            <div className="model-facts">
              <Badge bg="primary">{summary.model.datasetSize} utterance</Badge>

              <Badge bg="light" text="dark">
                {summary.model.intentCount} intent
              </Badge>

              <Badge bg="light" text="dark">
                {summary.model.trainingSize} train
              </Badge>

              <Badge bg="light" text="dark">
                {summary.model.testSize} test
              </Badge>

              <Badge bg="light" text="dark">
                {summary.model.vocabularySize} vocabulary
              </Badge>
            </div>
          </Card.Body>
        </Card>

        <Row className="g-4 evaluation-metrics">
          <Col md={6} xl={3}>
            <MetricCard
              label="Accuracy"
              value={summary.metrics.accuracy}
              detail={
                `${summary.model.correctPredictions} ` +
                `dari ${summary.model.testSize} ` +
                "prediksi benar"
              }
            />
          </Col>

          <Col md={6} xl={3}>
            <MetricCard
              label="Macro Precision"
              value={summary.metrics.macroPrecision}
              detail={"Rata-rata precision seluruh intent"}
            />
          </Col>

          <Col md={6} xl={3}>
            <MetricCard
              label="Macro Recall"
              value={summary.metrics.macroRecall}
              detail={"Rata-rata recall seluruh intent"}
            />
          </Col>

          <Col md={6} xl={3}>
            <MetricCard
              label="Macro F1-Score"
              value={summary.metrics.macroF1Score}
              detail={"Rata-rata harmonik precision dan recall"}
            />
          </Col>
        </Row>

        <Row className="g-4 evaluation-section-row">
          <Col xl={8}>
            <Card className="surface-card evaluation-card">
              <Card.Body>
                <div className="evaluation-card-heading">
                  <div>
                    <span className="section-kicker">P4 — Evaluasi model</span>

                    <h2>Confusion Matrix</h2>

                    <p>
                      Baris menunjukkan intent aktual, sedangkan kolom
                      menunjukkan hasil prediksi model.
                    </p>
                  </div>

                  <div className="artifact-actions">
                    <Button
                      as="a"
                      href={getArtifactUrl("confusion_matrix.svg")}
                      target="_blank"
                      rel="noreferrer"
                      variant="outline-primary"
                    >
                      <BsBarChartFill />
                      Ukuran Penuh
                    </Button>

                    <Button
                      as="a"
                      href={getArtifactUrl("confusion_matrix.csv")}
                      variant="outline-secondary"
                    >
                      <BsDownload />
                      CSV
                    </Button>
                  </div>
                </div>

                <div className="confusion-image-wrap">
                  <img
                    src={getArtifactUrl("confusion_matrix.svg")}
                    alt="Confusion matrix intent classifier"
                  />
                </div>

                {matrix?.labels?.length > 0 && (
                  <details className="matrix-details">
                    <summary>Lihat data matriks dalam tabel</summary>

                    <div className="matrix-table-scroll">
                      <Table bordered size="sm">
                        <thead>
                          <tr>
                            <th>Aktual</th>

                            {matrix.labels.map((label) => (
                              <th key={label}>{formatIntent(label)}</th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {matrix.rows.map((row) => (
                            <tr key={row.actualIntent}>
                              <th>{formatIntent(row.actualIntent)}</th>

                              {row.values.map((value, index) => (
                                <td key={`${row.actualIntent}-${index}`}>
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </details>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col xl={4}>
            <Card className="surface-card evaluation-card h-100">
              <Card.Body>
                <span className="section-kicker">Analisis kesalahan</span>

                <h2>Intent dengan F1 Terendah</h2>

                <div className="worst-intent-list">
                  {summary.worstIntents.map((row, index) => (
                    <div key={row.intent} className="worst-intent-item">
                      <span>{index + 1}</span>

                      <div>
                        <strong>{formatIntent(row.intent)}</strong>

                        <small>
                          Precision {row.precision.toFixed(2)}% · Recall{" "}
                          {row.recall.toFixed(2)}%
                        </small>
                      </div>

                      <Badge bg={row.f1Score < 80 ? "warning" : "primary"}>
                        F1 {row.f1Score.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>

                <hr />

                <h3>Pasangan intent yang tertukar</h3>

                <div className="confusion-pair-list">
                  {summary.confusionPairs.map((pair) => (
                    <div key={`${pair.actualIntent}-${pair.predictedIntent}`}>
                      <span>{formatIntent(pair.actualIntent)}</span>

                      <strong>→</strong>

                      <span>{formatIntent(pair.predictedIntent)}</span>

                      <Badge bg="danger">{pair.count}</Badge>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="surface-card evaluation-card evaluation-section-row">
          <Card.Body>
            <div className="evaluation-card-heading">
              <div>
                <span className="section-kicker">Contoh salah klasifikasi</span>

                <h2>Misclassified Examples</h2>

                <p>
                  Data diambil langsung dari hasil evaluasi test set, bukan dari
                  percakapan pengguna.
                </p>
              </div>

              <Button
                as="a"
                href={getArtifactUrl("misclassified_examples.csv")}
                variant="outline-primary"
              >
                <BsDownload />
                Unduh CSV
              </Button>
            </div>

            <div className="evaluation-table-scroll">
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>No.</th>

                    <th>Utterance</th>

                    <th>Intent Aktual</th>

                    <th>Prediksi</th>

                    <th>Confidence</th>
                  </tr>
                </thead>

                <tbody>
                  {misclassifications.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{index + 1}</td>

                      <td>{row.text}</td>

                      <td>
                        <Badge bg="light" text="dark">
                          {formatIntent(row.actualIntent)}
                        </Badge>
                      </td>

                      <td>
                        <Badge bg="danger">
                          {formatIntent(row.predictedIntent)}
                        </Badge>
                      </td>

                      <td>{row.confidence.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        <Row className="g-4 evaluation-section-row">
          <Col xl={5}>
            <Card className="surface-card evaluation-card h-100">
              <Card.Body>
                <span className="section-kicker">Keterbatasan sistem</span>

                <h2>Catatan Evaluasi</h2>

                <ol className="limitation-list">
                  {summary.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ol>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={7}>
            <Card className="surface-card evaluation-card h-100">
              <Card.Body>
                <div className="evaluation-card-heading">
                  <div>
                    <span className="section-kicker">P5 — Log percakapan</span>

                    <h2>Ringkasan Penggunaan Chatbot</h2>

                    <p>
                      Ringkasan agregat ditampilkan tanpa membuka isi raw log
                      kepada publik.
                    </p>
                  </div>

                  <Badge bg="primary">
                    <BsDatabaseFill /> {logs?.storage || "-"}
                  </Badge>
                </div>

                <Row className="g-3 log-stat-grid">
                  <Col sm={6}>
                    <StatCard
                      icon={<BsBarChartFill />}
                      label="Total Turn"
                      value={logs?.totalTurns ?? 0}
                      detail={
                        `${logs?.matchedTurns ?? 0} ` + "memiliki FAQ cocok"
                      }
                    />
                  </Col>

                  <Col sm={6}>
                    <StatCard
                      icon={<BsPeopleFill />}
                      label="Unique Session"
                      value={logs?.uniqueSessions ?? 0}
                      detail={"Session percakapan berbeda"}
                    />
                  </Col>

                  <Col sm={6}>
                    <StatCard
                      icon={<BsXCircleFill />}
                      label="No-Match Rate"
                      value={`${((logs?.noMatchRate ?? 0) * 100).toFixed(2)}%`}
                      detail={
                        `${logs?.noMatchTurns ?? 0} ` + "turn tidak cocok"
                      }
                    />
                  </Col>

                  <Col sm={6}>
                    <StatCard
                      icon={<BsClockHistory />}
                      label="Rata-Rata Proses"
                      value={`${Number(logs?.averageProcessingMs ?? 0).toFixed(
                        2,
                      )} ms`}
                      detail={`P95 ${Number(logs?.p95ProcessingMs ?? 0).toFixed(
                        2,
                      )} ms`}
                    />
                  </Col>
                </Row>

                <div className="top-intent-section">
                  <h3>Intent paling sering ditanyakan</h3>

                  {topIntents.length === 0 ? (
                    <Alert variant="light">
                      Belum ada percakapan yang tercatat. Gunakan chatbot lebih
                      dahulu, lalu muat ulang halaman ini.
                    </Alert>
                  ) : (
                    topIntents.map((row) => (
                      <div key={row.intent} className="top-intent-row">
                        <span>{formatIntent(row.intent)}</span>

                        <Badge bg="primary">{row.count}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Alert variant="success" className="evaluation-status-alert">
          <BsCheckCircleFill />

          <div>
            <strong>Status Sistem</strong>

            <span>
              Flask {system?.status || "-"} · {system?.faqCount || 0} FAQ ·{" "}
              {system?.intentCount || 0} intent · evaluasi{" "}
              {system?.evaluationReady ? "siap" : "belum siap"} · log{" "}
              {system?.logStorageReady ? "aktif" : "bermasalah"}
            </span>
          </div>
        </Alert>
      </Container>

      <Footer />
    </div>
  );
}
