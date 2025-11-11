import { useState } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";

type ScanResult = {
  pageName: string;
  title: string;
  imageUrl: string;
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

  const handleScan = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/vt/scan", {
        method: "POST",
      });
      const data = await response.json();
      setResults(data.results || []);
      setMessage(`Found ${data.results?.length || 0} candidates`);
    } catch (error) {
      setMessage("Error scanning pages");
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
        setMessage(`Skipped: ${pageName}`);
      }
    } catch (error) {
      setMessage(`Error skipping: ${pageName}`);
      console.error(error);
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
          <button onClick={handleScan} disabled={loading}>
            {loading ? "Scanning..." : "Scan Pages"}
          </button>
          <input
            type="text"
            placeholder="Search by title or page name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {message && <div className="message">{message}</div>}

        <div className="stats">
          Showing {filteredResults.length} / {results.length} candidates
        </div>

        <div className="grid">
          {filteredResults.map((result) => (
            <div key={result.pageName} className="card">
              <img src={result.imageUrl} alt={result.title} />
              <div className="card-info">
                <h3>{result.title}</h3>
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
          }

          .stats {
            margin-bottom: 1rem;
            color: #666;
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
        `}</style>
      </div>
    </>
  );
}
