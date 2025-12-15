import { useState } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";

type ScanResult = {
  pageName: string;
  title: string;
  imageUrl: string;
  linkType?: "forward" | "backward" | "2hop";
};

export const getServerSideProps: GetServerSideProps = async () => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return {
      notFound: true,
    };
  }

  return {
    props: {},
  };
};

export default function AdminVTPage() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [scrapboxUrl, setScrapboxUrl] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const handleScan = async () => {
    setLoading(true);
    setMessage("🔍 Scanning pages...");
    setResults([]); // Clear previous results
    setSelectedPages(new Set()); // Clear selections
    try {
      const response = await fetch("/api/vt/scan", {
        method: "POST",
      });
      const data = await response.json();
      setResults(data.results || []);
      setMessage(`✅ Found ${data.results?.length || 0} candidates`);
    } catch (error) {
      setMessage("❌ Error scanning pages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRelated = async () => {
    if (!scrapboxUrl.trim()) {
      setMessage("⚠️ Please enter a Scrapbox URL");
      return;
    }

    setLoading(true);
    setMessage("🔍 Fetching related pages...");
    setResults([]); // Clear previous results
    setSelectedPages(new Set()); // Clear selections
    try {
      const response = await fetch("/api/vt/fetch-related", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapboxUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch");
      }

      setResults(data.results || []);
      setMessage(
        `✅ Found ${data.results?.length || 0} related pages (→${data.stats.forward} ←${data.stats.backward} ↔${data.stats["2hop"]})`
      );
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (pageName: string) => {
    try {
      const response = await fetch("/api/vt/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageName }),
      });
      const data = await response.json();
      if (data.success) {
        setResults(results.filter((r) => r.pageName !== pageName));
        setMessage(`Added: ${pageName} (ID: ${data.id})`);
      }
    } catch (error) {
      setMessage(`Error adding: ${pageName}`);
      console.error(error);
    }
  };

  const handleSkip = async (pageName: string) => {
    try {
      const response = await fetch("/api/vt/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageName }),
      });
      const data = await response.json();
      if (data.success) {
        setResults(results.filter((r) => r.pageName !== pageName));
        setSelectedPages((prev) => {
          const next = new Set(prev);
          next.delete(pageName);
          return next;
        });
        setMessage(`Skipped: ${pageName}`);
      }
    } catch (error) {
      setMessage(`Error skipping: ${pageName}`);
      console.error(error);
    }
  };

  const toggleSelection = (pageName: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageName)) {
        next.delete(pageName);
      } else {
        next.add(pageName);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPages.size === filteredResults.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(filteredResults.map((r) => r.pageName)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedPages.size === 0) {
      setMessage("⚠️ No pages selected");
      return;
    }

    setMessage(`Adding ${selectedPages.size} pages...`);
    const addedPages: string[] = [];
    const failedPages: string[] = [];

    for (const pageName of Array.from(selectedPages)) {
      try {
        const response = await fetch("/api/vt/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageName }),
        });
        const data = await response.json();
        if (data.success) {
          addedPages.push(pageName);
        } else {
          failedPages.push(pageName);
        }
      } catch (error) {
        failedPages.push(pageName);
        console.error(`Error adding ${pageName}:`, error);
      }
    }

    // Remove added pages from results
    setResults(results.filter((r) => !addedPages.includes(r.pageName)));
    setSelectedPages(new Set());

    if (failedPages.length === 0) {
      setMessage(`✅ Added ${addedPages.length} pages`);
    } else {
      setMessage(
        `⚠️ Added ${addedPages.length}, failed ${failedPages.length} pages`
      );
    }
  };

  const filteredResults = results.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.pageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Visual Thinking Admin - NISHIO Hirokazu</title>
      </Head>
      <div className="admin-page">
        <h1>Visual Thinking Admin</h1>

        <div className="controls">
          <button onClick={handleScan} disabled={loading} className="scan-button">
            {loading ? (
              <>
                <span className="spinner"></span>
                Scanning...
              </>
            ) : (
              "Scan Pages"
            )}
          </button>
        </div>

        <div className="controls">
          <input
            type="text"
            placeholder="Scrapbox URL (e.g., https://scrapbox.io/nishio/ページ名)"
            value={scrapboxUrl}
            onChange={(e) => setScrapboxUrl(e.target.value)}
            className="url-input"
          />
          <button onClick={handleFetchRelated} disabled={loading} className="fetch-button">
            Fetch Related Pages
          </button>
        </div>

        <div className="controls">
          <input
            type="text"
            placeholder="Search by title or page name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {message && (
          <div className={`message ${loading ? "loading" : ""}`}>{message}</div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="stats">
              <span>
                Showing {filteredResults.length} / {results.length} candidates
              </span>
              <span> | Selected: {selectedPages.size}</span>
            </div>
            <div className="bulk-actions">
              <button onClick={toggleSelectAll} className="btn-select-all">
                {selectedPages.size === filteredResults.length ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={handleAddSelected}
                disabled={selectedPages.size === 0}
                className="btn-add-selected"
              >
                Add Selected ({selectedPages.size})
              </button>
            </div>
          </>
        )}

        <div className="grid">
          {filteredResults.map((result) => (
            <div key={result.pageName} className="card">
              <div className="card-checkbox">
                <input
                  type="checkbox"
                  checked={selectedPages.has(result.pageName)}
                  onChange={() => toggleSelection(result.pageName)}
                />
              </div>
              <img src={result.imageUrl} alt={result.title} />
              <div className="card-info">
                <h3>
                  <a
                    href={`https://scrapbox.io/nishio/${encodeURIComponent(result.pageName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="title-link"
                  >
                    {result.title}
                  </a>
                  {result.linkType && (
                    <span className={`link-badge badge-${result.linkType}`}>
                      {result.linkType === "forward" && "→"}
                      {result.linkType === "backward" && "←"}
                      {result.linkType === "2hop" && "↔"}
                    </span>
                  )}
                </h3>
                <p className="page-name">{result.pageName}</p>
                <div className="card-actions">
                  <button
                    className="btn-add"
                    onClick={() => handleAdd(result.pageName)}
                  >
                    Add
                  </button>
                  <button
                    className="btn-skip"
                    onClick={() => handleSkip(result.pageName)}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          .admin-page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
          }

          h1 {
            margin-bottom: 2rem;
          }

          .controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            align-items: center;
          }

          .url-input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
          }

          button {
            padding: 0.75rem 1.5rem;
            background-color: #0070f3;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
          }

          button:hover {
            background-color: #0051cc;
          }

          button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }

          .scan-button {
            position: relative;
          }

          .spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin-right: 0.5rem;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .search-input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
          }

          .message {
            padding: 1rem;
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-weight: 500;
          }

          .message.loading {
            background-color: #fff3e0;
            border-color: #ff9800;
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          .stats {
            margin-bottom: 1rem;
            color: #666;
            display: flex;
            gap: 1rem;
            align-items: center;
          }

          .bulk-actions {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .btn-select-all {
            background-color: #9c27b0;
          }

          .btn-select-all:hover {
            background-color: #7b1fa2;
          }

          .btn-add-selected {
            background-color: #4caf50;
          }

          .btn-add-selected:hover {
            background-color: #45a049;
          }

          .btn-add-selected:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background-color: white;
            position: relative;
          }

          .card-checkbox {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 10;
          }

          .card-checkbox input[type="checkbox"] {
            width: 24px;
            height: 24px;
            cursor: pointer;
          }

          .card img {
            width: 100%;
            height: 200px;
            object-fit: contain;
            background-color: #f9f9f9;
          }

          .card-info {
            padding: 1rem;
          }

          .card-info h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
          }

          .title-link {
            color: #0070f3;
            text-decoration: none;
          }

          .title-link:hover {
            text-decoration: underline;
          }

          .page-name {
            color: #666;
            font-size: 0.9rem;
            margin: 0 0 1rem 0;
          }

          .card-actions {
            display: flex;
            gap: 0.5rem;
          }

          .card-actions button {
            flex: 1;
            padding: 0.5rem;
            font-size: 0.9rem;
          }

          .btn-add {
            background-color: #4caf50;
          }

          .btn-add:hover {
            background-color: #45a049;
          }

          .btn-skip {
            background-color: #ff9800;
          }

          .btn-skip:hover {
            background-color: #e68900;
          }

          .link-badge {
            display: inline-block;
            margin-left: 0.5rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
          }

          .badge-forward {
            background-color: #e3f2fd;
            color: #1976d2;
          }

          .badge-backward {
            background-color: #f3e5f5;
            color: #7b1fa2;
          }

          .badge-2hop {
            background-color: #fff3e0;
            color: #f57c00;
          }
        `}</style>
      </div>
    </>
  );
}
