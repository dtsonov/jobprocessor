import React, { useEffect, useState } from 'react';
import './App.css';

interface Job {
  id: string;
  prompt: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  result?: string;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const API_BASE = 'http://localhost:3000';

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      setNetworkError(false);
      setError(null);
      const response = await fetch(`${API_BASE}/jobs`);

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setNetworkError(true);
      setError('Failed to fetch jobs. Is the backend running?');
    }
  };

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Poll for job updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      const newJob = await response.json();
      setJobs([newJob, ...jobs]);
      setPrompt('');
      setError(null);
    } catch (err) {
      console.error('Submit error:', err);
      setNetworkError(true);
      setError('Failed to create job. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const parseResult = (result: string | undefined): any => {
    if (!result) return null;
    try {
      return JSON.parse(result);
    } catch {
      // Simulate hallucinated response
      return {
        success: false,
        message: 'Malformed response from AI',
        raw: result
      };
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Job Processor</h1>
        <p>Submit tasks and watch them get processed in real-time</p>
      </header>

      <main className="container">
        <section className="form-section">
          <form onSubmit={handleSubmit} className="job-form">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your job prompt here..."
              disabled={isLoading || networkError}
              className="prompt-input"
            />
            <button 
              type="submit" 
              disabled={isLoading || networkError}
              className="submit-btn"
            >
              {isLoading ? 'Submitting...' : 'Submit Job'}
            </button>
          </form>

          {error && (
            <div className={`error-message ${networkError ? 'network-error' : ''}`}>
              ⚠️ {error}
            </div>
          )}

          {networkError && (
            <div className="connection-status offline">
              🔌 Backend connection failed
            </div>
          )}
        </section>

        <section className="jobs-section">
          <h2>Jobs ({jobs.length})</h2>
          
          {jobs.length === 0 ? (
            <p className="empty-state">No jobs yet. Submit one above to get started!</p>
          ) : (
            <div className="jobs-list">
              {jobs.map((job) => {
                const result = parseResult(job.result);
                const isMalformed = result?.success === false && result?.message === 'Malformed response from AI';

                return (
                  <div key={job.id} className="job-card">
                    <div className="job-header">
                      <h3>{job.prompt.substring(0, 50)}...</h3>
                      <span className={`status ${job.status.toLowerCase()}`}>
                        {job.status === 'PENDING' ? '⏳' : '✅'} {job.status}
                      </span>
                    </div>

                    <div className="job-details">
                      <p><strong>ID:</strong> {job.id}</p>
                      <p><strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}</p>
                    </div>

                    {job.result && (
                      <div className="job-result">
                        <strong>Result:</strong>
                        {isMalformed ? (
                          <div className="error-result">
                            ❌ Hallucinated Response (malformed JSON)
                            <pre>{result.raw}</pre>
                          </div>
                        ) : (
                          <pre>{JSON.stringify(result, null, 2)}</pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
